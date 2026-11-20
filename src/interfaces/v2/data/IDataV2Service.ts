/**
 * @module nomba/interfaces/v2/data
 * @description Data v2 service contract
 */

import type { CallOptions } from "../../../types/common/common.types.js";
import type {
	DataPurchaseParams,
	DataPurchaseV2Result,
} from "../../../types/v2/data/data.types.js";

export interface IDataV2Service {
	/**
	 * `POST /v2/bill/data`. Buys a data bundle from the parent account.
	 * @param params The phone number, network and data plan, and the `merchantTxRef` used for idempotency.
	 * @param options Outcome closures and per-call overrides; without them, success resolves the result and
	 * a rejection or pending outcome throws.
	 * @returns The purchase result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The purchase was rejected (4xx).
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	buyData<R = DataPurchaseV2Result>(
		params: DataPurchaseParams,
		options?: CallOptions<DataPurchaseV2Result, R>,
	): Promise<DataPurchaseV2Result | R>;
	/**
	 * `POST /v2/bill/data/{subAccountId}`. Buys a data bundle from a sub account.
	 * @param subAccountId The sub account to buy from.
	 * @param params The phone number, network and data plan, and the `merchantTxRef` used for idempotency.
	 * @param options Outcome closures and per-call overrides; without them, success resolves the result and
	 * a rejection or pending outcome throws.
	 * @returns The purchase result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The purchase was rejected (4xx).
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	buyDataFromSubAccount<R = DataPurchaseV2Result>(
		subAccountId: string,
		params: DataPurchaseParams,
		options?: CallOptions<DataPurchaseV2Result, R>,
	): Promise<DataPurchaseV2Result | R>;
}
