/**
 * @module nomba/types/common
 * @description Types shared by the HTTP client and every service
 */

import type { TokenStore } from "../../lib/token-store.js";
import type { OutcomeEvent, OutcomeHandlers } from "./outcome.types.js";

export type Environment = "production" | "sandbox";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type Query = Record<string, string | number | boolean | undefined>;

export interface NombaOptions {
	clientId: string;
	clientSecret: string;
	/** The parent accountId of the business. */
	accountId: string;
	/** Credentials and environment must match. Defaults to "production". */
	environment?: Environment;
	/** Where the token is kept. Defaults to an in-memory store; see TokenStore for multi-instance setups. */
	tokenStore?: TokenStore;
	/**
	 * Called when the token store fails. Requests keep working from this process's own copy of the
	 * token, so store errors never fail a call. Defaults to console.warn.
	 */
	onStoreError?: (error: unknown) => void;
	/** Per-request timeout in milliseconds. Defaults to 30000. */
	timeoutMs?: number;
	/** Total tries per GET request (or any request hitting 429), including the first. Defaults to 3; 1 turns retries off. Mutating calls always make one attempt; see OutcomeUnknownError. */
	maxAttempts?: number;
	/** Delay before the first retry in milliseconds; it doubles each time. Defaults to 500. */
	retryDelayMs?: number;
	/** The fetch used for every call, e.g. to add a proxy or tracing. Defaults to the global fetch. */
	fetch?: typeof fetch;
	/** Called before each HTTP attempt. For logging and metrics; errors it throws are logged, never raised. */
	onRequest?: (info: RequestInfo) => void;
	/** Called after each HTTP attempt that got a response. Errors it throws are logged, never raised. */
	onResponse?: (info: ResponseInfo) => void;
	/** Called once per money-moving call with how it ended, e.g. to alert on pending or failed payments. */
	onOutcome?: (event: OutcomeEvent) => void;
}

export type RequestInfo = { method: string; path: string; attempt: number };
export type ResponseInfo = RequestInfo & {
	httpStatus: number;
	code?: string;
	durationMs: number;
};

/** Options for one authenticated call made through IHttpClient.request. */
export type HttpRequestOptions = {
	body?: unknown;
	query?: Query;
	/** Body codes that are not errors. Defaults to ["00"]. */
	okCodes?: string[];
	codeField?: string;
	descriptionField?: string;
	/** Resolve `{ code, data }` instead of `data`, so the caller can classify the body code. */
	envelope?: boolean;
	/**
	 * Tracked in `OutcomeUnknownError` so callers know which transaction to requery. Services derive
	 * this from params (e.g., `merchantTxRef`). For non-money-moving operations, a random UUID is
	 * generated if omitted. Money-moving operations (settle) require a caller-provided key.
	 */
	idempotencyKey?: string;
};

/** What request() resolves with `envelope: true`. */
export type ResponseEnvelope<T> = { code: string; data: T };

/** The API also accepts lowercase values (glo, mtn, ...). */
export type Upper = "GLO" | "MTN" | "9MOBILE" | "AIRTEL";

export type Network = Upper | Lowercase<Upper>;

/** Options for a money-moving call: outcome closures (`onSuccess`, `onPending`, `onFailed`). */
export type CallOptions<T, R = T> = OutcomeHandlers<T, R>;
