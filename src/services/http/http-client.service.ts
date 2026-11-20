/**
 * @module nomba/services/http
 * @description Authenticated HTTP transport: token lifecycle, retries, response envelope
 */

import { randomUUID } from "node:crypto";
import type { IHttpClient } from "../../interfaces/http/IHttpClient.js";
import {
	NombaError,
	OutcomeUnknownError,
	TokenError,
} from "../../lib/errors.js";
import { SDK_VERSION } from "../../lib/sdk-version.js";
import {
	MemoryTokenStore,
	type TokenData,
	type TokenStore,
} from "../../lib/token-store.js";
import { sleep } from "../../lib/util.js";
import type {
	Environment,
	HttpMethod,
	HttpRequestOptions,
	NombaOptions,
} from "../../types/common/common.types.js";
import type { OutcomeEvent } from "../../types/common/outcome.types.js";

const BASE_URLS: Record<Environment, string> = {
	production: "https://api.nomba.com",
	sandbox: "https://sandbox.nomba.com",
};

// Docs: refresh the access_token at least 5 minutes before it expires.
const REFRESH_MARGIN_MS = 5 * 60_000;
// A failed store.set() is retried this many times (100ms, 200ms apart) before giving up on the shared copy.
const SET_RETRIES = 2;

type SendOptions = {
	body?: unknown;
	bearer?: string | undefined;
	okCodes?: string[] | undefined;
	idempotencyKey?: string | undefined;
	codeField?: string | undefined;
	descriptionField?: string | undefined;
	envelope?: boolean | undefined;
};

// Most endpoints return { code, description, data }. Direct debits' create-mandate endpoint instead
// returns { responseCode, responseMessage, data }; codeField/descriptionField below handle that.
type Envelope<T> = Record<string, unknown> & { data: T };

/**
 * Authenticated HTTP transport for the Nomba API: owns the token lifecycle (issue, refresh, revoke,
 * sharing via `TokenStore`) and the retry/idempotency rules for `request`.
 */
export class HttpClient implements IHttpClient {
	readonly environment: Environment;
	readonly #options: NombaOptions;
	readonly #baseUrl: string;
	readonly #store: TokenStore;
	#pending: Promise<TokenData> | undefined;
	// This process's copy of the latest token, used when the shared store is failing.
	#local: TokenData | undefined;
	// True when the last store.set() failed, so #local is newer than whatever the store holds.
	#unsynced = false;

	constructor(options: NombaOptions) {
		this.#options = options;
		this.#store = options.tokenStore ?? new MemoryTokenStore();
		const env = options.environment ?? "production";
		if (!Object.hasOwn(BASE_URLS, env))
			throw new Error(
				`Unknown environment "${env}"; use "production" or "sandbox"`,
			);
		this.environment = env;
		this.#baseUrl = BASE_URLS[env];
	}

	/**
	 * `POST /v1/auth/token/issue`.
	 * @returns The issued token data, saved to the configured `TokenStore`.
	 * @throws {NombaError} The credentials were rejected.
	 */
	issueToken(): Promise<TokenData> {
		return this.#locked(() => this.#issue());
	}

	/**
	 * `POST /v1/auth/token/refresh`.
	 * @returns The refreshed token data, saved to the configured `TokenStore`.
	 * @throws {Error} No token is held yet; call `issueToken()` first.
	 * @throws {NombaError} The refresh token was rejected.
	 */
	refreshToken(): Promise<TokenData> {
		return this.#locked(async () => {
			const t = await this.#read();
			if (!t) throw new Error("No token to refresh; call issueToken() first");
			return this.#refresh(t);
		});
	}

	/**
	 * `POST /v1/auth/token/revoke`. A no-op if no token is held.
	 * @throws {NombaError} Nomba rejected the revoke call.
	 */
	revokeToken(): Promise<void> {
		return this.#locked(async () => {
			const t = await this.#read();
			if (!t) return;
			await this.#send<undefined>("POST", "/v1/auth/token/revoke", {
				body: {
					clientId: this.#options.clientId,
					access_token: t.access_token,
				},
			});
			this.#local = undefined;
			this.#unsynced = false;
			try {
				await this.#store.clear();
			} catch (e) {
				this.#onStoreError(e);
			}
		});
	}

	/**
	 * Authenticated call. Issues or refreshes the token as needed.
	 * Every non-GET call carries an idempotency key, so failures that leave the outcome unknown are retried
	 * safely, and surface as `OutcomeUnknownError` once retries run out.
	 * @param method The HTTP method.
	 * @param path The endpoint path, starting with `/`.
	 * @param options.body The JSON request body.
	 * @param options.query Query string parameters; entries with a `undefined` value are omitted.
	 * @param options.okCodes Body codes that are not errors. Defaults to `["00"]`.
	 * @param options.idempotencyKey Tracked in `OutcomeUnknownError` for non-GET calls; this generic
	 * transport does not send it to Nomba. Put the endpoint's actual idempotency field (for example
	 * `merchantTxRef`) in `options.body`. A random UUID is generated if omitted.
	 * @param options.codeField The response field holding the result code. Defaults to `"code"`.
	 * @param options.descriptionField The response field holding the error description. Defaults to
	 * `"description"`.
	 * @param options.envelope When true, resolves to `{ code, data }` instead of just `data`.
	 * @returns The response body's `data` field (or `{ code, data }` with `envelope: true`).
	 * @throws {TypeError} `path` does not start with `/`.
	 * @throws {TokenError} Getting or refreshing the access token failed; the request was never sent.
	 * @throws {NombaError} A non-2xx response, or a 2xx whose body code is not in `okCodes`.
	 * @throws {OutcomeUnknownError} A non-GET call failed in a way that does not say whether it was
	 * processed (timeout, network error, 5xx, or a 409); check its status before retrying.
	 */
	async request<T>(
		method: HttpMethod,
		path: string,
		{
			body,
			query,
			okCodes,
			idempotencyKey,
			codeField,
			descriptionField,
			envelope,
		}: HttpRequestOptions = {},
	): Promise<T> {
		// The URL is base + path, so a path not starting with "/" (".evil.com", "@evil.com") would change the host
		// and send the bearer token there. Checked before the token is even read.
		if (!path.startsWith("/"))
			throw new TypeError(
				`path must start with "/", like "/v1/...", got ${JSON.stringify(path)}`,
			);
		const qs = new URLSearchParams(
			Object.entries(query ?? {}).flatMap(([k, v]) =>
				v === undefined ? [] : [[k, String(v)] as [string, string]],
			),
		).toString();
		const url = qs ? `${path}?${qs}` : path;
		// One key for every attempt of this call, including the retry after a 401 token renewal.
		// The key is only tracked internally for error reporting (OutcomeUnknownError) and hooks (onOutcome);
		// it is never sent in headers. User-provided values (orderReference, tokenKey, etc.) can contain
		// any characters.
		const key = method === "GET" ? undefined : idempotencyKey || randomUUID();
		const token = await this.#tokenForRequest();
		try {
			return await this.#send<T>(method, url, {
				body,
				bearer: token,
				okCodes,
				idempotencyKey: key,
				codeField,
				descriptionField,
				envelope,
			});
		} catch (e) {
			// Docs: a 401 signals the access_token expired; renew it and retry once.
			if (!(e instanceof NombaError && e.status === 401)) throw e;
			return this.#send<T>(method, url, {
				body,
				bearer: await this.#tokenForRequest(token),
				okCodes,
				idempotencyKey: key,
				codeField,
				descriptionField,
				envelope,
			});
		}
	}

	/** Invokes the configured `onOutcome` hook, if any, swallowing any error it throws. */
	reportOutcome(event: OutcomeEvent): void {
		this.#hook(() => this.#options.onOutcome?.(event));
	}

	// A caller's hook must never break a request: its errors are logged instead.
	#hook(fn: () => void) {
		try {
			fn();
		} catch (e) {
			console.warn("nomba: hook threw", e);
		}
	}

	// The store's lock (if any) makes every auth call exclusive across instances.
	#locked<T>(fn: () => Promise<T>): Promise<T> {
		return this.#store.lock ? this.#store.lock(fn) : fn();
	}

	async #issue(): Promise<TokenData> {
		return this.#save(
			await this.#send<TokenData>("POST", "/v1/auth/token/issue", {
				body: {
					grant_type: "client_credentials",
					client_id: this.#options.clientId,
					client_secret: this.#options.clientSecret,
				},
			}),
		);
	}

	async #refresh(t: TokenData): Promise<TokenData> {
		return this.#save(
			await this.#send<TokenData>("POST", "/v1/auth/token/refresh", {
				body: { grant_type: "refresh_token", refresh_token: t.refresh_token },
				bearer: t.access_token,
			}),
		);
	}

	#onStoreError(e: unknown) {
		(this.#options.onStoreError ?? console.warn)(e);
	}

	async #save(token: TokenData): Promise<TokenData> {
		// Nomba has already rotated the session, so this token must not be lost even if the store fails.
		this.#local = token;
		for (let attempt = 0; ; attempt++) {
			try {
				await this.#store.set(token);
				this.#unsynced = false;
				return token;
			} catch (e) {
				if (attempt === SET_RETRIES) {
					this.#unsynced = true;
					this.#onStoreError(e);
					return token;
				}
				await sleep(100 * (attempt + 1));
			}
		}
	}

	/** The shared store's token, or this process's newer copy when the store is failing or behind. */
	async #read(): Promise<TokenData | undefined> {
		let stored: TokenData | undefined;
		try {
			stored = await this.#store.get();
		} catch (e) {
			this.#onStoreError(e);
			return this.#local;
		}
		const local = this.#local;
		// The store is authoritative unless our last write to it failed.
		if (!local || !this.#unsynced) return stored;
		return !stored || Date.parse(local.expiresAt) > Date.parse(stored.expiresAt)
			? local
			: stored;
	}

	/** A stored token that is not `rejected` and is not within 5 minutes of expiry, else renew. */
	// Token failures happen before the request is sent, so they must never look like a request's outcome.
	async #tokenForRequest(rejected?: string): Promise<string> {
		try {
			return await this.#accessToken(rejected);
		} catch (e) {
			throw new TokenError(e);
		}
	}

	async #accessToken(rejected?: string): Promise<string> {
		const usable = (t: TokenData | undefined): t is TokenData =>
			!!t &&
			t.access_token !== rejected &&
			Date.parse(t.expiresAt) - Date.now() > REFRESH_MARGIN_MS;
		const cached = await this.#read();
		if (usable(cached)) return cached.access_token;
		// One in-flight renewal per process; the lock covers other instances.
		const joined = !!this.#pending;
		this.#pending ??= this.#locked(async () => {
			// Another instance may have renewed while we waited for the lock.
			const current = await this.#read();
			if (usable(current)) return current;
			if (!current) return this.#issue();
			try {
				return await this.#refresh(current);
			} catch (e) {
				// Only a rejected refresh_token warrants a full re-issue; not network, 429 or 5xx errors.
				if (e instanceof NombaError && [400, 401, 403].includes(e.status))
					return this.#issue();
				throw e;
			}
		}).finally(() => {
			this.#pending = undefined;
		});
		const renewed = await this.#pending;
		// A renewal started by a caller that did not know `rejected` may hand back that same token.
		if (joined && renewed.access_token === rejected)
			return this.#accessToken(rejected);
		return renewed.access_token;
	}

	/**
	 * One logical request, retried where that is verified safe:
	 * - 429: never processed (rejected before reaching business logic), so always retried, on GETs and
	 *   mutating calls alike.
	 * - GET: also retried on a timeout, network error, 5xx or 409, since reading data twice is harmless.
	 * - A mutating call (has an idempotencyKey): NOT auto-retried on a timeout, network error, 5xx or 409.
	 *   Nomba uses merchantTxRef in the request body for idempotency, not headers. Retrying automatically
	 *   with a different merchantTxRef could double-execute payments. Such a call fails after one attempt
	 *   with OutcomeUnknownError; the caller decides whether and how to retry (using the same merchantTxRef).
	 * - Any other 4xx, or a non-ok body code: a definite rejection, thrown as is, no retry, for either kind.
	 */
	async #send<T>(
		method: string,
		path: string,
		{
			body,
			bearer,
			okCodes = ["00"],
			idempotencyKey,
			codeField = "code",
			descriptionField = "description",
			envelope = false,
		}: SendOptions = {},
	): Promise<T> {
		const maxAttempts = this.#options.maxAttempts ?? 3;
		const baseDelay = this.#options.retryDelayMs ?? 500;
		const payload = body === undefined ? undefined : JSON.stringify(body);
		for (let attempt = 1; ; attempt++) {
			try {
				const hookPath = path.split("?")[0] ?? path;
				this.#hook(() =>
					this.#options.onRequest?.({ method, path: hookPath, attempt }),
				);
				const started = Date.now();
				const res = await (this.#options.fetch ?? fetch)(this.#baseUrl + path, {
					method,
					headers: {
						accountId: this.#options.accountId,
						"X-Nomba-Sdk-Version": SDK_VERSION,
						"User-Agent": `nomba_node_sdk:v${SDK_VERSION}`,
						...(payload === undefined
							? {}
							: { "Content-Type": "application/json" }),
						...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
					},
					...(payload === undefined ? {} : { body: payload }),
					signal: AbortSignal.timeout(this.#options.timeoutMs ?? 30_000),
				});
				let json: Envelope<T> | null = null;
				try {
					json = (await res.json()) as Envelope<T>;
				} catch {
					// A 2xx we could not read (cut off, timed out mid-body, not JSON): whether it took effect is unknown.
					if (res.ok)
						throw new Error(`Unreadable response (HTTP ${res.status})`);
				}
				// Docs: a 200 does not always mean success; the body's code field must be "00" (or one the
				// caller accepts). Most endpoints call it `code`; codeField lets one call it something else.
				const code = json?.[codeField];
				this.#hook(() =>
					this.#options.onResponse?.({
						method,
						path: hookPath,
						attempt,
						httpStatus: res.status,
						...(typeof code === "string" ? { code } : {}),
						durationMs: Date.now() - started,
					}),
				);
				if (
					!res.ok ||
					!json ||
					typeof code !== "string" ||
					!okCodes.includes(code)
				) {
					throw new NombaError(
						res.status,
						typeof code === "string" ? code : String(res.status),
						(json?.[descriptionField] as string | undefined) ?? res.statusText,
					);
				}
				return (envelope ? { code, data: json.data } : json.data) as T;
			} catch (e) {
				const status = e instanceof NombaError ? e.status : undefined;
				// 409 is "same key still being processed" (retry) or a real key conflict (definite): only the
				// message tells them apart.
				const inFlight =
					status === 409 &&
					/being processed|retry/i.test((e as NombaError).description);
				if (
					status !== undefined &&
					status < 500 &&
					status !== 408 &&
					status !== 429 &&
					!inFlight
				)
					throw e;
				// Verified unsafe to retry a mutating call on anything but 429 (see #send's doc comment).
				const safeToRepeat = status === 429 || method === "GET";
				if (attempt < maxAttempts && safeToRepeat) {
					const delay = baseDelay * 2 ** (attempt - 1);
					await sleep(delay + Math.random() * delay * 0.2);
					continue;
				}
				if (status === 429 || !idempotencyKey) throw e;
				throw new OutcomeUnknownError(method, path, idempotencyKey, attempt, e);
			}
		}
	}
}
