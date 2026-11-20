/**
 * @module nomba/globals/collections
 * @description Nomba SDK for Node.js
 * @description Global Collections resource: DRC mobile money inflows
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 * @see https://developer.nomba.com/docs/products/global-collections/introduction
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { IGlobalCollectionsService } from "../../../interfaces/v1/globals/collections/IGlobalCollectionsService.js";
import { IdempotencyKeyAbsentError } from "../../../lib/errors.js";
import { pathId } from "../../../lib/util.js";
import type {
	CollectionTransaction,
	InflowProvider,
	InflowResult,
	InitiateInflowParams,
} from "../../../types/v1/globals/collections.types.js";

/** Global Collections (v1): DRC mobile money inflows. */
export class GlobalCollectionsService implements IGlobalCollectionsService {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `GET /v1/global-collection/drc/inflow/providers`.
	 * @returns The mobile money providers available for DRC inflows.
	 * @throws {NombaError} The request failed.
	 */
	inflowProviders(): Promise<InflowProvider[]> {
		return this.http.request(
			"GET",
			"/v1/global-collection/drc/inflow/providers",
		);
	}

	/**
	 * `POST /v1/global-collection/inflow/initiate`. Prompts the customer to approve the charge on their phone.
	 * @param params The inflow to initiate. Must include `idempotencyKey` — the SDK never generates
	 * one for you to prevent double collection.
	 * @returns The initiated inflow, including its `transactionReference`.
	 * @throws {IdempotencyKeyAbsentError} `idempotencyKey` is missing or empty.
	 * @throws {NombaError} The inflow params were rejected.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed;
	 * check the transaction status before retrying.
	 */
	async initiateInflow(params: InitiateInflowParams): Promise<InflowResult> {
		const { idempotencyKey } = params;
		if (!idempotencyKey?.trim()) {
			throw new IdempotencyKeyAbsentError(
				"idempotencyKey",
				"/v1/global-collection/inflow/initiate",
			);
		}
		return this.http.request("POST", "/v1/global-collection/inflow/initiate", {
			body: params,
			idempotencyKey,
		});
	}

	/**
	 * `GET /v1/global-collection/transactions/{transactionId}`, with the `transactionReference` from `initiateInflow`.
	 * @param transactionId The transaction reference to look up.
	 * @returns The transaction's current state.
	 * @throws {NombaError} `transactionId` is not found, or the request failed.
	 */
	async getTransaction(transactionId: string): Promise<CollectionTransaction> {
		return this.http.request(
			"GET",
			`/v1/global-collection/transactions/${pathId(transactionId)}`,
		);
	}
}
