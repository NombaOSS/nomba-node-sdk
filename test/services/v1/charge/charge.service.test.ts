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
		body: init.body ? JSON.parse(init.body as string) : undefined,
	};
};
const base = "https://api.nomba.com/v1/checkout";

test("getOrder encodes the reference in the path", async () => {
	await nomba.charge.getOrder("ref/1");
	expect(apiCall()).toEqual({
		url: `${base}/order/ref%2F1`,
		method: "GET",
		body: undefined,
	});
});

test("fetchFlashAccount", async () => {
	await nomba.charge.fetchFlashAccount("ref-1");
	expect(apiCall()).toMatchObject({
		url: `${base}/get-checkout-kta/ref-1`,
		method: "GET",
	});
});

test("getSavedCards sends the otp as a query param", async () => {
	await nomba.charge.getSavedCards("ref-1", "123456");
	expect(apiCall()).toMatchObject({
		url: `${base}/user-card/ref-1?otp=123456`,
		method: "GET",
	});
});

test("submitCardDetails stringifies a card object", async () => {
	const card = {
		cardCVV: 11,
		cardExpiryMonth: 3,
		cardExpiryYear: 2050,
		cardNumber: "5190752909999995",
		cardPin: 1111,
	};
	const deviceInformation = {
		deviceChannel: "Browser",
		httpBrowserJavaEnabled: false,
	};
	await nomba.charge.submitCardDetails({
		cardDetails: card,
		key: "",
		orderReference: "ref-1",
		saveCard: true,
		deviceInformation,
	});
	expect(apiCall()).toEqual({
		url: `${base}/checkout-card-detail`,
		method: "POST",
		body: {
			cardDetails: JSON.stringify(card),
			key: "",
			orderReference: "ref-1",
			saveCard: true,
			deviceInformation,
		},
	});
});

test("submitCardDetails passes an already prepared string through", async () => {
	await nomba.charge.submitCardDetails({
		cardDetails: "ciphertext",
		key: "k",
		orderReference: "ref-1",
	});
	expect(apiCall().body).toEqual({
		cardDetails: "ciphertext",
		key: "k",
		orderReference: "ref-1",
	});
});

test("submitCardOtp, resendOtp and fetchTransactionDetails post their bodies", async () => {
	fetchMock.mockImplementation(async () => ok({}));
	await nomba.charge.submitCardOtp({
		otp: "9999",
		orderReference: "ref-1",
		transactionId: "tx-1",
	});
	await nomba.charge.resendOtp("ref-1");
	await nomba.charge.fetchTransactionDetails("ref-1");
	const calls = fetchMock.mock.calls
		.slice(1)
		.map(([url, init]) => [url, init.method, JSON.parse(init.body)]);
	expect(calls).toEqual([
		[
			`${base}/checkout-card-otp`,
			"POST",
			{ otp: "9999", orderReference: "ref-1", transactionId: "tx-1" },
		],
		[`${base}/resend-otp`, "POST", { orderReference: "ref-1" }],
		[
			`${base}/confirm-transaction-receipt`,
			"POST",
			{ orderReference: "ref-1" },
		],
	]);
});

test("cancelTransaction posts transactionId and forceCancel", async () => {
	await nomba.charge.cancelTransaction({
		transactionId: "tx-1",
		forceCancel: false,
	});
	expect(apiCall()).toEqual({
		url: `${base}/transaction/cancel`,
		method: "POST",
		body: { transactionId: "tx-1", forceCancel: false },
	});
});

test("the saved-card OTP endpoints", async () => {
	fetchMock.mockImplementation(async () => ok({}));
	await nomba.charge.requestSavedCardsOtp("ref-1");
	await nomba.charge.requestSaveCardOtp({
		orderReference: "ref-1",
		phoneNumber: "0800",
	});
	await nomba.charge.submitSaveCardOtp({
		orderReference: "ref-1",
		phoneNumber: "0800",
		otp: "1",
	});
	const calls = fetchMock.mock.calls
		.slice(1)
		.map(([url, init]) => [url, init.method, JSON.parse(init.body)]);
	expect(calls).toEqual([
		[`${base}/user-card/saved-card/auth`, "POST", { orderReference: "ref-1" }],
		[
			`${base}/user-card/auth`,
			"POST",
			{ orderReference: "ref-1", phoneNumber: "0800" },
		],
		[
			`${base}/user-card`,
			"POST",
			{ orderReference: "ref-1", phoneNumber: "0800", otp: "1" },
		],
	]);
});

test("charge endpoints keep /v1/checkout in the sandbox", async () => {
	nomba = new Nomba({
		clientId: "cid",
		clientSecret: "secret",
		accountId: "acc-1",
		environment: "sandbox",
	});
	await nomba.charge.resendOtp("ref-1");
	expect(fetchMock.mock.calls[1]?.[0]).toBe(
		"https://sandbox.nomba.com/v1/checkout/resend-otp",
	);
});

test.each(["", "..", "."])(
	"empty or dot references are rejected by every path-id method: %j",
	async (bad) => {
		await expect(nomba.charge.getOrder(bad)).rejects.toThrow("Invalid id");
		await expect(nomba.charge.fetchFlashAccount(bad)).rejects.toThrow(
			"Invalid id",
		);
		await expect(nomba.charge.getSavedCards(bad, "1")).rejects.toThrow(
			"Invalid id",
		);
		expect(fetchMock).not.toHaveBeenCalled();
	},
);
