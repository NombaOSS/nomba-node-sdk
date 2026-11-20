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
	fetchMock.mockImplementation(async () =>
		reply("00", { status: "COMPLETED" }),
	);
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

const transfer = {
	amount: 250,
	sourceCurrency: "USD",
	destinationCurrency: "USD",
	receiverName: "John Cena",
	accountNumber: "0903086112",
	institutionName: "Mpesa",
	sourceCountryIsoCode: "CD",
	destinationCountryIsoCode: "CD",
	paymentMethod: "MobileMoney" as const,
	accountType: "INDIVIDUAL" as const,
	idempotencyKey: "transfer-key-123",
};

test("read endpoints hit their documented paths and queries", async () => {
	respondOnce("00", { rates: [{ exchangeRateId: "r1" }] });
	expect(
		await nomba.globalPayout.exchangeRates({ from: "EUR", to: "USD" }),
	).toEqual([{ exchangeRateId: "r1" }]);
	await nomba.globalPayout.listAccounts();
	await nomba.globalPayout.getAccount("66bc");
	await nomba.globalPayout.listSandboxAccounts();
	await nomba.globalPayout.getSandboxAccount("sandbox-acc-cad-001");
	await nomba.globalPayout.institutionProviders({
		isMobileMoney: false,
		countryIsoCode: "US",
	});
	await nomba.globalPayout.paymentMethods({ destinationCountryIsoCode: "CA" });
	await nomba.globalPayout.getTransaction("01kj9");
	const base = "https://api.nomba.com/v1";
	expect([0, 1, 2, 3, 4, 5, 6, 7].map((n) => apiCall(n).url)).toEqual([
		`${base}/global-payout/exchange-rates?from=EUR&to=USD`,
		`${base}/global-payout/accounts`,
		`${base}/global-payout/accounts/66bc`,
		`${base}/sandbox/global-payout/accounts`,
		`${base}/sandbox/global-payout/accounts/sandbox-acc-cad-001`,
		`${base}/global-payout/bank/providers?isMobileMoney=false&countryIsoCode=US`,
		`${base}/global-payout/payment-methods?destinationCountryIsoCode=CA`,
		`${base}/global-payout/transactions/01kj9`,
	]);
});

test("the legacy status:false flag on a 00 response is not an error", async () => {
	fetchMock.mockImplementationOnce(
		async () =>
			new Response(
				JSON.stringify({
					code: "00",
					description: "Success",
					status: false,
					data: [],
				}),
				{ status: 200 },
			),
	);
	await expect(nomba.globalPayout.listAccounts()).resolves.toEqual([]);
});

test("convert posts the body", async () => {
	const params = {
		amount: 15,
		currency: "USD",
		destinationCurrency: "EUR",
		transactionType: "EXCHANGE",
	};
	await nomba.globalPayout.convert(params);
	expect([apiCall().method, apiCall().url, apiCall().body]).toEqual([
		"POST",
		"https://api.nomba.com/v1/global-payout/money/convert",
		params,
	]);
});

test("authorizeTransfer sends the idempotencyKey in the body (no header)", async () => {
	await nomba.globalPayout.authorizeTransfer(transfer);
	const call = apiCall();
	expect(call.url).toBe(
		"https://api.nomba.com/v1/global-payout/transfer/authorize",
	);
	// No X-Idempotent-key header sent
	expect(call.key).toBeUndefined();
	// idempotencyKey is in the request body
	expect(call.body.idempotencyKey).toBe("transfer-key-123");
	expect(call.body).toEqual(transfer);
});

test("authorizeExchange keeps the caller's key, and a 409 reports it without retrying", async () => {
	fetchMock.mockImplementationOnce(
		async () =>
			new Response(
				JSON.stringify({
					code: "409",
					description: "currently being processed; please retry",
				}),
				{ status: 409 },
			),
	);
	const err = await nomba.globalPayout
		.authorizeExchange({
			amount: 1,
			sourceCurrency: "USD",
			destinationCurrency: "CDF",
			senderName: "A",
			receiverName: "A",
			sourceCountryIsoCode: "CD",
			destinationCountryIsoCode: "CD",
			idempotencyKey: "mine",
		})
		.catch((e) => e);
	expect(err).toBeInstanceOf(OutcomeUnknownError);
	expect(err.idempotencyKey).toBe("mine");
	expect(fetchMock).toHaveBeenCalledTimes(2);
	expect(apiCall().url).toBe(
		"https://api.nomba.com/v1/global-payout/exchange/authorize",
	);
	expect(apiCall().body.idempotencyKey).toBe("mine");
});

test("an empty idempotencyKey throws IdempotencyKeyAbsentError", async () => {
	await expect(
		nomba.globalPayout.authorizeTransfer({
			...transfer,
			idempotencyKey: "",
		}),
	).rejects.toThrow(IdempotencyKeyAbsentError);
});

test("a missing idempotencyKey throws IdempotencyKeyAbsentError", async () => {
	const { idempotencyKey: _, ...withoutKey } = transfer;
	await expect(
		// @ts-expect-error - testing runtime validation
		nomba.globalPayout.authorizeTransfer(withoutKey),
	).rejects.toThrow(IdempotencyKeyAbsentError);
});
