/**
 * @module nomba/services/v1/electricity
 * @description Electricity (v1): GET /v1/bill/electricity/discos
 * @see https://developer.nomba.com/docs/api-reference/bills
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { IElectricityService } from "../../../interfaces/v1/electricity/index.js";
import type { ElectricityProvidersResult } from "../../../types/v1/electricity/electricity.types.js";

/** Electricity bill disco listing (v1). Meter lookup moved to v2, see ElectricityV2Service. */
export class ElectricityService implements IElectricityService {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `GET /v1/bill/electricity/discos`.
	 * @returns The electricity distribution companies (discos) available for meter lookup.
	 * @throws {NombaError} The request failed.
	 */
	getElectricityProviders(): Promise<ElectricityProvidersResult> {
		return this.http.request("GET", "/v1/bill/electricity/discos");
	}
}
