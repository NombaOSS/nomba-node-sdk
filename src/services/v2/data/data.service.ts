/**
 * @module nomba/services/v2/data
 * @description DataV2 (v2): POST /v2/bill/data
 * @see https://developer.nomba.com/docs/api-reference/airtime-and-data-vending
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { IDataV2Service } from "../../../interfaces/v2/data/index.js";
import { REJECTED, settle } from "../../../lib/outcome.js";
import { pathId } from "../../../lib/util.js";
import type { CallOptions } from "../../../types/common/common.types.js";
import type { OutcomeTable } from "../../../types/common/outcome.types.js";
import type {
	DataPurchaseParams,
	DataPurchaseV2Result,
} from "../../../types/v2/data/data.types.js";

// The v2 reference documents code "200" (done) or "201" (still processing), and data.status SUCCESS or
// PENDING_BILLING; anything else is to be treated as pending. A sandbox call (2026-09-29) returned "200" +
// SUCCESS. The guides show "00" for success too, so we accept both.
const OUTCOMES: OutcomeTable = {
	codes: { "00": "success", "200": "success", "201": "pending", ...REJECTED },
	statuses: { SUCCESS: "success", PENDING_BILLING: "pending" },
};

/**
 * Data bundle purchases (v2). A call that throws a NombaError with a 4xx status was rejected and did
 * nothing. Any other failure (5xx, network error, timeout) leaves the outcome unknown: keep the same
 * `merchantTxRef`, wait for the webhook or requery, and never retry under a new reference.
 */
export class DataV2Service implements IDataV2Service {
	constructor(private readonly http: IHttpClient) {}

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
	async buyData<R = DataPurchaseV2Result>(
		params: DataPurchaseParams,
		options: CallOptions<DataPurchaseV2Result, R> = {},
	): Promise<DataPurchaseV2Result | R> {
		return this.#buy("/v2/bill/data", params, options);
	}

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
	async buyDataFromSubAccount<R = DataPurchaseV2Result>(
		subAccountId: string,
		params: DataPurchaseParams,
		options: CallOptions<DataPurchaseV2Result, R> = {},
	): Promise<DataPurchaseV2Result | R> {
		return this.#buy(`/v2/bill/data/${pathId(subAccountId)}`, params, options);
	}

	#buy<R>(
		path: string,
		params: DataPurchaseParams,
		options: CallOptions<DataPurchaseV2Result, R>,
	): Promise<DataPurchaseV2Result | R> {
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
