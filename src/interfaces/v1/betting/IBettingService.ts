/**
 * @module nomba/interfaces/v1/betting
 * @description Betting v1 service contract for validation endpoints
 */

import type {
	BettingCustomerLookupParams,
	BettingCustomerLookupResult,
	BettingProvidersResult,
} from "../../../types/v1/betting/betting.types.js";

export interface IBettingService {
	/**
	 * `GET /v1/bill/betting/providers`.
	 * @returns The supported betting providers.
	 * @throws {NombaError} The call failed.
	 */
	getBettingProviders(): Promise<BettingProvidersResult>;

	/**
	 * `GET /v1/bill/betting/lookup`. Validates a customer ID and returns the account name.
	 * @param params The provider and customer ID to look up.
	 * @returns The customer's account name.
	 * @throws {NombaError} The call failed, e.g. the customer ID is invalid.
	 */
	lookupCustomer(
		params: BettingCustomerLookupParams,
	): Promise<BettingCustomerLookupResult>;
}
