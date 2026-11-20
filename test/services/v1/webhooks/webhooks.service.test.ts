import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
	Nomba,
	NombaError,
	OutcomeUnknownError,
} from "../../../../src/index.js";

const tokenData = {
	businessId: "biz",
	access_token: "at1",
	refresh_token: "rt1",
	expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
};
const reply = (code: string, data: unknown) =>
	new Response(JSON.stringify({ code, description: "x", data }), {
		status: 200,
	});

let fetchMock: ReturnType<typeof vi.fn>;
let nomba: Nomba;
beforeEach(() => {
	fetchMock = vi.fn().mockResolvedValueOnce(reply("00", tokenData)); // token issue
	fetchMock.mockImplementation(async () => reply("00", {}));
	vi.stubGlobal("fetch", fetchMock);
	nomba = new Nomba({
		clientId: "cid",
		clientSecret: "secret",
		accountId: "acc-1",
		retryDelayMs: 1,
	});
});
afterEach(() => vi.unstubAllGlobals());

// The API call made after the token issue, n-th from 0.
const apiCall = (n = 0) => {
	const [url, init] = fetchMock.mock.calls[n + 1] as [
		string,
		RequestInit & { headers: Record<string, string> },
	];
	return {
		url,
		method: init.method,
		key: init.headers["X-Idempotent-key"],
		body: init.body ? JSON.parse(init.body as string) : undefined,
	};
};
const respondOnce = (code: string, data: unknown) =>
	fetchMock.mockImplementationOnce(async () => reply(code, data));

const base = "https://api.nomba.com/v1/webhooks";

test("eventLogs and events post their filters and accept code 200", async () => {
	const page = { list: [{ hookRequestId: "h1" }], pageToken: "t" };
	respondOnce("200", page);
	const filters = { coreUserId: "u1", limit: 1, eventType: "payment_success" };
	expect(await nomba.webhooks.eventLogs(filters)).toEqual(page);
	respondOnce("200", { list: [], pageToken: "" });
	await nomba.webhooks.events({ limit: 20 });
	expect([apiCall(0).method, apiCall(0).url, apiCall(0).body]).toEqual([
		"POST",
		`${base}/event-logs`,
		filters,
	]);
	expect([apiCall(1).url, apiCall(1).body]).toEqual([
		`${base}/events`,
		{ limit: 20 },
	]);
});

test("repush and bulkRepush send the ids under the guide's hooksRequestId(s) names", async () => {
	respondOnce("200", undefined);
	await expect(nomba.webhooks.repush("h1")).resolves.toBeUndefined();
	await nomba.webhooks.bulkRepush(["h1", "h2"]);
	expect([apiCall(0).url, apiCall(0).body]).toEqual([
		`${base}/re-push`,
		{ hooksRequestId: "h1" },
	]);
	expect([apiCall(1).url, apiCall(1).body]).toEqual([
		`${base}/bulk-re-push`,
		{ hooksRequestIds: ["h1", "h2"] },
	]);
});

test("replay posts the window and filter", async () => {
	const params = {
		startDate: "2026-01-27T00:00:00Z",
		endDate: "2026-01-28T23:59:59Z",
		filter: {
			statuses: ["FAILED" as const],
			eventTypes: ["PAYMENT_SUCCESS" as const],
		},
	};
	await nomba.webhooks.replay(params);
	expect(apiCall()).toEqual({
		url: `${base}/replay`,
		method: "POST",
		key: undefined, // No X-Idempotent-key header sent
		body: params,
	});
});

test("an error code is a NombaError", async () => {
	respondOnce("400", null);
	await expect(nomba.webhooks.eventLogs()).rejects.toBeInstanceOf(NombaError);
});

test("a replay with no response is not retried", async () => {
	fetchMock.mockImplementationOnce(async () => {
		throw new TypeError("fetch failed");
	});
	await expect(
		nomba.webhooks.replay({ startDate: "a", endDate: "b" }),
	).rejects.toBeInstanceOf(OutcomeUnknownError);
	expect(fetchMock).toHaveBeenCalledTimes(2);
});
