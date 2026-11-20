/**
 * @module nomba/requery
 * @description Nomba SDK for Node.js
 * @description Requery resource
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 * @see https://developer.nomba.com/docs/api-reference/requery
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { IRequeryService } from "../../../interfaces/v1/requery/IRequeryService.js";
import { pathId } from "../../../lib/util.js";
import type {
	Transaction,
	TransactionLookup,
} from "../../../types/v1/requery/requery.types.js";

/** Requery (v1): look up a single transaction's current status. */
export class RequeryService implements IRequeryService {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `GET /v1/transactions/accounts/single`. Looks up a transaction on the parent account by
	 * reference or ID.
	 * @param lookup The transaction identifier (e.g., `transactionId` or `merchantTxRef`).
	 * @returns The transaction's current details and status.
	 * @throws {NombaError} The transaction was not found, or the call failed.
	 */
	fetchParentTransaction(lookup: TransactionLookup): Promise<Transaction> {
		return this.http.request("GET", "/v1/transactions/accounts/single", {
			query: lookup,
		});
	}

	/**
	 * `GET /v1/transactions/accounts/{subAccountId}/single`. Looks up a transaction on a sub account
	 * by reference or ID.
	 * @param subAccountId The sub account's ID.
	 * @param lookup The transaction identifier (e.g., `transactionId` or `merchantTxRef`).
	 * @returns The transaction's current details and status.
	 * @throws {NombaError} The transaction was not found, `subAccountId` does not exist, or the call failed.
	 */
	async fetchSubAccountTransaction(
		subAccountId: string,
		lookup: TransactionLookup,
	): Promise<Transaction> {
		return this.http.request(
			"GET",
			`/v1/transactions/accounts/${pathId(subAccountId)}/single`,
			{
				query: lookup,
			},
		);
	}

	/**
	 * `GET /v1/transactions/requery/{sessionId}`. Looks up a bank transfer by its session ID.
	 * Use this for transfers made through both parent and sub accounts. Note: Nomba-to-Nomba
	 * wallet transfers do not return a `sessionId`; use `fetchParentTransaction` or
	 * `fetchSubAccountTransaction` for those instead.
	 * @param sessionId The transfer's session ID from the original response.
	 * @returns The transaction's current details and status.
	 * @throws {NombaError} The session was not found, or the call failed.
	 */
	async requeryBySession(sessionId: string): Promise<Transaction> {
		return this.http.request(
			"GET",
			`/v1/transactions/requery/${pathId(sessionId)}`,
		);
	}
}
