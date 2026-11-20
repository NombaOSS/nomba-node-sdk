/**
 * @module nomba/interfaces/v2/cable
 * @description Cable TV v2 service contract. v2 has purchase endpoints only.
 */

import type { CallOptions } from "../../../types/common/common.types.js";
import type {
	CablePaymentV2Result,
	CableTvSubscriptionParams,
} from "../../../types/v2/cable/cable.types.js";

export interface ICableV2Service {
	/**
	 * `POST /v2/bill/cabletv`. Pays a cable TV subscription from the parent account.
	 * @param params The provider, smartcard/customer id and plan, and the `merchantTxRef` used for idempotency.
	 * @param options Outcome closures and per-call overrides; without them, success resolves the result and
	 * a rejection or pending outcome throws.
	 * @returns The payment result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The payment was rejected (4xx).
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	subscribeCableTv<R = CablePaymentV2Result>(
		params: CableTvSubscriptionParams,
		options?: CallOptions<CablePaymentV2Result, R>,
	): Promise<CablePaymentV2Result | R>;
	/**
	 * `POST /v2/bill/cabletv/{subAccountId}`. Pays from a sub account.
	 * @param subAccountId The sub account to pay from.
	 * @param params The provider, smartcard/customer id and plan, and the `merchantTxRef` used for idempotency.
	 * @param options Outcome closures and per-call overrides; without them, success resolves the result and
	 * a rejection or pending outcome throws.
	 * @returns The payment result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The payment was rejected (4xx).
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	subscribeCableTvFromSubAccount<R = CablePaymentV2Result>(
		subAccountId: string,
		params: CableTvSubscriptionParams,
		options?: CallOptions<CablePaymentV2Result, R>,
	): Promise<CablePaymentV2Result | R>;
}
