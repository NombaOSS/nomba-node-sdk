/**
 * @module nomba/interfaces/v2/betting
 * @description Betting v2 service contract. v2 has purchase endpoints only.
 */

import type { CallOptions } from "../../../types/common/common.types.js";
import type {
	BettingPaymentParams,
	BettingPaymentV2Result,
} from "../../../types/v2/betting/betting.types.js";

export interface IBettingV2Service {
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
	payBetting<R = BettingPaymentV2Result>(
		params: BettingPaymentParams,
		options?: CallOptions<BettingPaymentV2Result, R>,
	): Promise<BettingPaymentV2Result | R>;
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
	payBettingFromSubAccount<R = BettingPaymentV2Result>(
		subAccountId: string,
		params: BettingPaymentParams,
		options?: CallOptions<BettingPaymentV2Result, R>,
	): Promise<BettingPaymentV2Result | R>;
}
