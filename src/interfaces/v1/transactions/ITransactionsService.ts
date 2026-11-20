/**
 * @module nomba/interfaces/transactions
 * @description Transactions service contract
 */

import type { Page } from "../../../lib/util.js";
import type { Transaction } from "../../../types/v1/requery/requery.types.js";
import type {
	BankTransaction,
	BankTransactionList,
	FilterTransactionsParams,
	TransactionList,
	TransactionListParams,
	VirtualAccountTransaction,
	VirtualAccountTransactionParams,
} from "../../../types/v1/transactions/transactions.types.js";

export interface ITransactionsService {
	/**
	 * `GET /v1/transactions/bank`. Credit/debit transactions on the parent account.
	 * @param params Filters and paging (`cursor`, `limit`).
	 * @returns One page of transactions.
	 * @throws {NombaError} The request was rejected.
	 */
	listBankTransactions(
		params?: TransactionListParams,
	): Promise<BankTransactionList>;
	/**
	 * Every credit/debit transaction, across all pages. Starts at `params.cursor` if given.
	 * @param params Filters and the starting cursor.
	 * @throws {NombaError} A page request was rejected.
	 */
	iterateBankTransactions(
		params?: TransactionListParams,
	): AsyncGenerator<BankTransaction>;
	/**
	 * `GET /v1/transactions/virtual`. Documented in the guide only. The response carries a `cursor`, but
	 * the guide names no paging parameter, so only the first page is returned.
	 * @param params The virtual account number and date range.
	 * @returns The first page of transactions.
	 * @throws {NombaError} The request was rejected.
	 */
	listVirtualAccountTransactions({
		accountNumber,
		...dates
	}: VirtualAccountTransactionParams): Promise<Page<VirtualAccountTransaction>>;
	/**
	 * `GET /v1/transactions/accounts`. Transactions on the parent account.
	 * @param params Filters and paging (`cursor`, `limit`).
	 * @returns One page of transactions.
	 * @throws {NombaError} The request was rejected.
	 */
	listParentTransactions(
		params?: TransactionListParams,
	): Promise<TransactionList>;
	/**
	 * Every transaction on the parent account, across all pages. Starts at `params.cursor` if given.
	 * @param params Filters and the starting cursor.
	 * @throws {NombaError} A page request was rejected.
	 */
	iterateParentTransactions(
		params?: TransactionListParams,
	): AsyncGenerator<Transaction>;
	/**
	 * `GET /v1/transactions/accounts/{subAccountId}`. Transactions on a sub account.
	 * @param subAccountId The sub account's ID.
	 * @param params Filters and paging (`cursor`, `limit`).
	 * @returns One page of transactions.
	 * @throws {NombaError} The request was rejected.
	 */
	listSubAccountTransactions(
		subAccountId: string,
		params?: TransactionListParams,
	): Promise<TransactionList>;
	/**
	 * Every transaction on a sub account, across all pages. Starts at `params.cursor` if given.
	 * @param subAccountId The sub account's ID.
	 * @param params Filters and the starting cursor.
	 * @throws {NombaError} A page request was rejected.
	 */
	iterateSubAccountTransactions(
		subAccountId: string,
		params?: TransactionListParams,
	): AsyncGenerator<Transaction>;
	/**
	 * `POST /v1/transactions/accounts`. Filters parent account transactions by criteria too complex for
	 * query params.
	 * @param filter The filter criteria.
	 * @param page Paging (`cursor`, `limit`).
	 * @returns One page of matching transactions.
	 * @throws {NombaError} The request was rejected.
	 */
	filterParentTransactions(
		filter?: FilterTransactionsParams,
		page?: TransactionListParams,
	): Promise<TransactionList>;
	/**
	 * Every parent transaction matching the filter, across all pages. Starts at `page.cursor` if given.
	 * @param filter The filter criteria.
	 * @param page The starting cursor and page size.
	 * @throws {NombaError} A page request was rejected.
	 */
	iterateFilteredParentTransactions(
		filter?: FilterTransactionsParams,
		page?: TransactionListParams,
	): AsyncGenerator<Transaction>;
	/**
	 * `POST /v1/transactions/accounts/{subAccountId}`. Filters a sub account's transactions by criteria too
	 * complex for query params.
	 * @param subAccountId The sub account's ID.
	 * @param filter The filter criteria.
	 * @param page Paging (`cursor`, `limit`).
	 * @returns One page of matching transactions.
	 * @throws {NombaError} The request was rejected.
	 */
	filterSubAccountTransactions(
		subAccountId: string,
		filter?: FilterTransactionsParams,
		page?: TransactionListParams,
	): Promise<TransactionList>;
	/**
	 * Every sub account transaction matching the filter, across all pages. Starts at `page.cursor` if
	 * given.
	 * @param subAccountId The sub account's ID.
	 * @param filter The filter criteria.
	 * @param page The starting cursor and page size.
	 * @throws {NombaError} A page request was rejected.
	 */
	iterateFilteredSubAccountTransactions(
		subAccountId: string,
		filter?: FilterTransactionsParams,
		page?: TransactionListParams,
	): AsyncGenerator<Transaction>;
}
