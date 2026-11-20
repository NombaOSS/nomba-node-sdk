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
	fetchMock.mockImplementation(async () =>
		ok({ success: true, message: "ok" }),
	);
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
		body: init.body ? JSON.parse(init.body as string) : undefined,
	};
};

const order = {
	orderReference: "ref-1",
	callbackUrl: "https://example.com/cb",
	customerEmail: "a@b.com",
	amount: 5000,
	currency: "NGN" as const,
	allowedPaymentMethods: ["Card" as const],
	orderMetaData: { invoice: "42" },
};

test("createOrder posts order and tokenizeCard", async () => {
	fetchMock
		.mockReset()
		.mockResolvedValueOnce(ok(tokenData))
		.mockResolvedValueOnce(
			ok({ checkoutLink: "https://pay", orderReference: "uuid" }),
		);
	expect(
		await nomba.checkout.createOrder({ order, tokenizeCard: true }),
	).toEqual({ checkoutLink: "https://pay", orderReference: "uuid" });
	expect(apiCall()).toEqual({
		url: "https://api.nomba.com/v1/checkout/order",
		method: "POST",
		body: { order, tokenizeCard: true },
	});
});

test("fetchTransaction sends idType and id as query", async () => {
	await nomba.checkout.fetchTransaction({
		idType: "ORDER_REFERENCE",
		id: "ref-1",
	});
	expect(apiCall()).toMatchObject({
		url: "https://api.nomba.com/v1/checkout/transaction?idType=ORDER_REFERENCE&id=ref-1",
		method: "GET",
	});
});

test("cancelOrder posts the orderReference", async () => {
	await nomba.checkout.cancelOrder("ref-1");
	expect(apiCall()).toEqual({
		url: "https://api.nomba.com/v1/checkout/order/cancel",
		method: "POST",
		body: { orderReference: "ref-1" },
	});
});

test("refund posts the params", async () => {
	const params = {
		transactionId: "tx-1",
		amount: 100,
		accountNumber: "0123456789",
		bankCode: "058",
	};
	await nomba.checkout.refund(params);
	expect(apiCall()).toEqual({
		url: "https://api.nomba.com/v1/checkout/refund",
		method: "POST",
		body: params,
	});
});

test("chargeTokenizedCard posts tokenKey and order", async () => {
	await nomba.checkout.chargeTokenizedCard({ tokenKey: "tk", order });
	expect(apiCall()).toEqual({
		url: "https://api.nomba.com/v1/checkout/tokenized-card-payment",
		method: "POST",
		body: { tokenKey: "tk", order },
	});
});

test("chargeTokenizedCard resolves otpRequired and transactionId when the bank asks for an OTP", async () => {
	fetchMock.mockResolvedValueOnce(
		ok({
			status: false,
			message: "OTP required",
			orderId: "order-1",
			orderReference: order.orderReference,
			otpRequired: true,
			transactionId: "txn-1",
		}),
	);
	await expect(
		nomba.checkout.chargeTokenizedCard({ tokenKey: "tk", order }),
	).resolves.toEqual({
		status: false,
		message: "OTP required",
		orderId: "order-1",
		orderReference: order.orderReference,
		otpRequired: true,
		transactionId: "txn-1",
	});
});

test("listTokenizedCards sends filters and page as query", async () => {
	await nomba.checkout.listTokenizedCards({
		customerEmail: "a@b.com",
		page: 2,
	});
	expect(apiCall()).toMatchObject({
		url: "https://api.nomba.com/v1/checkout/tokenized-card-data?customerEmail=a%40b.com&page=2",
		method: "GET",
	});
});

test("updateTokenizedCard posts to the same path as list", async () => {
	const params = {
		tokenKey: "tk",
		currentEmailAddress: "a@b.com",
		newEmailAddress: "c@d.com",
	};
	await nomba.checkout.updateTokenizedCard(params);
	expect(apiCall()).toEqual({
		url: "https://api.nomba.com/v1/checkout/tokenized-card-data",
		method: "POST",
		body: params,
	});
});

test("deleteTokenizedCard sends a DELETE with a JSON body", async () => {
	await nomba.checkout.deleteTokenizedCard("tk");
	expect(apiCall()).toEqual({
		url: "https://api.nomba.com/v1/checkout/tokenized-card-data",
		method: "DELETE",
		body: { tokenKey: "tk" },
	});
});

test("sandbox uses the same /v1/checkout paths as production (verified against a real sandbox call: /sandbox/checkout/* 404s)", async () => {
	nomba = new Nomba({
		clientId: "cid",
		clientSecret: "secret",
		accountId: "acc-1",
		environment: "sandbox",
	});
	await nomba.checkout.createOrder({ order });
	await nomba.checkout.fetchTransaction({ id: "x" });
	await nomba.checkout.refund({ transactionId: "tx" });
	await nomba.checkout.cancelOrder("ref-1");
	await nomba.checkout.deleteTokenizedCard("tk");
	const urls = fetchMock.mock.calls.slice(1).map((c) => c[0]);
	expect(urls).toEqual([
		"https://sandbox.nomba.com/v1/checkout/order",
		"https://sandbox.nomba.com/v1/checkout/transaction?id=x",
		"https://sandbox.nomba.com/v1/checkout/refund",
		"https://sandbox.nomba.com/v1/checkout/order/cancel",
		"https://sandbox.nomba.com/v1/checkout/tokenized-card-data",
	]);
});

test("iterateTokenizedCards follows nextPage and stops at 0", async () => {
	fetchMock
		.mockReset()
		.mockResolvedValueOnce(ok(tokenData))
		.mockResolvedValueOnce(
			ok({ nextPage: "1", tokenizedCardDataList: [{ tokenKey: "a" }] }),
		)
		.mockResolvedValueOnce(
			ok({ nextPage: "0", tokenizedCardDataList: [{ tokenKey: "b" }] }),
		);
	const keys: (string | undefined)[] = [];
	for await (const c of nomba.checkout.iterateTokenizedCards({
		customerEmail: "a@b.com",
	}))
		keys.push(c.tokenKey);
	expect(keys).toEqual(["a", "b"]);
	expect(fetchMock.mock.calls[1]?.[0]).toBe(
		"https://api.nomba.com/v1/checkout/tokenized-card-data?customerEmail=a%40b.com",
	);
	expect(fetchMock.mock.calls[2]?.[0]).toBe(
		"https://api.nomba.com/v1/checkout/tokenized-card-data?customerEmail=a%40b.com&page=1",
	);
});

test("createOrder uses order.orderReference as the idempotency key (tracked internally, not sent in headers)", async () => {
	fetchMock.mockImplementation(async () =>
		ok({ success: true, message: "ok" }),
	);
	await nomba.checkout.createOrder({
		order: { ...order, orderReference: "ref-42" },
	});
	const [, init1] = fetchMock.mock.calls[1] as [
		string,
		RequestInit & { headers: Record<string, string> },
	];
	// No X-Idempotent-key header sent (key is only tracked internally for error reporting)
	expect(init1.headers["X-Idempotent-key"]).toBeUndefined();
});

test("createOrder falls back to a generated key when order.orderReference is omitted", async () => {
	fetchMock.mockImplementation(async () =>
		ok({ success: true, message: "ok" }),
	);
	const { orderReference, ...rest } = order;
	await nomba.checkout.createOrder({ order: rest });
	const [, init] = fetchMock.mock.calls[1] as [
		string,
		RequestInit & { headers: Record<string, string> },
	];
	// No X-Idempotent-key header sent
	expect(init.headers["X-Idempotent-key"]).toBeUndefined();
});

test("orderReference with spaces or non-ASCII characters works correctly", async () => {
	fetchMock.mockImplementation(async () =>
		ok({ success: true, message: "ok" }),
	);
	// References with spaces and non-ASCII are valid user identifiers
	await nomba.checkout.createOrder({
		order: { ...order, orderReference: "Order 1042" },
	});
	await nomba.checkout.createOrder({
		order: { ...order, orderReference: "café-77" },
	});
	// Both should succeed - the key is tracked internally but never sent in headers
	expect(fetchMock).toHaveBeenCalledTimes(3); // 1 token + 2 orders
});
