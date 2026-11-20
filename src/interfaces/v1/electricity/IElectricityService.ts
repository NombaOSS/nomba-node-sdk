/**
 * @module nomba/interfaces/v1/electricity
 * @description Electricity v1 service contract for validation endpoints
 */

import type { ElectricityProvidersResult } from "../../../types/v1/electricity/electricity.types.js";

export interface IElectricityService {
	/**
	 * `GET /v1/bill/electricity/discos`.
	 * @returns The electricity distribution companies (discos) available for meter lookup.
	 * @throws {NombaError} The request failed.
	 */
	getElectricityProviders(): Promise<ElectricityProvidersResult>;
}
