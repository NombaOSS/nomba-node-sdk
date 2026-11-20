/**
 * @module nomba/interfaces/v1/cable
 * @description Cable TV v1 service contract for validation endpoints
 */

import type {
	CableCustomerLookupParams,
	CableCustomerLookupResult,
	CablePlansParams,
	CablePlansResult,
} from "../../../types/v1/cable/cable.types.js";

export interface ICableService {
	/**
	 * `GET /v1/bill/cableTvProduct`.
	 * @param params The provider whose plans to fetch.
	 * @returns The provider's cable TV plans.
	 * @throws {NombaError} The call failed.
	 */
	getCablePlans(params: CablePlansParams): Promise<CablePlansResult>;

	/**
	 * `GET /v1/bill/cable/lookup`. Validates a smartcard number and returns the account name.
	 * @param params The provider and smartcard number to look up.
	 * @returns The customer's account name.
	 * @throws {NombaError} The call failed, e.g. the smartcard number is invalid.
	 */
	lookupCustomer(
		params: CableCustomerLookupParams,
	): Promise<CableCustomerLookupResult>;
}
