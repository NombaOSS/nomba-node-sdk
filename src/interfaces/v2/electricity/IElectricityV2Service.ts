/**
 * @module nomba/interfaces/v2/electricity
 * @description Electricity v2 service contract.
 */

import type { CallOptions } from "../../../types/common/common.types.js";
import type {
	ElectricityPaymentParams,
	ElectricityPaymentV2Result,
	MeterLookupV2Params,
	MeterLookupV2Result,
} from "../../../types/v2/electricity/electricity.types.js";

export interface IElectricityV2Service {
	/**
	 * `GET /v2/bill/electricity/lookup`.
	 * @param params The disco and meter/customer id to look up.
	 * @returns The customer's name and address.
	 * @throws {NombaError} The meter number is invalid or not found, or the request failed.
	 */
	lookupMeter(params: MeterLookupV2Params): Promise<MeterLookupV2Result>;

	/**
	 * `POST /v2/bill/electricity`. Pays an electricity bill from the parent account. Prepaid meters get the
	 * token in `meta.phcnToken`.
	 * @param params The disco, meter number and amount, and the `merchantTxRef` used for idempotency.
	 * @param options Outcome closures and per-call overrides; without them, success resolves the result and
	 * a rejection or pending outcome throws.
	 * @returns The payment result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The payment was rejected (4xx).
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	payElectricity<R = ElectricityPaymentV2Result>(
		params: ElectricityPaymentParams,
		options?: CallOptions<ElectricityPaymentV2Result, R>,
	): Promise<ElectricityPaymentV2Result | R>;
	/**
	 * `POST /v2/bill/electricity/{subAccountId}`. Pays from a sub account.
	 * @param subAccountId The sub account to pay from.
	 * @param params The disco, meter number and amount, and the `merchantTxRef` used for idempotency.
	 * @param options Outcome closures and per-call overrides; without them, success resolves the result and
	 * a rejection or pending outcome throws.
	 * @returns The payment result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The payment was rejected (4xx).
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	payElectricityFromSubAccount<R = ElectricityPaymentV2Result>(
		subAccountId: string,
		params: ElectricityPaymentParams,
		options?: CallOptions<ElectricityPaymentV2Result, R>,
	): Promise<ElectricityPaymentV2Result | R>;
}
