/**
 * @module nomba/interfaces/v1/data
 * @description Data plans v1 service contract
 */

import type { DataPlansResult } from "../../../types/v1/data/data.types.js";

export interface IDataService {
	/**
	 * `GET /v1/bill/data-plan/{telco}`.
	 * @param telco The telco network to list data plans for.
	 * @returns The available data plans for that telco.
	 * @throws {NombaError} `telco` is not a recognized network, or the request failed.
	 */
	getDataPlans(telco: string): Promise<DataPlansResult>;
}
