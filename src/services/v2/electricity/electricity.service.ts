/**
 * @module nomba/services/v2/electricity
 * @description ElectricityV2 (v2): GET /v2/bill/electricity/lookup, POST /v2/bill/electricity[/{subAccountId}]
 * @see https://developer.nomba.com/docs/api-reference/bills
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { IElectricityV2Service } from "../../../interfaces/v2/electricity/index.js";
import { REJECTED, settle } from "../../../lib/outcome.js";
import { pathId } from "../../../lib/util.js";
import type { CallOptions } from "../../../types/common/common.types.js";
import type { OutcomeTable } from "../../../types/common/outcome.types.js";
import type {
	ElectricityPaymentParams,
	ElectricityPaymentV2Result,
	MeterLookupV2Params,
	MeterLookupV2Result,
} from "../../../types/v2/electricity/electricity.types.js";

// The v2 reference documents code "200" (done) or "201" (still processing), and data.status SUCCESS or
// PENDING_BILLING; anything else is to be treated as pending. The guides show "00" for success too, so we
// accept both. Sandbox calls (2026-09-29) returned "200" + SUCCESS.
const OUTCOMES: OutcomeTable = {
	codes: { "00": "success", "200": "success", "201": "pending", ...REJECTED },
	statuses: { SUCCESS: "success", PENDING_BILLING: "pending" },
};

/**
 * Electricity meter lookup and bill payments. A call that throws a NombaError with a 4xx
 * status was rejected and did nothing. Any other failure (5xx, network error, timeout) leaves the outcome
 * unknown: keep the same `merchantTxRef`, wait for the webhook or requery, and never retry under a new
 * reference.
 */
export class ElectricityV2Service implements IElectricityV2Service {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `GET /v2/bill/electricity/lookup`.
	 * @param params The disco and meter/customer id to look up.
	 * @returns The customer's name and address.
	 * @throws {NombaError} The meter number is invalid or not found, or the request failed.
	 */
	lookupMeter(params: MeterLookupV2Params): Promise<MeterLookupV2Result> {
		return this.http.request("GET", "/v2/bill/electricity/lookup", {
			query: params,
		});
	}

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
	async payElectricity<R = ElectricityPaymentV2Result>(
		params: ElectricityPaymentParams,
		options: CallOptions<ElectricityPaymentV2Result, R> = {},
	): Promise<ElectricityPaymentV2Result | R> {
		return this.#pay("/v2/bill/electricity", params, options);
	}

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
	async payElectricityFromSubAccount<R = ElectricityPaymentV2Result>(
		subAccountId: string,
		params: ElectricityPaymentParams,
		options: CallOptions<ElectricityPaymentV2Result, R> = {},
	): Promise<ElectricityPaymentV2Result | R> {
		return this.#pay(
			`/v2/bill/electricity/${pathId(subAccountId)}`,
			params,
			options,
		);
	}

	#pay<R>(
		path: string,
		params: { merchantTxRef: string },
		options: CallOptions<ElectricityPaymentV2Result, R>,
	): Promise<ElectricityPaymentV2Result | R> {
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
