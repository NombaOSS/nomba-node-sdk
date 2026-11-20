/**
 * @module nomba/interfaces/http
 * @description The transport every service depends on
 */

import type { TokenData } from "../../lib/token-store.js";
import type {
	Environment,
	HttpMethod,
	HttpRequestOptions,
} from "../../types/common/common.types.js";
import type { OutcomeEvent } from "../../types/common/outcome.types.js";

export interface IHttpClient {
	readonly environment: Environment;
	/** Authenticated call; returns the response `data`. */
	request<T>(
		method: HttpMethod,
		path: string,
		options?: HttpRequestOptions,
	): Promise<T>;
	issueToken(): Promise<TokenData>;
	refreshToken(): Promise<TokenData>;
	revokeToken(): Promise<void>;
	/** Hands a money-moving call's outcome to NombaOptions.onOutcome. Never throws. */
	reportOutcome(event: OutcomeEvent): void;
}
