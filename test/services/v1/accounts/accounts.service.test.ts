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

/** The API call made after the token issue. */
const apiCall = () => {
	const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
	return { url, init };
};

test("getParentAccount", async () => {
	const details = { accountId: "a" };
	fetchMock.mockResolvedValueOnce(ok(details));
	expect(await nomba.accounts.getParentAccount()).toEqual(details);
	const { url, init } = apiCall();
	expect(url).toBe("https://api.nomba.com/v1/accounts/parent");
	expect(init.method).toBe("GET");
	expect(init.headers).toEqual({
		accountId: "acc-1",
		Authorization: "Bearer at1",
		"X-Nomba-Sdk-Version": SDK_VERSION,
		"User-Agent": `nomba_node_sdk:v${SDK_VERSION}`,
	});
});

test("getParentBalance", async () => {
	const balance = {
		amount: "281946.0",
		currency: "NGN",
		timeCreated: "2026-03-08T14:56:59.000Z",
	};
	fetchMock.mockResolvedValueOnce(ok(balance));
	expect(await nomba.accounts.getParentBalance()).toEqual(balance);
	expect(apiCall().url).toBe("https://api.nomba.com/v1/accounts/balance");
});

test("getSubAccount sends only the lookup fields given, as query params", async () => {
	fetchMock.mockResolvedValueOnce(ok({}));
	await nomba.accounts.getSubAccount({ accountRef: "my_ref" });
	expect(apiCall().url).toBe(
		"https://api.nomba.com/v1/accounts/sub-account-details?accountRef=my_ref",
	);
});

test("getSubAccount with no lookup has no query string", async () => {
	fetchMock.mockResolvedValueOnce(ok({}));
	await nomba.accounts.getSubAccount();
	expect(apiCall().url).toBe(
		"https://api.nomba.com/v1/accounts/sub-account-details",
	);
});

test("getSubAccountBalance puts the id in the path, encoded", async () => {
	fetchMock.mockResolvedValueOnce(ok({}));
	await nomba.accounts.getSubAccountBalance("sub/1");
	expect(apiCall().url).toBe(
		"https://api.nomba.com/v1/accounts/sub%2F1/balance",
	);
});

test("listParentTerminals passes filters and pagination, skipping undefined", async () => {
	const page = { results: [], cursor: "" };
	fetchMock.mockResolvedValueOnce(ok(page));
	expect(
		await nomba.accounts.listParentTerminals({
			limit: 2,
			cursor: "abc",
			terminalLabel: "M.A Terminal",
		}),
	).toEqual(page);
	expect(apiCall().url).toBe(
		"https://api.nomba.com/v1/accounts/terminals?limit=2&cursor=abc&terminalLabel=M.A+Terminal",
	);
});

test("listSubAccountTerminals uses the sub account path", async () => {
	fetchMock.mockResolvedValueOnce(ok({ results: [], cursor: "" }));
	await nomba.accounts.listSubAccountTerminals("sub-1", {
		serialNumber: "555",
	});
	expect(apiCall().url).toBe(
		"https://api.nomba.com/v1/accounts/sub-1/terminals?serialNumber=555",
	);
});

test("an empty cursor is not sent", async () => {
	fetchMock.mockResolvedValueOnce(ok({ results: [], cursor: "" }));
	await nomba.accounts.listParentTerminals({ limit: 5, cursor: "" });
	expect(apiCall().url).toBe(
		"https://api.nomba.com/v1/accounts/terminals?limit=5",
	);
});

test("the query string survives a 401 renewal retry", async () => {
	fetchMock
		.mockResolvedValueOnce(
			new Response(
				JSON.stringify({ code: "401", description: "Unauthorized" }),
				{ status: 401 },
			),
		)
		.mockResolvedValueOnce(ok({ ...tokenData, access_token: "at2" }))
		.mockResolvedValueOnce(ok({ results: [], cursor: "" }));
	await nomba.accounts.listParentTerminals({ limit: 5, cursor: "abc" });
	const retry = fetchMock.mock.calls[3] as [string, RequestInit];
	expect(retry[0]).toBe(
		"https://api.nomba.com/v1/accounts/terminals?limit=5&cursor=abc",
	);
	expect(retry[1].headers).toMatchObject({ Authorization: "Bearer at2" });
});

const terminal = (terminalId: string) => ({ terminalId });

test("iterateParentTerminals walks every page until the cursor is empty", async () => {
	fetchMock
		.mockResolvedValueOnce(
			ok({ results: [terminal("t1"), terminal("t2")], cursor: "c1" }),
		)
		.mockResolvedValueOnce(ok({ results: [terminal("t3")], cursor: "" }));
	const ids: string[] = [];
	for await (const t of nomba.accounts.iterateParentTerminals({ limit: 2 }))
		ids.push(t.terminalId);
	expect(ids).toEqual(["t1", "t2", "t3"]);
	expect(fetchMock.mock.calls[1]?.[0]).toBe(
		"https://api.nomba.com/v1/accounts/terminals?limit=2",
	);
	expect(fetchMock.mock.calls[2]?.[0]).toBe(
		"https://api.nomba.com/v1/accounts/terminals?limit=2&cursor=c1",
	);
});

test("iterateParentTerminals is lazy and starts from a given cursor", async () => {
	fetchMock.mockResolvedValueOnce(
		ok({ results: [terminal("t1"), terminal("t2")], cursor: "c1" }),
	);
	for await (const t of nomba.accounts.iterateParentTerminals({
		cursor: "start",
	})) {
		expect(t.terminalId).toBe("t1");
		break;
	}
	expect(fetchMock).toHaveBeenCalledTimes(2); // token + first page only
	expect(apiCall().url).toBe(
		"https://api.nomba.com/v1/accounts/terminals?cursor=start",
	);
});

test("iterateSubAccountTerminals uses the sub account path on every page", async () => {
	fetchMock
		.mockResolvedValueOnce(ok({ results: [terminal("t1")], cursor: "c1" }))
		.mockResolvedValueOnce(ok({ results: [terminal("t2")], cursor: "" }));
	const ids: string[] = [];
	for await (const t of nomba.accounts.iterateSubAccountTerminals("sub-1"))
		ids.push(t.terminalId);
	expect(ids).toEqual(["t1", "t2"]);
	expect(fetchMock.mock.calls[2]?.[0]).toBe(
		"https://api.nomba.com/v1/accounts/sub-1/terminals?cursor=c1",
	);
});

test("iteration rejects and stops when a later page fails", async () => {
	nomba = new Nomba({
		clientId: "cid",
		clientSecret: "secret",
		accountId: "acc-1",
		maxAttempts: 1,
	});
	fetchMock
		.mockResolvedValueOnce(ok({ results: [terminal("t1")], cursor: "c1" }))
		.mockResolvedValueOnce(
			new Response(
				JSON.stringify({ code: "500", description: "Server error" }),
				{ status: 500 },
			),
		);
	const ids: string[] = [];
	await expect(
		(async () => {
			for await (const t of nomba.accounts.iterateParentTerminals())
				ids.push(t.terminalId);
		})(),
	).rejects.toMatchObject({ status: 500 });
	expect(ids).toEqual(["t1"]);
});

test.each(["", ".", ".."])(
	"path ids that would change the endpoint are rejected: %j",
	async (bad) => {
		await expect(nomba.accounts.getSubAccountBalance(bad)).rejects.toThrow(
			"Invalid id",
		);
		expect(fetchMock).not.toHaveBeenCalled();
	},
);
