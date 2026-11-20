/**
 * @module nomba/interfaces/global-collections
 * @description GlobalCollections service contract
 */

import type {
	CollectionTransaction,
	InflowProvider,
	InflowResult,
	InitiateInflowParams,
} from "../../../../types/v1/globals/collections.types.js";

export interface IGlobalCollectionsService {
	/**
	 * `GET /v1/global-collection/drc/inflow/providers`.
	 * @returns The mobile money providers available for DRC inflows.
	 * @throws {NombaError} The request failed.
	 */
	inflowProviders(): Promise<InflowProvider[]>;
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
	initiateInflow(params: InitiateInflowParams): Promise<InflowResult>;
	/**
	 * `GET /v1/global-collection/transactions/{transactionId}`, with the `transactionReference` from `initiateInflow`.
	 * @param transactionId The transaction reference to look up.
	 * @returns The transaction's current state.
	 * @throws {NombaError} `transactionId` is not found, or the request failed.
	 */
	getTransaction(transactionId: string): Promise<CollectionTransaction>;
}
