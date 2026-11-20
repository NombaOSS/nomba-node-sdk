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

const apiCall = () => {
	const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
	return { url, method: init.method };
};

test("fetchParentTransaction sends the lookup as query params", async () => {
	await nomba.requery.fetchParentTransaction({ transactionRef: "tx-1" });
	expect(apiCall()).toEqual({
		url: "https://api.nomba.com/v1/transactions/accounts/single?transactionRef=tx-1",
		method: "GET",
	});
});

test("fetchParentTransaction can look up by merchantTxRef, orderReference or orderId", async () => {
	await nomba.requery.fetchParentTransaction({
		merchantTxRef: "m-1",
		orderReference: "o-1",
		orderId: "id-1",
	});
	expect(apiCall().url).toBe(
		"https://api.nomba.com/v1/transactions/accounts/single?merchantTxRef=m-1&orderReference=o-1&orderId=id-1",
	);
});

test("fetchSubAccountTransaction puts the sub account id in the path", async () => {
	await nomba.requery.fetchSubAccountTransaction("sub-1", {
		transactionRef: "tx-1",
	});
	expect(apiCall()).toEqual({
		url: "https://api.nomba.com/v1/transactions/accounts/sub-1/single?transactionRef=tx-1",
		method: "GET",
	});
});

test("requeryBySession uses the session id in the path", async () => {
	await nomba.requery.requeryBySession("session/1");
	expect(apiCall()).toEqual({
		url: "https://api.nomba.com/v1/transactions/requery/session%2F1",
		method: "GET",
	});
});

test.each(["", ".", ".."])(
	"path ids that would change the endpoint are rejected: %j",
	async (bad) => {
		await expect(
			nomba.requery.fetchSubAccountTransaction(bad, { transactionRef: "tx-1" }),
		).rejects.toThrow("Invalid id");
		await expect(nomba.requery.requeryBySession(bad)).rejects.toThrow(
			"Invalid id",
		);
		expect(fetchMock).not.toHaveBeenCalled();
	},
);

test("an empty lookup is a type error", () => {
	// @ts-expect-error at least one lookup field is required
	nomba.requery.fetchParentTransaction({});
});
