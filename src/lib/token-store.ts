/**
 * @module nomba/lib/paginate
 * @description Nomba SDK for Node.js
 * @description Token store helper
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 */

export interface TokenData {
	businessId: string;
	access_token: string;
	refresh_token: string;
	/** ISO 8601 UTC, e.g. 2022-07-08T14:33:00Z */
	expiresAt: string;
}

/**
 * Where the SDK keeps the current token. Implement it over Redis, a database, etc. so
 * several instances share one token. Nomba allows a single session per client, so
 * instances that share a store should also implement `lock`.
 *
 * Contract for shared stores:
 * - `get`, `set` and `clear` must be atomic and durable (a `set` that resolves must be readable
 *   by every instance).
 * - `lock` must expire (a TTL) so a crashed instance cannot hold it forever.
 * - Store errors never fail a request: the SDK retries `set` twice, then keeps the token in
 *   process memory and reports the error through the `onStoreError` option.
 */
export interface TokenStore {
	get(): TokenData | undefined | Promise<TokenData | undefined>;
	set(token: TokenData): void | Promise<void>;
	clear(): void | Promise<void>;
	/**
	 * Optional cross-instance lock. The SDK runs every issue/refresh inside `fn` so only
	 * one instance authenticates at a time (issue, refresh and revoke); others then pick up the stored token.
	 */
	lock?<T>(fn: () => Promise<T>): Promise<T>;
}

/** Default store: one token, this process only. */
export class MemoryTokenStore implements TokenStore {
	#token: TokenData | undefined;
	get() {
		return this.#token;
	}
	set(token: TokenData) {
		this.#token = token;
	}
	clear() {
		this.#token = undefined;
	}
}
