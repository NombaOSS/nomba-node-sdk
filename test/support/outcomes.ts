import { expect, test, vi } from "vitest";
import type { IHttpClient } from "../../src/interfaces/http/IHttpClient.js";
import { NombaError } from "../../src/lib/errors.js";
import type { OutcomeHandlers } from "../../src/types/common/outcome.types.js";
import { fakeHttp } from "./fake-http.js";

type Invoke = (
	http: IHttpClient,
	handlers: OutcomeHandlers<unknown, string>,
) => Promise<unknown>;

/**
 * Runs one money-moving method through every outcome with a fake transport:
 * documented success, documented pending, rejection, undocumented code, undocumented status.
 */
export const outcomeCases = (
	name: string,
	invoke: Invoke,
	answers: { success: unknown; pending: unknown; unknownStatus?: unknown },
) => {
	const run = async (answer: unknown) => {
		const { http, events } = fakeHttp(() => answer);
		const h = {
			onSuccess: vi.fn(() => "success"),
			onPending: vi.fn(() => "pending"),
			onFailed: vi.fn(() => "failed"),
		};
		const result = await invoke(http, h);
		const fired = Object.entries(h)
			.filter(([, f]) => f.mock.calls.length)
			.map(([k]) => k);
		return { result, fired, events };
	};
	test.each([
		["documented success", answers.success, "success"],
		["documented pending", answers.pending, "pending"],
		["rejection", new NombaError(400, "400", "bad request"), "failed"],
		["undocumented code", new NombaError(200, "299", "odd"), "pending"],
		...(answers.unknownStatus === undefined
			? []
			: [["undocumented status", answers.unknownStatus, "pending"] as const]),
	] as const)(`${name}: %s settles as %s`, async (_, answer, want) => {
		const { result, fired, events } = await run(answer);
		expect(result).toBe(want);
		expect(fired).toEqual([`on${want[0]?.toUpperCase()}${want.slice(1)}`]);
		expect(events).toHaveLength(1);
		expect(events[0]?.outcome).toBe(want);
	});
};
