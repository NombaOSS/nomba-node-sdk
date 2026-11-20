/**
 * @module nomba/services/v1/cable
 * @description Cable TV (v1): GET /v1/bill/cableTvProduct, GET /v1/bill/cable/lookup
 * @see https://developer.nomba.com/docs/api-reference/bills
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { ICableService } from "../../../interfaces/v1/cable/index.js";
import type {
	CableCustomerLookupParams,
	CableCustomerLookupResult,
	CablePlansParams,
	CablePlansResult,
} from "../../../types/v1/cable/cable.types.js";

/** Cable TV lookups (v1): plan listing and customer lookup. Use CableV2Service for payments. */
export class CableService implements ICableService {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `GET /v1/bill/cableTvProduct`.
	 * @param params The provider whose plans to fetch.
	 * @returns The provider's cable TV plans.
	 * @throws {NombaError} The call failed.
	 */
	getCablePlans(params: CablePlansParams): Promise<CablePlansResult> {
		return this.http.request("GET", "/v1/bill/cableTvProduct", {
			query: params,
		});
	}

	/**
	 * `GET /v1/bill/cable/lookup`. Validates a smartcard number and returns the account name.
	 * @param params The provider and smartcard number to look up.
	 * @returns The customer's account name.
	 * @throws {NombaError} The call failed, e.g. the smartcard number is invalid.
	 */
	lookupCustomer(
		params: CableCustomerLookupParams,
	): Promise<CableCustomerLookupResult> {
		return this.http.request("GET", "/v1/bill/cable/lookup", {
			query: params,
		});
	}
}
