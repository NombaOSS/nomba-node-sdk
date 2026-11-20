/**
 * @module nomba/lib/paginate
 * @description Nomba SDK for Node.js
 * @description Utility types and classes
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 */

export type PageParams = {
	/** Page size, at most 50 (see docs/api-basics/pagination). */
	limit?: number;
	cursor?: string;
};

// Path ids come from callers; reject values that would change the endpoint ("", ".", "..").
export const pathId = (v: string) => {
	if (!v || v === "." || v === "..") throw new Error(`Invalid id "${v}"`);
	return encodeURIComponent(v);
};

// The API returns cursor "" on the last page; the docs say to send a cursor only when given one.
export const pageQuery = <T extends { cursor?: string }>(p: T) => ({
	...p,
	cursor: p.cursor || undefined,
});

export const sleep = (ms: number) =>
	new Promise<void>((r) => setTimeout(r, ms));

/** A cursor-paginated list response: `{ results, cursor }`, with `cursor` empty on the last page. */
export type Page<T> = {
	results?: T[];
	cursor?: string;
};
