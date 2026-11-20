/**
 * @module nomba/services/v2/betting
 * @description BettingV2 (v2): POST /v2/bill/betting[/{subAccountId}]
 * @see https://developer.nomba.com/docs/api-reference/bills
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { IBettingV2Service } from "../../../interfaces/v2/betting/index.js";
import { REJECTED, settle } from "../../../lib/outcome.js";
import { pathId } from "../../../lib/util.js";
import type { CallOptions } from "../../../types/common/common.types.js";
import type { OutcomeTable } from "../../../types/common/outcome.types.js";
import type {
	BettingPaymentParams,
	BettingPaymentV2Result,
} from "../../../types/v2/betting/betting.types.js";

// The v2 reference documents code "200" (done) or "201" (still processing), and data.status SUCCESS or
// PENDING_BILLING; anything else is to be treated as pending. Sandbox calls (2026-09-29) returned "200" +
// SUCCESS. The guides show "00" for success too, so we accept both.
const OUTCOMES: OutcomeTable = {
	codes: { "00": "success", "200": "success", "201": "pending", ...REJECTED },
	statuses: { SUCCESS: "success", PENDING_BILLING: "pending" },
};

/**
 * Betting wallet funding (v2 has purchase endpoints only). A call that throws a NombaError with a 4xx
 * status was rejected and did nothing. Any other failure (5xx, network error, timeout) leaves the outcome
 * unknown: keep the same `merchantTxRef`, wait for the webhook or requery, and never retry under a new
 * reference.
 */
export class BettingV2Service implements IBettingV2Service {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `POST /v2/bill/betting`. Funds a betting wallet from the parent account.
	 * @param params The betting provider, customer id and amount, and the `merchantTxRef` used for idempotency.
	 * @param options Outcome closures and per-call overrides; without them, success resolves the result and
	 * a rejection or pending outcome throws.
	 * @returns The payment result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The payment was rejected (4xx).
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	async payBetting<R = BettingPaymentV2Result>(
		params: BettingPaymentParams,
		options: CallOptions<BettingPaymentV2Result, R> = {},
	): Promise<BettingPaymentV2Result | R> {
		return this.#pay("/v2/bill/betting", params, options);
	}

	/**
	 * `POST /v2/bill/betting/{subAccountId}`. Pays from a sub account.
	 * @param subAccountId The sub account to pay from.
	 * @param params The betting provider, customer id and amount, and the `merchantTxRef` used for idempotency.
	 * @param options Outcome closures and per-call overrides; without them, success resolves the result and
	 * a rejection or pending outcome throws.
	 * @returns The payment result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The payment was rejected (4xx).
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	async payBettingFromSubAccount<R = BettingPaymentV2Result>(
		subAccountId: string,
		params: BettingPaymentParams,
		options: CallOptions<BettingPaymentV2Result, R> = {},
	): Promise<BettingPaymentV2Result | R> {
		return this.#pay(
			`/v2/bill/betting/${pathId(subAccountId)}`,
			params,
			options,
		);
	}

	#pay<R>(
		path: string,
		params: { merchantTxRef: string },
		options: CallOptions<BettingPaymentV2Result, R>,
	): Promise<BettingPaymentV2Result | R> {
		return settle(
			this.http,
			"POST",
			path,
			{ body: params },
			OUTCOMES,
			{ field: "merchantTxRef", value: params.merchantTxRef },
			options,
		);
	}
}
