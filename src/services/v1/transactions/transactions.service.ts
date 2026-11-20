/**
 * @module nomba/transactions
 * @description Nomba SDK for Node.js
 * @description Transactions resource
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 * @see https://developer.nomba.com/docs/api-reference/transactions
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { ITransactionsService } from "../../../interfaces/v1/transactions/ITransactionsService.js";
import { paginate } from "../../../lib/paginate.js";
import type { Page } from "../../../lib/util.js";
import { pageQuery, pathId } from "../../../lib/util.js";
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

/** Transactions (v1): list and filter transactions on parent, sub, and virtual accounts. */
export class TransactionsService implements ITransactionsService {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `GET /v1/transactions/bank`. Lists credit and debit transactions on the parent account.
	 * @param params Pagination options (`cursor`, `limit`).
	 * @returns One page of bank transactions.
	 * @throws {NombaError} The call failed.
	 */
	listBankTransactions(
		params: TransactionListParams = {},
	): Promise<BankTransactionList> {
		return this.http.request("GET", "/v1/transactions/bank", {
			query: pageQuery(params),
		});
	}

	/**
	 * Iterates over every credit/debit transaction on the parent account, across all pages.
	 * @param params Starting pagination options.
	 * @throws {NombaError} A page request failed.
	 */
	iterateBankTransactions(
		params: TransactionListParams = {},
	): AsyncGenerator<BankTransaction> {
		return paginate(async (cursor) => {
			const page = await this.listBankTransactions(
				cursor ? { ...params, cursor } : params,
			);
			return { results: page.results ?? [], cursor: page.cursor ?? "" };
		});
	}

	/**
	 * `GET /v1/transactions/virtual`. Lists transactions on a virtual account.
	 * Note: The response carries a cursor, but the API docs do not name a paging parameter,
	 * so only the first page is returned.
	 * @param params The virtual account number and optional date range.
	 * @returns One page of virtual account transactions.
	 * @throws {NombaError} The call failed, e.g. `accountNumber` does not exist.
	 */
	listVirtualAccountTransactions({
		accountNumber,
		...dates
	}: VirtualAccountTransactionParams): Promise<
		Page<VirtualAccountTransaction>
	> {
		return this.http.request("GET", "/v1/transactions/virtual", {
			query: { virtual_account: accountNumber, ...dates },
		});
	}

	/**
	 * `GET /v1/transactions/accounts`. Lists transactions on the parent account.
	 * @param params Pagination options (`cursor`, `limit`).
	 * @returns One page of transactions.
	 * @throws {NombaError} The call failed.
	 */
	listParentTransactions(
		params: TransactionListParams = {},
	): Promise<TransactionList> {
		return this.http.request("GET", "/v1/transactions/accounts", {
			query: pageQuery(params),
		});
	}

	/**
	 * Iterates over every transaction on the parent account, across all pages.
	 * @param params Starting pagination options.
	 * @throws {NombaError} A page request failed.
	 */
	iterateParentTransactions(
		params: TransactionListParams = {},
	): AsyncGenerator<Transaction> {
		return paginate(async (cursor) => {
			const page = await this.listParentTransactions(
				cursor ? { ...params, cursor } : params,
			);
			return { results: page.results ?? [], cursor: page.cursor ?? "" };
		});
	}

	/**
	 * `GET /v1/transactions/accounts/{subAccountId}`. Lists transactions on a sub account.
	 * @param subAccountId The sub account's ID.
	 * @param params Pagination options (`cursor`, `limit`).
	 * @returns One page of transactions.
	 * @throws {NombaError} The call failed, e.g. `subAccountId` does not exist.
	 */
	async listSubAccountTransactions(
		subAccountId: string,
		params: TransactionListParams = {},
	): Promise<TransactionList> {
		return this.http.request(
			"GET",
			`/v1/transactions/accounts/${pathId(subAccountId)}`,
			{
				query: pageQuery(params),
			},
		);
	}

	/**
	 * Iterates over every transaction on a sub account, across all pages.
	 * @param subAccountId The sub account's ID.
	 * @param params Starting pagination options.
	 * @throws {NombaError} A page request failed, e.g. `subAccountId` does not exist.
	 */
	iterateSubAccountTransactions(
		subAccountId: string,
		params: TransactionListParams = {},
	): AsyncGenerator<Transaction> {
		return paginate(async (cursor) => {
			const page = await this.listSubAccountTransactions(
				subAccountId,
				cursor ? { ...params, cursor } : params,
			);
			return { results: page.results ?? [], cursor: page.cursor ?? "" };
		});
	}

	/**
	 * `POST /v1/transactions/accounts`. Filters transactions on the parent account by criteria.
	 * @param filter Filter criteria (e.g., `dateFrom`, `dateTo`, `transactionType`).
	 * @param page Pagination options (`cursor`, `limit`).
	 * @returns One page of matching transactions.
	 * @throws {NombaError} The call failed.
	 */
	filterParentTransactions(
		filter: FilterTransactionsParams = {},
		page: TransactionListParams = {},
	): Promise<TransactionList> {
		return this.http.request("POST", "/v1/transactions/accounts", {
			body: filter,
			query: pageQuery(page),
		});
	}

	/**
	 * Iterates over every parent account transaction matching the filter, across all pages.
	 * @param filter Filter criteria (e.g., `dateFrom`, `dateTo`, `transactionType`).
	 * @param page Starting pagination options.
	 * @throws {NombaError} A page request failed.
	 */
	iterateFilteredParentTransactions(
		filter: FilterTransactionsParams = {},
		page: TransactionListParams = {},
	): AsyncGenerator<Transaction> {
		return paginate(async (cursor) => {
			const p = await this.filterParentTransactions(
				filter,
				cursor ? { ...page, cursor } : page,
			);
			return { results: p.results ?? [], cursor: p.cursor ?? "" };
		});
	}

	/**
	 * `POST /v1/transactions/accounts/{subAccountId}`. Filters transactions on a sub account by criteria.
	 * @param subAccountId The sub account's ID.
	 * @param filter Filter criteria (e.g., `dateFrom`, `dateTo`, `transactionType`).
	 * @param page Pagination options (`cursor`, `limit`).
	 * @returns One page of matching transactions.
	 * @throws {NombaError} The call failed, e.g. `subAccountId` does not exist.
	 */
	async filterSubAccountTransactions(
		subAccountId: string,
		filter: FilterTransactionsParams = {},
		page: TransactionListParams = {},
	): Promise<TransactionList> {
		return this.http.request(
			"POST",
			`/v1/transactions/accounts/${pathId(subAccountId)}`,
			{
				body: filter,
				query: pageQuery(page),
			},
		);
	}

	/**
	 * Iterates over every sub account transaction matching the filter, across all pages.
	 * @param subAccountId The sub account's ID.
	 * @param filter Filter criteria (e.g., `dateFrom`, `dateTo`, `transactionType`).
	 * @param page Starting pagination options.
	 * @throws {NombaError} A page request failed, e.g. `subAccountId` does not exist.
	 */
	iterateFilteredSubAccountTransactions(
		subAccountId: string,
		filter: FilterTransactionsParams = {},
		page: TransactionListParams = {},
	): AsyncGenerator<Transaction> {
		return paginate(async (cursor) => {
			const p = await this.filterSubAccountTransactions(
				subAccountId,
				filter,
				cursor ? { ...page, cursor } : page,
			);
			return { results: p.results ?? [], cursor: p.cursor ?? "" };
		});
	}
}
