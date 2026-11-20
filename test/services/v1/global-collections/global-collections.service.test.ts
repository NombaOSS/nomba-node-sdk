import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
	IdempotencyKeyAbsentError,
	Nomba,
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
const inflow = {
	phoneNumber: "0980802000",
	callbackUrl: "https://example.com/hook",
	amount: 10,
	currency: "CDF",
	topupVendor: "AIRTEL",
	idempotencyKey: "my-key-123",
};

test("inflowProviders and getTransaction hit their documented paths", async () => {
	await nomba.globalCollections.inflowProviders();
	await nomba.globalCollections.getTransaction("a822e327");
	expect(apiCall(0).url).toBe(
		"https://api.nomba.com/v1/global-collection/drc/inflow/providers",
	);
	expect([apiCall(1).method, apiCall(1).url]).toEqual([
		"GET",
		"https://api.nomba.com/v1/global-collection/transactions/a822e327",
	]);
});

test("initiateInflow sends the idempotencyKey in the body (no header)", async () => {
	await nomba.globalCollections.initiateInflow(inflow);
	const call = apiCall();
	expect(call.url).toBe(
		"https://api.nomba.com/v1/global-collection/inflow/initiate",
	);
	// No X-Idempotent-key header sent
	expect(call.key).toBeUndefined();
	// idempotencyKey is in the request body
	expect(call.body.idempotencyKey).toBe("my-key-123");
	expect(call.body).toEqual(inflow);
});

test("initiateInflow uses the caller's key, and an unknown outcome reports it", async () => {
	fetchMock.mockImplementationOnce(async () => {
		throw new TypeError("fetch failed");
	});
	const err = await nomba.globalCollections
		.initiateInflow({ ...inflow, idempotencyKey: "mine" })
		.catch((e) => e);
	expect(err).toBeInstanceOf(OutcomeUnknownError);
	expect(err.idempotencyKey).toBe("mine");
	expect(apiCall().body.idempotencyKey).toBe("mine");
});

test("getTransaction rejects ids that would change the endpoint", async () => {
	await expect(nomba.globalCollections.getTransaction("..")).rejects.toThrow(
		"Invalid id",
	);
});

test("an empty idempotencyKey throws IdempotencyKeyAbsentError", async () => {
	await expect(
		nomba.globalCollections.initiateInflow({
			...inflow,
			idempotencyKey: "",
		}),
	).rejects.toThrow(IdempotencyKeyAbsentError);
});

test("a missing idempotencyKey throws IdempotencyKeyAbsentError", async () => {
	const { idempotencyKey: _, ...withoutKey } = inflow;
	await expect(
		// @ts-expect-error - testing runtime validation
		nomba.globalCollections.initiateInflow(withoutKey),
	).rejects.toThrow(IdempotencyKeyAbsentError);
});
