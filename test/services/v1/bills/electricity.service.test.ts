import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Nomba } from "../../../../src/index.js";

const tokenData = {
	businessId: "biz",
	access_token: "at1",
	refresh_token: "rt1",
	expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
};

const ok = (data: unknown) =>
	new Response(JSON.stringify({ code: "00", description: "Success", data }), {
		status: 200,
	});

let fetchMock: ReturnType<typeof vi.fn>;
let nomba: Nomba;

beforeEach(() => {
	fetchMock = vi.fn().mockResolvedValueOnce(ok(tokenData)); // token issue
	fetchMock.mockImplementation(async () => ok({}));
	vi.stubGlobal("fetch", fetchMock);
	nomba = new Nomba({
		clientId: "cid",
		clientSecret: "secret",
		accountId: "acc-1",
	});
});

afterEach(() => vi.unstubAllGlobals());

/** The API call made after the token issue. */
const apiCall = () => {
	const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
	return {
		url,
		method: init.method,
	};
};

const base = "https://api.nomba.com/v1/bill";

test("getElectricityProviders calls GET /v1/bill/electricity/discos", async () => {
	await nomba.billElectricity.getElectricityProviders();
	expect(apiCall()).toEqual({
		url: `${base}/electricity/discos`,
		method: "GET",
	});
});

test("electricity endpoints work in sandbox", async () => {
	nomba = new Nomba({
		clientId: "cid",
		clientSecret: "secret",
		accountId: "acc-1",
		environment: "sandbox",
	});
	await nomba.billElectricity.getElectricityProviders();
	expect(fetchMock.mock.calls[1]?.[0]).toBe(
		"https://sandbox.nomba.com/v1/bill/electricity/discos",
	);
});
