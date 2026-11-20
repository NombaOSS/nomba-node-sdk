/**
 * @module nomba/accounts
 * @description Nomba SDK for Node.js
 * @description Accounts resource
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 * @see https://developer.nomba.com/docs/api-reference/accounts
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { IAccountsService } from "../../../interfaces/v1/accounts/index.js";
import { paginate } from "../../../lib/paginate.js";
import { pageQuery, pathId } from "../../../lib/util.js";
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

export class AccountsService implements IAccountsService {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `GET /v1/accounts/parent`.
	 * @returns The parent account's details.
	 * @throws {NombaError} The call failed.
	 */
	getParentAccount(): Promise<AccountDetails> {
		return this.http.request("GET", "/v1/accounts/parent");
	}

	/**
	 * `GET /v1/accounts/balance`.
	 * @returns The parent account's balance.
	 * @throws {NombaError} The call failed.
	 */
	getParentBalance(): Promise<AccountBalance> {
		return this.http.request("GET", "/v1/accounts/balance");
	}

	/**
	 * `GET /v1/accounts/sub-account-details`.
	 * @param lookup Which sub account to fetch, by account ID or account number.
	 * @returns The sub account's details.
	 * @throws {NombaError} The call failed, e.g. no sub account matches `lookup`.
	 */
	getSubAccount(lookup: SubAccountLookup = {}): Promise<AccountDetails> {
		return this.http.request("GET", "/v1/accounts/sub-account-details", {
			query: lookup,
		});
	}

	/**
	 * `GET /v1/accounts/{subAccountId}/balance`.
	 * @param subAccountId The sub account's ID.
	 * @returns The sub account's balance.
	 * @throws {NombaError} The call failed, e.g. `subAccountId` does not exist.
	 */
	async getSubAccountBalance(subAccountId: string): Promise<AccountBalance> {
		return this.http.request(
			"GET",
			`/v1/accounts/${pathId(subAccountId)}/balance`,
		);
	}

	/**
	 * `GET /v1/accounts/terminals`.
	 * @param params Pagination (`cursor`, `size`) and other list filters.
	 * @returns One page of the parent account's terminals.
	 * @throws {NombaError} The call failed.
	 */
	listParentTerminals(params: TerminalListParams = {}): Promise<TerminalList> {
		return this.http.request("GET", "/v1/accounts/terminals", {
			query: pageQuery(params),
		});
	}

	/**
	 * `GET /v1/accounts/{accountId}/terminals`.
	 * @param accountId The sub account's ID.
	 * @param params Pagination (`cursor`, `size`) and other list filters.
	 * @returns One page of the sub account's terminals.
	 * @throws {NombaError} The call failed, e.g. `accountId` does not exist.
	 */
	async listSubAccountTerminals(
		accountId: string,
		params: TerminalListParams = {},
	): Promise<TerminalList> {
		return this.http.request(
			"GET",
			`/v1/accounts/${pathId(accountId)}/terminals`,
			{ query: pageQuery(params) },
		);
	}

	/**
	 * Every terminal of the parent account, across all pages. Starts at `params.cursor` if given.
	 * @param params Starting cursor and other list filters.
	 * @throws {NombaError} A page request failed.
	 */
	iterateParentTerminals(
		params: TerminalListParams = {},
	): AsyncGenerator<Terminal> {
		return paginate((cursor) =>
			this.listParentTerminals(cursor ? { ...params, cursor } : params),
		);
	}

	/**
	 * Every terminal of a sub account, across all pages. Starts at `params.cursor` if given.
	 * @param accountId The sub account's ID.
	 * @param params Starting cursor and other list filters.
	 * @throws {NombaError} A page request failed, e.g. `accountId` does not exist.
	 */
	iterateSubAccountTerminals(
		accountId: string,
		params: TerminalListParams = {},
	): AsyncGenerator<Terminal> {
		return paginate((cursor) =>
			this.listSubAccountTerminals(
				accountId,
				cursor ? { ...params, cursor } : params,
			),
		);
	}
}
