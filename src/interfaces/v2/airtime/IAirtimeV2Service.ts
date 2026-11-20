/**
 * @module nomba/interfaces/v2/airtime
 * @description Airtime v2 service contract
 */

import type { CallOptions } from "../../../types/common/common.types.js";
import type {
	AirtimePurchaseParams,
	AirtimePurchaseV2Result,
} from "../../../types/v2/airtime/airtime.types.js";

export interface IAirtimeV2Service {
	/**
	 * `POST /v2/bill/topup`. Buys airtime from the parent account.
	 * @param params The phone number, network and amount, and the `merchantTxRef` used for idempotency.
	 * @param options Outcome closures and per-call overrides; without them, success resolves the result and
	 * a rejection or pending outcome throws.
	 * @returns The purchase result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The purchase was rejected (4xx).
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	buyAirtime<R = AirtimePurchaseV2Result>(
		params: AirtimePurchaseParams,
		options?: CallOptions<AirtimePurchaseV2Result, R>,
	): Promise<AirtimePurchaseV2Result | R>;
	/**
	 * `POST /v2/bill/topup/{subAccountId}`. Buys airtime from a sub account.
	 * @param subAccountId The sub account to buy from.
	 * @param params The phone number, network and amount, and the `merchantTxRef` used for idempotency.
	 * @param options Outcome closures and per-call overrides; without them, success resolves the result and
	 * a rejection or pending outcome throws.
	 * @returns The purchase result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The purchase was rejected (4xx).
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	buyAirtimeFromSubAccount<R = AirtimePurchaseV2Result>(
		subAccountId: string,
		params: AirtimePurchaseParams,
		options?: CallOptions<AirtimePurchaseV2Result, R>,
	): Promise<AirtimePurchaseV2Result | R>;
}
