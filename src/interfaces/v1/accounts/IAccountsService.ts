/**
 * @module nomba/interfaces/accounts
 * @description Accounts service contract
 */

import type {
	AccountBalance,
	AccountDetails,
	SubAccountLookup,
} from "../../../types/v1/accounts/accounts.types.js";
import type {
	Terminal,
	TerminalList,
	TerminalListParams,
} from "../../../types/v1/terminals/terminals.types.js";

export interface IAccountsService {
	/**
	 * `GET /v1/accounts/parent`.
	 * @returns The parent account's details.
	 * @throws {NombaError} The call failed.
	 */
	getParentAccount(): Promise<AccountDetails>;
	/**
	 * `GET /v1/accounts/balance`.
	 * @returns The parent account's balance.
	 * @throws {NombaError} The call failed.
	 */
	getParentBalance(): Promise<AccountBalance>;
	/**
	 * `GET /v1/accounts/sub-account-details`.
	 * @param lookup Which sub account to fetch, by account ID or account number.
	 * @returns The sub account's details.
	 * @throws {NombaError} The call failed, e.g. no sub account matches `lookup`.
	 */
	getSubAccount(lookup?: SubAccountLookup): Promise<AccountDetails>;
	/**
	 * `GET /v1/accounts/{subAccountId}/balance`.
	 * @param subAccountId The sub account's ID.
	 * @returns The sub account's balance.
	 * @throws {NombaError} The call failed, e.g. `subAccountId` does not exist.
	 */
	getSubAccountBalance(subAccountId: string): Promise<AccountBalance>;
	/**
	 * `GET /v1/accounts/terminals`.
	 * @param params Pagination (`cursor`, `size`) and other list filters.
	 * @returns One page of the parent account's terminals.
	 * @throws {NombaError} The call failed.
	 */
	listParentTerminals(params?: TerminalListParams): Promise<TerminalList>;
	/**
	 * `GET /v1/accounts/{accountId}/terminals`.
	 * @param accountId The sub account's ID.
	 * @param params Pagination (`cursor`, `size`) and other list filters.
	 * @returns One page of the sub account's terminals.
	 * @throws {NombaError} The call failed, e.g. `accountId` does not exist.
	 */
	listSubAccountTerminals(
		accountId: string,
		params?: TerminalListParams,
	): Promise<TerminalList>;
	/**
	 * Every terminal of the parent account, across all pages. Starts at `params.cursor` if given.
	 * @param params Starting cursor and other list filters.
	 * @throws {NombaError} A page request failed.
	 */
	iterateParentTerminals(params?: TerminalListParams): AsyncGenerator<Terminal>;
	/**
	 * Every terminal of a sub account, across all pages. Starts at `params.cursor` if given.
	 * @param accountId The sub account's ID.
	 * @param params Starting cursor and other list filters.
	 * @throws {NombaError} A page request failed, e.g. `accountId` does not exist.
	 */
	iterateSubAccountTerminals(
		accountId: string,
		params?: TerminalListParams,
	): AsyncGenerator<Terminal>;
}
