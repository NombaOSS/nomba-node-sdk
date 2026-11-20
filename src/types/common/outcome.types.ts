/**
 * @module nomba/types/common/outcome
 * @description How a money-moving call ended, and the closures a caller can pass to handle it
 */

import type { NombaError } from "../../lib/errors.js";
import type { HttpMethod } from "./common.types.js";

/**
 * - success: done; safe to fulfil the order.
 * - pending: not final, or not one the docs list. Do not act on it: wait for the webhook or requery.
 * - failed: a definite rejection or a documented REFUND. Safe to tell the customer it failed.
 */
export type Outcome = "success" | "pending" | "failed";

/** The body codes and `data.status` values one endpoint documents. Anything missing is pending. */
export type OutcomeTable = {
	codes: Readonly<Record<string, Outcome>>;
	statuses?: Readonly<Record<string, Outcome>>;
	/** Where the status lives in `data`. Defaults to `data.status` when it is a string. */
	statusOf?: (data: unknown) => string | undefined;
};

export type PendingInfo<T> = {
	/** The response `data`, when a readable response came back. */
	data?: T;
	code?: string;
	status?: string;
	idempotencyKey?: string;
	/** Why the call is pending when no readable response came back (OutcomeUnknownError, UnconfirmedOutcomeError). */
	cause?: unknown;
};

export type FailedInfo<_T = unknown> = {
	error: NombaError;
	data?: undefined;
	code: string;
	status?: undefined;
};

/**
 * Closures for one money-moving call. The call resolves to what the matching closure returns. A missing
 * closure keeps the default: resolve `data`, or throw on a rejection or an undocumented code/status.
 * Errors thrown inside a closure reach the caller untouched.
 */
export type OutcomeHandlers<T, R = T> = {
	onSuccess?: (data: T) => R | Promise<R>;
	onPending?: (info: PendingInfo<T>) => R | Promise<R>;
	onFailed?: (info: FailedInfo<T>) => R | Promise<R>;
};

/** What NombaOptions.onOutcome receives for every money-moving call. */
export type OutcomeEvent = {
	method: HttpMethod;
	path: string;
	outcome: Outcome;
	code?: string;
	status?: string;
	idempotencyKey?: string;
};
