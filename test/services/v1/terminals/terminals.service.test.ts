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
	fetchMock.mockImplementation(async () => ok({ status: "completed" }));
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

const params = { serialNumber: "91235335668790", terminalLabel: "Front desk" };

test("assignToParent and unassignFromParent post to the plain paths", async () => {
	await nomba.terminals.assignToParent(params);
	await nomba.terminals.unassignFromParent(params);
	expect(apiCall(0)).toEqual({
		url: "https://api.nomba.com/v1/terminals/assign",
		method: "POST",
		body: params,
	});
	expect(apiCall(1)).toEqual({
		url: "https://api.nomba.com/v1/terminals/unassign",
		method: "POST",
		body: params,
	});
});

test("assignToSubAccount and unassignFromSubAccount put the sub account id in the path", async () => {
	await nomba.terminals.assignToSubAccount("sub-1", params);
	await nomba.terminals.unassignFromSubAccount("sub-1", params);
	expect(apiCall(0)).toEqual({
		url: "https://api.nomba.com/v1/terminals/assign/sub-1",
		method: "POST",
		body: params,
	});
	expect(apiCall(1)).toEqual({
		url: "https://api.nomba.com/v1/terminals/unassign/sub-1",
		method: "POST",
		body: params,
	});
});

test("pushPaymentRequest puts the terminal id in the path and sends accountId anyway", async () => {
	await nomba.terminals.pushPaymentRequest("201124LM", {
		merchantTxRef: "tx-1",
		amount: 50000,
		currency: "NGN",
	});
	const [url, init] = fetchMock.mock.calls[1] as [
		string,
		RequestInit & { headers: Record<string, string> },
	];
	expect(url).toBe(
		"https://api.nomba.com/v1/terminals/payment-request/201124LM",
	);
	expect(init.headers.accountId).toBe("acc-1");
	expect(JSON.parse(init.body as string)).toEqual({
		merchantTxRef: "tx-1",
		amount: 50000,
		currency: "NGN",
	});
});

test.each(["", ".", ".."])(
	"path ids that would change the endpoint are rejected: %j",
	async (bad) => {
		await expect(
			nomba.terminals.assignToSubAccount(bad, params),
		).rejects.toThrow("Invalid id");
		await expect(
			nomba.terminals.unassignFromSubAccount(bad, params),
		).rejects.toThrow("Invalid id");
		await expect(
			nomba.terminals.pushPaymentRequest(bad, {
				merchantTxRef: "x",
				amount: 1,
				currency: "NGN",
			}),
		).rejects.toThrow("Invalid id");
		expect(fetchMock).not.toHaveBeenCalled();
	},
);

test("pushPaymentRequest tracks merchantTxRef but doesn't send X-Idempotent-key header", async () => {
	await nomba.terminals.pushPaymentRequest("201124LM", {
		merchantTxRef: "tx-1",
		amount: 50000,
		currency: "NGN",
	});
	const [, init1] = fetchMock.mock.calls[1] as [
		string,
		RequestInit & { headers: Record<string, string> },
	];
	expect(init1.headers["X-Idempotent-key"]).toBeUndefined();

	await nomba.terminals.pushPaymentRequest("201124LM", {
		merchantTxRef: "tx-2",
		amount: 50000,
		currency: "NGN",
	});
	const [, init2] = fetchMock.mock.calls[2] as [
		string,
		RequestInit & { headers: Record<string, string> },
	];
	expect(init2.headers["X-Idempotent-key"]).toBeUndefined();
});
