/**
 * @module nomba/lib/outcome
 * @description Classifies a money-moving call as success, pending or failed, using only documented values
 */

import type { IHttpClient } from "../interfaces/http/IHttpClient.js";
import type {
	HttpMethod,
	HttpRequestOptions,
	ResponseEnvelope,
} from "../types/common/common.types.js";
import type {
	Outcome,
	OutcomeHandlers,
	OutcomeTable,
} from "../types/common/outcome.types.js";
import {
	IdempotencyKeyAbsentError,
	isPending,
	NombaError,
	OutcomeUnknownError,
	UnconfirmedOutcomeError,
} from "./errors.js";

/** Documented 4xx body codes (docs/api-basics/response-codes): definite rejections, safe to report as failed. */
export const REJECTED: Readonly<Record<string, "failed">> = {
	"400": "failed",
	"401": "failed",
	"403": "failed",
	"404": "failed",
	"422": "failed",
	"429": "failed",
};

// Own keys only: a status like "constructor" must not match Object.prototype.
const lookup = (
	record: Readonly<Record<string, Outcome>> | undefined,
	key: string | undefined,
): Outcome | undefined =>
	record && key !== undefined && Object.hasOwn(record, key)
		? record[key]
		: undefined;

/** Anything the table does not list is pending: an undocumented value is never acted on. */
export const classify = (
	table: OutcomeTable,
	code: string,
	status: string | undefined,
): Outcome => {
	const byCode = lookup(table.codes, code) ?? "pending";
	if (byCode !== "success" || !table.statuses) return byCode;
	return lookup(table.statuses, status) ?? "pending";
};

const defaultStatusOf = (data: unknown): string | undefined => {
	const s = (data as { status?: unknown } | null)?.status;
	return typeof s === "string" ? s : undefined;
};

/**
 * Makes one money-moving call and settles it into exactly one outcome: success, pending, or failed.
 *
 * With a closure for that outcome, resolves to what the closure returns. Without one:
 * - **success**: resolves `data`
 * - **pending**: throws `UnconfirmedOutcomeError` (undocumented code/status, or documented pending)
 * - **failed**: throws `NombaError` (documented rejection)
 *
 * Transport failures (timeout, network error, 5xx) throw `OutcomeUnknownError`.
 *
 * @template T The response data type.
 * @template R The return type when closures transform the result.
 * @param http The HTTP client to use.
 * @param method The HTTP method (`POST` for money-moving calls).
 * @param path The API endpoint path.
 * @param request The request body and query; `okCodes`, `envelope`, and `idempotencyKey` are set internally.
 * @param table Maps body codes and `data.status` values to outcomes; unlisted values are pending.
 * @param idempotency `value` is the idempotency key, derived from params (e.g., `merchantTxRef`). Tracked
 * in errors so callers know which transaction to requery; not sent in headers. Must be non-empty.
 * `field` is the name of the field in the request body that holds it (e.g., `"merchantTxRef"`). Used in
 * error messages when the key is missing.
 * @param options Outcome closures: `onSuccess`, `onPending`, `onFailed`. Each transforms the result or error.
 * @returns The response `data`, or what the matching closure returns.
 * @throws {IdempotencyKeyAbsentError} The idempotency key is missing or empty.
 * @throws {NombaError} A documented rejection (4xx body code).
 * @throws {OutcomeUnknownError} Transport failure — outcome unknown; requery before retrying.
 * @throws {UnconfirmedOutcomeError} Pending or undocumented response — do not retry without requerying.
 */
export async function settle<T, R = T>(
	http: IHttpClient,
	method: HttpMethod,
	path: string,
	request: Omit<HttpRequestOptions, "okCodes" | "envelope" | "idempotencyKey">,
	table: OutcomeTable,
	{
		field: idempotencyField,
		value: idempotencyKey,
	}: { field: string; value: string },
	options: OutcomeHandlers<T, R> = {},
): Promise<T | R> {
	if (typeof idempotencyKey !== "string" || !idempotencyKey.trim()) {
		throw new IdempotencyKeyAbsentError(idempotencyField, path);
	}
	const { onSuccess, onPending, onFailed } = options;
	const report = (
		outcome: Outcome,
		code?: string,
		status?: string,
		key = idempotencyKey,
	) =>
		http.reportOutcome({
			method,
			path,
			outcome,
			...(code === undefined ? {} : { code }),
			...(status === undefined ? {} : { status }),
			...(key === undefined ? {} : { idempotencyKey: key }),
		});

	let res: ResponseEnvelope<T>;
	try {
		res = await http.request<ResponseEnvelope<T>>(method, path, {
			...request,
			...(idempotencyKey === undefined ? {} : { idempotencyKey }),
			// Only documented non-failure codes come back as data; the rest arrive as NombaError below.
			okCodes: Object.keys(table.codes).filter(
				(c) => lookup(table.codes, c) !== "failed",
			),
			envelope: true,
			...(idempotencyKey === undefined ? {} : { idempotencyKey }),
		});
	} catch (caught) {
		let e = caught;
		// Only a documented rejection (by HTTP status or body code) is a failure. Anything else (a 2xx with an
		// unlisted body code, a 409 key conflict, a 408) may mean the payment went through: unconfirmed, never failed.
		if (
			e instanceof NombaError &&
			lookup(table.codes, String(e.status)) !== "failed" &&
			lookup(table.codes, e.code) !== "failed"
		)
			e = new UnconfirmedOutcomeError(
				method,
				path,
				"code",
				e.code,
				undefined,
				undefined,
				idempotencyKey,
				e,
			);
		if (isPending(e)) {
			const key =
				e instanceof OutcomeUnknownError ? e.idempotencyKey : idempotencyKey;
			const code = e instanceof UnconfirmedOutcomeError ? e.code : undefined;
			report("pending", code, undefined, key);
			if (!onPending) throw e;
			return onPending({
				cause: e,
				...(code === undefined ? {} : { code }),
				...(key === undefined ? {} : { idempotencyKey: key }),
			});
		}
		if (e instanceof NombaError) {
			report("failed", e.code);
			if (!onFailed) throw e;
			return onFailed({ error: e, code: e.code });
		}
		throw e;
	}

	const status = (table.statusOf ?? defaultStatusOf)(res.data);
	const outcome = classify(table, res.code, status);
	report(outcome, res.code, status);
	if (outcome === "success") return onSuccess ? onSuccess(res.data) : res.data;
	if (onPending)
		return onPending({
			data: res.data,
			code: res.code,
			...(status === undefined ? {} : { status }),
			...(idempotencyKey === undefined ? {} : { idempotencyKey }),
		});
	// No onPending: documented or not, pending always throws so it can never be mistaken for success.
	// reason tells what to check when debugging: an unlisted code, or an unlisted status when the code is listed.
	const reason =
		lookup(table.codes, res.code) === undefined
			? "code"
			: status !== undefined && lookup(table.statuses, status) === undefined
				? "status"
				: lookup(table.codes, res.code) === "pending"
					? "code"
					: "status";
	throw new UnconfirmedOutcomeError(
		method,
		path,
		reason,
		res.code,
		status,
		res.data,
		idempotencyKey,
	);
}
