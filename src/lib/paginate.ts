/**
 * @module nomba/lib/paginate
 * @description Nomba SDK for Node.js
 * @description Pagination helper
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 */

/**
 * Yields every item across pages. Per the docs, keep requesting with the returned `cursor`
 * until the API returns none. Lazy: a page is fetched only when the previous one is consumed.
 */
export async function* paginate<T>(
	fetchPage: (
		cursor: string | undefined,
	) => Promise<{ results: T[]; cursor: string }>,
): AsyncGenerator<T> {
	let cursor: string | undefined;
	do {
		const page = await fetchPage(cursor);
		yield* page.results;
		cursor = page.cursor;
	} while (cursor);
}
