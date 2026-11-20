/**
 * @module nomba/services/v1/data
 * @description Data plans (v1): GET /v1/bill/data-plan/{telco}
 * @see https://developer.nomba.com/docs/api-reference/bills
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { IDataService } from "../../../interfaces/v1/data/index.js";
import { pathId } from "../../../lib/util.js";
import type { DataPlansResult } from "../../../types/v1/data/data.types.js";

/** Data bundle plans (v1): lookup only, no purchase endpoint. */
export class DataService implements IDataService {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `GET /v1/bill/data-plan/{telco}`.
	 * @param telco The telco network to list data plans for.
	 * @returns The available data plans for that telco.
	 * @throws {NombaError} `telco` is not a recognized network, or the request failed.
	 */
	getDataPlans(telco: string): Promise<DataPlansResult> {
		return this.http.request("GET", `/v1/bill/data-plan/${pathId(telco)}`);
	}
}
