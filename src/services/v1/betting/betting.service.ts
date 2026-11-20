/**
 * @module nomba/services/v1/betting
 * @description Betting (v1): GET /v1/bill/betting/providers, GET /v1/bill/betting/lookup
 * @see https://developer.nomba.com/docs/api-reference/bills
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { IBettingService } from "../../../interfaces/v1/betting/index.js";
import type {
	BettingCustomerLookupParams,
	BettingCustomerLookupResult,
	BettingProvidersResult,
} from "../../../types/v1/betting/betting.types.js";

/** Betting lookups (v1): provider listing and customer lookup. Use BettingV2Service for payments. */
export class BettingService implements IBettingService {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `GET /v1/bill/betting/providers`.
	 * @returns The supported betting providers.
	 * @throws {NombaError} The call failed.
	 */
	getBettingProviders(): Promise<BettingProvidersResult> {
		return this.http.request("GET", "/v1/bill/betting/providers");
	}

	/**
	 * `GET /v1/bill/betting/lookup`. Validates a customer ID and returns the account name.
	 * @param params The provider and customer ID to look up.
	 * @returns The customer's account name.
	 * @throws {NombaError} The call failed, e.g. the customer ID is invalid.
	 */
	lookupCustomer(
		params: BettingCustomerLookupParams,
	): Promise<BettingCustomerLookupResult> {
		return this.http.request("GET", "/v1/bill/betting/lookup", {
			query: params,
		});
	}
}
