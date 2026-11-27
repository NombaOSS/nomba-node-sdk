/**
 * @module nomba/virtual-accounts
 * @description Nomba SDK for Node.js
 * @description Virtual Accounts resource
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 * @see https://developer.nomba.com/docs/api-reference/virtual-accounts
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { IVirtualAccountsService } from "../../../interfaces/v1/virtual-accounts/IVirtualAccountsService.js";
import { paginate } from "../../../lib/paginate.js";
import type { PageParams } from "../../../lib/util.js";
import { pageQuery, pathId } from "../../../lib/util.js";
import type {
	CreatedVirtualAccount,
	CreateVirtualAccountParams,
	FilterVirtualAccountsParams,
	SimulateInflowParams,
	SimulateInflowResult,
	UpdateVirtualAccountParams,
	VirtualAccount,
	VirtualAccountList,
} from "../../../types/v1/virtual-accounts/virtual-accounts.types.js";

/** Virtual Accounts (v1): create, update, expire, and list virtual bank accounts that collect payments. */
export class VirtualAccountsService implements IVirtualAccountsService {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `POST /v1/accounts/virtual`. Creates a virtual account for the parent account.
	 * @param params The account details to create; `accountRef` is your unique identifier for lookups.
	 * @returns The created virtual account, including its bank account number.
	 * @throws {NombaError} The call failed, e.g. `accountRef` already exists.
	 */
	create(params: CreateVirtualAccountParams): Promise<CreatedVirtualAccount> {
		return this.http.request("POST", "/v1/accounts/virtual", {
			body: params,
		});
	}

	/**
	 * `POST /v1/accounts/virtual/{subAccountId}`. Creates a virtual account that collects funds
	 * into a specific sub account.
	 * @param subAccountId The sub account to receive collected funds.
	 * @param params The account details to create; `accountRef` is your unique identifier for lookups.
	 * @returns The created virtual account, including its bank account number.
	 * @throws {NombaError} The call failed, e.g. `subAccountId` does not exist or `accountRef` already exists.
	 */
	async createForSubAccount(
		subAccountId: string,
		params: CreateVirtualAccountParams,
	): Promise<CreatedVirtualAccount> {
		return this.http.request(
			"POST",
			`/v1/accounts/virtual/${pathId(subAccountId)}`,
			{ body: params },
		);
	}

	/**
	 * `GET /v1/accounts/virtual/{identifier}`. Looks up a virtual account by reference or account number.
	 * @param identifier The `accountRef` or the 10-digit virtual account number.
	 * @returns The virtual account's details.
	 * @throws {NombaError} The call failed, e.g. `identifier` does not match any account.
	 */
	async get(identifier: string): Promise<VirtualAccount> {
		return this.http.request(
			"GET",
			`/v1/accounts/virtual/${pathId(identifier)}`,
		);
	}

	/**
	 * `PUT /v1/accounts/virtual/{identifier}`. Updates a virtual account's mutable fields.
	 * @param identifier The `accountRef` or the 10-digit virtual account number.
	 * @param params The fields to update (e.g., `accountName`, `expiryDate`).
	 * @returns Whether the update succeeded.
	 * @throws {NombaError} The call failed, e.g. `identifier` does not match any account.
	 */
	async update(
		identifier: string,
		params: UpdateVirtualAccountParams,
	): Promise<{ updated: boolean }> {
		return this.http.request(
			"PUT",
			`/v1/accounts/virtual/${pathId(identifier)}`,
			{ body: params },
		);
	}

	/**
	 * `DELETE /v1/accounts/virtual/{identifier}`. Expires a virtual account so it no longer accepts
	 * payments. This action cannot be undone.
	 * @param identifier The `accountRef` or the 10-digit virtual account number.
	 * @returns Whether the expiration succeeded.
	 * @throws {NombaError} The call failed, e.g. `identifier` does not match any account.
	 */
	async expire(identifier: string): Promise<{ expired: boolean }> {
		return this.http.request(
			"DELETE",
			`/v1/accounts/virtual/${pathId(identifier)}`,
		);
	}

	/**
	 * `POST /v1/accounts/virtual/list`. Lists virtual accounts matching the given filters.
	 * @param filter Filters to apply (e.g., `accountName`, `resourceAcquired`).
	 * @param page Pagination options (`cursor`, `limit`).
	 * @returns One page of matching virtual accounts.
	 * @throws {NombaError} The call failed.
	 */
	list(
		filter: FilterVirtualAccountsParams = {},
		page: PageParams = {},
	): Promise<VirtualAccountList> {
		return this.http.request("POST", "/v1/accounts/virtual/list", {
			body: filter,
			query: pageQuery(page),
		});
	}

	/**
	 * Iterates over every matching virtual account, across all pages. Starts at `page.cursor` if given.
	 * @param filter Filters to apply (e.g., `accountName`, `resourceAcquired`).
	 * @param page Starting pagination options.
	 * @throws {NombaError} A page request failed.
	 */
	iterate(
		filter: FilterVirtualAccountsParams = {},
		page: PageParams = {},
	): AsyncGenerator<VirtualAccount> {
		return paginate((cursor) =>
			this.list(filter, cursor ? { ...page, cursor } : page),
		);
	}

	/**
	 * `POST /v1/accounts/virtual/{identifier}/simulate-inflow`. Sandbox only. Simulates a bank
	 * transfer into a `SIMULATED` virtual account, applying the same checks as a real inflow
	 * (expiry, and sender name when `restrictInflowToAccountName` is set) and firing the matching
	 * webhook. A rejected inflow still resolves with HTTP 200 and `status: "REJECTED"`.
	 * @param identifier The `accountRef` or the account number of the `SIMULATED` virtual account.
	 * @param params The simulated sender and amount.
	 * @returns The simulated inflow's outcome.
	 * @throws {NombaError} The call failed, e.g. `identifier` names a `LIVE` account.
	 */
	async simulateInflow(
		identifier: string,
		params: SimulateInflowParams,
	): Promise<SimulateInflowResult> {
		return this.http.request(
			"POST",
			`/v1/accounts/virtual/${pathId(identifier)}/simulate-inflow`,
			{ body: params },
		);
	}
}
