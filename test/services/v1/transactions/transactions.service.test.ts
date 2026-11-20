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
	fetchMock.mockImplementation(async () => ok({ results: [], cursor: "" }));
	vi.stubGlobal("fetch", fetchMock);
	nomba = new Nomba({
		clientId: "cid",
		clientSecret: "secret",
		accountId: "acc-1",
	});
});
afterEach(() => vi.unstubAllGlobals());

const apiCall = (n = 0) => {
	const [url, init] = fetchMock.mock.calls[n + 1] as [string, RequestInit];
	return {
		url,
		method: init.method,
		body: init.body ? JSON.parse(init.body as string) : undefined,
	};
};

test("listBankTransactions sends paging and date range as query", async () => {
	await nomba.transactions.listBankTransactions({
		limit: 10,
		dateFrom: "2023-01-01T00:00:00",
		dateTo: "2024-09-30T23:59:59",
	});
	expect(apiCall()).toMatchObject({
		url: "https://api.nomba.com/v1/transactions/bank?limit=10&dateFrom=2023-01-01T00%3A00%3A00&dateTo=2024-09-30T23%3A59%3A59",
		method: "GET",
	});
});

test("listParentTransactions and listSubAccountTransactions", async () => {
	await nomba.transactions.listParentTransactions({ limit: 5 });
	await nomba.transactions.listSubAccountTransactions("sub-1", { limit: 5 });
	expect(apiCall(0)).toMatchObject({
		url: "https://api.nomba.com/v1/transactions/accounts?limit=5",
		method: "GET",
	});
	expect(apiCall(1)).toMatchObject({
		url: "https://api.nomba.com/v1/transactions/accounts/sub-1?limit=5",
		method: "GET",
	});
});

test("filterParentTransactions posts the filter and sends paging as query", async () => {
	await nomba.transactions.filterParentTransactions(
		{ status: "SUCCESS", merchantTxRef: "m-1" },
		{ limit: 10, cursor: "abc" },
	);
	expect(apiCall()).toEqual({
		url: "https://api.nomba.com/v1/transactions/accounts?limit=10&cursor=abc",
		method: "POST",
		body: { status: "SUCCESS", merchantTxRef: "m-1" },
	});
});

test("filterSubAccountTransactions puts the sub account id in the path", async () => {
	await nomba.transactions.filterSubAccountTransactions("sub-1", {
		type: "transfer",
	});
	expect(apiCall()).toEqual({
		url: "https://api.nomba.com/v1/transactions/accounts/sub-1",
		method: "POST",
		body: { type: "transfer" },
	});
});

test.each(["", ".", ".."])(
	"sub account ids that would change the endpoint are rejected: %j",
	async (bad) => {
		await expect(
			nomba.transactions.listSubAccountTransactions(bad),
		).rejects.toThrow("Invalid id");
		await expect(
			nomba.transactions.filterSubAccountTransactions(bad),
		).rejects.toThrow("Invalid id");
		expect(fetchMock).not.toHaveBeenCalled();
	},
);

const tx = (id: string) => ({ id });

test("iterateBankTransactions and iterateParentTransactions walk every page", async () => {
	fetchMock
		.mockResolvedValueOnce(
			ok({ results: [{ status: "SUCCESS" }], cursor: "c1" }),
		)
		.mockResolvedValueOnce(ok({ results: [{ status: "REFUND" }], cursor: "" }));
	const statuses: string[] = [];
	for await (const t of nomba.transactions.iterateBankTransactions({
		limit: 1,
	}))
		statuses.push(t.status);
	expect(statuses).toEqual(["SUCCESS", "REFUND"]);
	expect(apiCall(0).url).toBe(
		"https://api.nomba.com/v1/transactions/bank?limit=1",
	);
	expect(apiCall(1).url).toBe(
		"https://api.nomba.com/v1/transactions/bank?limit=1&cursor=c1",
	);
});

test("iterateSubAccountTransactions keeps the sub account id on every page", async () => {
	fetchMock
		.mockResolvedValueOnce(ok({ results: [tx("t1")], cursor: "c1" }))
		.mockResolvedValueOnce(ok({ results: [tx("t2")], cursor: "" }));
	const ids: string[] = [];
	for await (const t of nomba.transactions.iterateSubAccountTransactions(
		"sub-1",
	))
		ids.push(t.id);
	expect(ids).toEqual(["t1", "t2"]);
	expect(apiCall(1).url).toBe(
		"https://api.nomba.com/v1/transactions/accounts/sub-1?cursor=c1",
	);
});

test("iterateFilteredParentTransactions and iterateFilteredSubAccountTransactions carry the filter across pages", async () => {
	fetchMock
		.mockResolvedValueOnce(ok({ results: [tx("t1")], cursor: "c1" }))
		.mockResolvedValueOnce(ok({ results: [tx("t2")], cursor: "" }));
	const ids: string[] = [];
	for await (const t of nomba.transactions.iterateFilteredParentTransactions(
		{ status: "SUCCESS" },
		{ limit: 1 },
	))
		ids.push(t.id);
	expect(ids).toEqual(["t1", "t2"]);
	expect(apiCall(1)).toMatchObject({
		url: "https://api.nomba.com/v1/transactions/accounts?limit=1&cursor=c1",
		body: { status: "SUCCESS" },
	});

	fetchMock.mockResolvedValueOnce(ok({ results: [tx("s1")], cursor: "" }));
	const subIds: string[] = [];
	for await (const t of nomba.transactions.iterateFilteredSubAccountTransactions(
		"sub-1",
		{ type: "transfer" },
	))
		subIds.push(t.id);
	expect(subIds).toEqual(["s1"]);
});

test("a result with no `results` array does not crash iteration", async () => {
	fetchMock.mockResolvedValueOnce(ok({ cursor: "" }));
	const ids: string[] = [];
	for await (const t of nomba.transactions.iterateParentTransactions())
		ids.push(t.id);
	expect(ids).toEqual([]);
});

test("listVirtualAccountTransactions sends virtual_account and the date range", async () => {
	await nomba.transactions.listVirtualAccountTransactions({
		accountNumber: "8578228675",
		dateFrom: "2025-06-24",
		dateTo: "2025-06-25",
	});
	const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
	expect(init.method).toBe("GET");
	expect(url).toBe(
		"https://api.nomba.com/v1/transactions/virtual?virtual_account=8578228675&dateFrom=2025-06-24&dateTo=2025-06-25",
	);
});
