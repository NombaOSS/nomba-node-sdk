/**
 * @module nomba/interfaces/requery
 * @description Requery service contract
 */

import type {
	Transaction,
	TransactionLookup,
} from "../../../types/v1/requery/requery.types.js";

export interface IRequeryService {
	/**
	 * `GET /v1/transactions/accounts/single`. Looks up one transaction on the parent account.
	 * @param lookup Fields identifying the transaction.
	 * @returns The matching transaction.
	 * @throws {NombaError} No matching transaction, or the lookup was rejected.
	 */
	fetchParentTransaction(lookup: TransactionLookup): Promise<Transaction>;
	/**
	 * `GET /v1/transactions/accounts/{subAccountId}/single`. Looks up one transaction on a sub account.
	 * @param subAccountId The sub account's ID.
	 * @param lookup Fields identifying the transaction.
	 * @returns The matching transaction.
	 * @throws {NombaError} No matching transaction, or the lookup was rejected.
	 */
	fetchSubAccountTransaction(
		subAccountId: string,
		lookup: TransactionLookup,
	): Promise<Transaction>;
	/**
	 * `GET /v1/transactions/requery/{sessionId}`. Use for transfers made through both parent and sub
	 * accounts. Nomba-to-Nomba wallet transfers return no sessionId; use `fetchParentTransaction` or
	 * `fetchSubAccountTransaction` for those instead.
	 * @param sessionId The transfer's session ID.
	 * @returns The matching transaction.
	 * @throws {NombaError} No matching transaction, or the lookup was rejected.
	 */
	requeryBySession(sessionId: string): Promise<Transaction>;
}
