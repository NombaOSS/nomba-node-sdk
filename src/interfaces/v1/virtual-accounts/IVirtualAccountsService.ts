/**
 * @module nomba/interfaces/virtual-accounts
 * @description VirtualAccounts service contract
 */

import type { PageParams } from "../../../lib/util.js";
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

export interface IVirtualAccountsService {
	/**
	 * `POST /v1/accounts/virtual`. Creates a virtual account funding the parent account.
	 * @param params The account to create.
	 * @returns The created virtual account.
	 * @throws {NombaError} The creation was rejected.
	 */
	create(params: CreateVirtualAccountParams): Promise<CreatedVirtualAccount>;
	/**
	 * `POST /v1/accounts/virtual/{subAccountId}`. Creates a virtual account; funds are collected in that
	 * sub account.
	 * @param subAccountId The sub account's ID.
	 * @param params The account to create.
	 * @returns The created virtual account.
	 * @throws {NombaError} The creation was rejected.
	 */
	createForSubAccount(
		subAccountId: string,
		params: CreateVirtualAccountParams,
	): Promise<CreatedVirtualAccount>;
	/**
	 * `GET /v1/accounts/virtual/{identifier}`.
	 * @param identifier The accountRef or the virtual account number.
	 * @returns The matching virtual account.
	 * @throws {NombaError} No matching account, or the request was rejected.
	 */
	get(identifier: string): Promise<VirtualAccount>;
	/**
	 * `PUT /v1/accounts/virtual/{identifier}`.
	 * @param identifier The accountRef or the 10 digit account number.
	 * @param params The fields to update.
	 * @returns Whether the update took effect.
	 * @throws {NombaError} The update was rejected.
	 */
	update(
		identifier: string,
		params: UpdateVirtualAccountParams,
	): Promise<{
		updated: boolean;
	}>;
	/**
	 * `DELETE /v1/accounts/virtual/{identifier}`. Stops the account accepting payments.
	 * @param identifier The accountRef or the virtual account number.
	 * @returns Whether the account was expired.
	 * @throws {NombaError} The request was rejected.
	 */
	expire(identifier: string): Promise<{
		expired: boolean;
	}>;
	/**
	 * `POST /v1/accounts/virtual/list`.
	 * @param filter The filter criteria.
	 * @param page Paging (`cursor`, `limit`).
	 * @returns One page of matching virtual accounts.
	 * @throws {NombaError} The request was rejected.
	 */
	list(
		filter?: FilterVirtualAccountsParams,
		page?: PageParams,
	): Promise<VirtualAccountList>;
	/**
	 * Every matching virtual account, across all pages. Starts at `page.cursor` if given.
	 * @param filter The filter criteria.
	 * @param page The starting cursor and page size.
	 * @throws {NombaError} A page request was rejected.
	 */
	iterate(
		filter?: FilterVirtualAccountsParams,
		page?: PageParams,
	): AsyncGenerator<VirtualAccount>;
	/**
	 * `POST /v1/accounts/virtual/{identifier}/simulate-inflow`. Sandbox only.
	 * @param identifier The accountRef or account number of a `SIMULATED` virtual account.
	 * @param params The simulated sender and amount.
	 * @returns The simulated inflow's outcome.
	 * @throws {NombaError} The request was rejected, e.g. `identifier` names a `LIVE` account.
	 */
	simulateInflow(
		identifier: string,
		params: SimulateInflowParams,
	): Promise<SimulateInflowResult>;
}
