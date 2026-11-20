import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Nomba } from "../../../../src/index.js";
import { SDK_VERSION } from "../../../../src/lib/sdk-version.js";

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
	vi.stubGlobal("fetch", fetchMock);
	nomba = new Nomba({
		clientId: "cid",
		clientSecret: "secret",
		accountId: "acc-1",
	});
});
afterEach(() => vi.unstubAllGlobals());

/** The n-th API call made after the token issue. */
const apiCall = (n = 0) => {
	const [url, init] = fetchMock.mock.calls[n + 1] as [string, RequestInit];
	return {
		url,
		init,
		body: init.body ? JSON.parse(init.body as string) : undefined,
	};
};

const params = {
	accountRef: "1oWbJQQHLyQqqf1SwxjSpudeA21",
	accountName: "Daniel Scorsese",
};

test("create posts the params as the body", async () => {
	const created = {
		accountRef: params.accountRef,
		bankAccountNumber: "9391076543",
	};
	fetchMock.mockResolvedValueOnce(ok(created));
	const body = {
		...params,
		currency: "NGN" as const,
		expectedAmount: 5000,
		expiryDate: "2026-01-30 12:15:00",
		callbackUrl: "https://example.com/callback",
		restrictInflowToAccountName: true,
	};
	expect(await nomba.virtualAccounts.create(body)).toEqual(created);
	const { url, init, body: sent } = apiCall();
	expect(url).toBe("https://api.nomba.com/v1/accounts/virtual");
	expect(init.method).toBe("POST");
	expect(init.headers).toEqual({
		accountId: "acc-1",
		"Content-Type": "application/json",
		Authorization: "Bearer at1",
		"X-Nomba-Sdk-Version": SDK_VERSION,
		"User-Agent": `nomba_node_sdk:v${SDK_VERSION}`,
	});
	expect(sent).toEqual(body);
});

test("createForSubAccount puts the sub account id in the path", async () => {
	fetchMock.mockResolvedValueOnce(ok({}));
	await nomba.virtualAccounts.createForSubAccount("sub-1", params);
	expect(apiCall().url).toBe("https://api.nomba.com/v1/accounts/virtual/sub-1");
	expect(apiCall().init.method).toBe("POST");
	expect(apiCall().body).toEqual(params);
});

test("get, update and expire use the identifier path with the right methods", async () => {
	fetchMock.mockImplementation(async () => ok({}));
	await nomba.virtualAccounts.get("REF 1");
	await nomba.virtualAccounts.update("0107841806", {
		newAccountRef: "INVOICE_20230908_0001",
		expectedAmount: "100.0",
	});
	await nomba.virtualAccounts.expire("0107841806");
	expect(apiCall(0)).toMatchObject({
		url: "https://api.nomba.com/v1/accounts/virtual/REF%201",
		init: { method: "GET" },
	});
	expect(apiCall(1)).toMatchObject({
		url: "https://api.nomba.com/v1/accounts/virtual/0107841806",
		init: { method: "PUT" },
		body: { newAccountRef: "INVOICE_20230908_0001", expectedAmount: "100.0" },
	});
	expect(apiCall(2)).toMatchObject({
		url: "https://api.nomba.com/v1/accounts/virtual/0107841806",
		init: { method: "DELETE" },
	});
	expect(apiCall(2).init.body).toBeUndefined();
});

test.each(["", ".", ".."])(
	"identifiers that would change the endpoint are rejected: %j",
	async (bad) => {
		await expect(nomba.virtualAccounts.get(bad)).rejects.toThrow("Invalid id");
		await expect(nomba.virtualAccounts.expire(bad)).rejects.toThrow(
			"Invalid id",
		);
		expect(fetchMock).not.toHaveBeenCalled();
	},
);

test("list posts the filter as the body and paging as the query, always sending a body", async () => {
	const page = { results: [], cursor: "" };
	fetchMock.mockImplementation(async () => ok(page));
	expect(
		await nomba.virtualAccounts.list(
			{ expired: false, accountName: "Daniel Scorsese" },
			{ limit: 10, cursor: "abc" },
		),
	).toEqual(page);
	expect(apiCall(0)).toMatchObject({
		url: "https://api.nomba.com/v1/accounts/virtual/list?limit=10&cursor=abc",
		init: { method: "POST" },
		body: { expired: false, accountName: "Daniel Scorsese" },
	});
	await nomba.virtualAccounts.list();
	expect(apiCall(1).url).toBe("https://api.nomba.com/v1/accounts/virtual/list");
	expect(apiCall(1).body).toEqual({});
});

test("iterate walks every page with the same filter", async () => {
	fetchMock
		.mockResolvedValueOnce(
			ok({ results: [{ accountRef: "a" }, { accountRef: "b" }], cursor: "c1" }),
		)
		.mockResolvedValueOnce(ok({ results: [{ accountRef: "c" }], cursor: "" }));
	const refs: string[] = [];
	for await (const v of nomba.virtualAccounts.iterate(
		{ expired: true },
		{ limit: 2 },
	))
		refs.push(v.accountRef);
	expect(refs).toEqual(["a", "b", "c"]);
	expect(apiCall(0).url).toBe(
		"https://api.nomba.com/v1/accounts/virtual/list?limit=2",
	);
	expect(apiCall(1).url).toBe(
		"https://api.nomba.com/v1/accounts/virtual/list?limit=2&cursor=c1",
	);
	expect(apiCall(1).body).toEqual({ expired: true });
});

test("an API error surfaces as NombaError", async () => {
	fetchMock.mockResolvedValueOnce(
		new Response(
			JSON.stringify({ code: "02", description: "accountRef can not be null" }),
			{ status: 400 },
		),
	);
	await expect(nomba.virtualAccounts.create(params)).rejects.toMatchObject({
		name: "NombaError",
		status: 400,
		code: "02",
	});
});

test("iterate starts from a given cursor, then follows the API's cursors", async () => {
	fetchMock
		.mockResolvedValueOnce(ok({ results: [{ accountRef: "a" }], cursor: "c2" }))
		.mockResolvedValueOnce(ok({ results: [{ accountRef: "b" }], cursor: "" }));
	const refs: string[] = [];
	for await (const v of nomba.virtualAccounts.iterate({}, { cursor: "start" }))
		refs.push(v.accountRef);
	expect(refs).toEqual(["a", "b"]);
	expect(apiCall(0).url).toBe(
		"https://api.nomba.com/v1/accounts/virtual/list?cursor=start",
	);
	expect(apiCall(1).url).toBe(
		"https://api.nomba.com/v1/accounts/virtual/list?cursor=c2",
	);
});
