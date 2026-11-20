/**
 * @module nomba/lib/errors
 * @description Nomba SDK for Node.js
 * @description Error classes
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 */

/** Thrown for any non-2xx response, or a 2xx whose body `code` is not "00". */
export class NombaError extends Error {
	constructor(
		readonly status: number,
		readonly code: string,
		readonly description: string,
	) {
		super(`[${code}] ${description}`);
		this.name = "NombaError";
	}
}

/**
 * A mutating request failed in a way that does not say whether it was processed (timeout, network error,
 * 5xx, or a 409). The SDK makes one attempt at a mutating call and does not retry automatically: Nomba
 * uses merchantTxRef (in the request body) for idempotency, so an automatic retry with a different reference
 * could double-execute a payment. It may already have gone through. Do not send it again as a new request:
 * check its status (webhook or requery) before deciding whether to retry it yourself, with the same
 * `idempotencyKey` (typically merchantTxRef).
 */
export class OutcomeUnknownError extends Error {
	constructor(
		readonly method: string,
		readonly path: string,
		readonly idempotencyKey: string,
		readonly attempts: number,
		cause: unknown,
	) {
		super(
			`Outcome unknown for ${method} ${path} (idempotencyKey "${idempotencyKey}"); it may have been processed. Check its status (webhook or requery) before retrying it yourself. Do not send it as a new request with a different reference.`,
			{ cause },
		);
		this.name = "OutcomeUnknownError";
	}
}

/**
 * A money-moving call got a readable answer whose body `code` or `data.status` is not one the docs list for
 * that endpoint. The docs say never to act on an undocumented value: the transfer, bill or top-up may still
 * complete. Wait for the webhook or requery the transaction before refunding or retrying.
 */
export class UnconfirmedOutcomeError extends Error {
	constructor(
		readonly method: string,
		readonly path: string,
		/** Which value the docs don't list: the body `code`, or `data.status` (including a missing one). */
		readonly reason: "code" | "status",
		readonly code: string | undefined,
		readonly status: string | undefined,
		readonly data: unknown,
		readonly idempotencyKey: string | undefined,
		cause?: unknown,
	) {
		const what =
			reason === "code"
				? `code "${code}"`
				: status === undefined
					? "missing data.status"
					: `status "${status}"`;
		super(
			`Unconfirmed outcome for ${method} ${path}: undocumented ${what}. It may still complete; wait for the webhook or requery before acting.`,
			{ cause },
		);
		this.name = "UnconfirmedOutcomeError";
	}
}

/** True when a call's result is not final: wait for the webhook or requery, never refund or resend. */
export const isPending = (
	e: unknown,
): e is OutcomeUnknownError | UnconfirmedOutcomeError =>
	e instanceof OutcomeUnknownError || e instanceof UnconfirmedOutcomeError;

/**
 * Getting or renewing the access token failed, so the request itself was never sent. Nothing happened on
 * Nomba's side: fix the credentials or retry later. `cause` holds the underlying error (often a NombaError).
 */
export class TokenError extends Error {
	constructor(cause: unknown) {
		super(
			`Could not get an access token, so the request was not sent: ${cause instanceof Error ? cause.message : String(cause)}`,
			{ cause },
		);
		this.name = "TokenError";
	}
}

/**
 * Thrown when a money-moving request is attempted without a valid idempotency key. The SDK refuses to
 * generate a random key for money-moving operations because doing so can lead to double disbursement:
 * if the request times out and is retried, a new random key would create a duplicate transaction.
 *
 * Always provide a stable, caller-controlled idempotency key (e.g., `merchantTxRef`, `orderReference`,
 * or `idempotencyKey`) so the same reference can be used to safely retry or requery the transaction.
 */
export class IdempotencyKeyAbsentError extends Error {
	constructor(
		/** The field name that must be set in the request body. */
		readonly field: string,
		/** The API endpoint being called. */
		readonly path: string,
	) {
		super(
			`Idempotency key required: set "${field}" in the request body for ${path}. ` +
				`The SDK does not generate random keys for money-moving operations to prevent double disbursement.`,
		);
		this.name = "IdempotencyKeyAbsentError";
	}
}
