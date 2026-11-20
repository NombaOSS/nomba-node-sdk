import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Nomba, NombaError } from "../../../../src/index.js";

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
	fetchMock.mockImplementation(async () => ok({ status: "SUCCESS" }));
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

const bank = {
	amount: 5000,
	accountNumber: "0123456789",
	accountName: "Ada Obi",
	bankCode: "058",
	merchantTxRef: "tx-1",
	narration: "rent",
};
const wallet = {
	amount: 100,
	receiverAccountId: "0b0c0d0e-0000-0000-0000-000000000000",
	merchantTxRef: "tx-2",
	senderName: "Ada Obi",
};

test("listBanks and lookupBankAccount", async () => {
	fetchMock.mockImplementationOnce(async () =>
		ok([{ code: "058", name: "GTBank", nipCode: null, logo: "" }]),
	);
	expect(await nomba.transfers.listBanks()).toEqual([
		{ code: "058", name: "GTBank", nipCode: null, logo: "" },
	]);
	expect(apiCall()).toEqual({
		url: "https://api.nomba.com/v1/transfers/banks",
		method: "GET",
		body: undefined,
	});
	await nomba.transfers.lookupBankAccount({
		accountNumber: "0123456789",
		bankCode: "058",
	});
	expect(fetchMock.mock.calls[2]?.[0]).toBe(
		"https://api.nomba.com/v1/transfers/bank/lookup",
	);
	expect(JSON.parse(fetchMock.mock.calls[2]?.[1].body)).toEqual({
		accountNumber: "0123456789",
		bankCode: "058",
	});
});

test("bankTransfer posts to /v2/transfers/bank", async () => {
	await nomba.transfers.bankTransfer(bank);
	expect(apiCall()).toEqual({
		url: "https://api.nomba.com/v2/transfers/bank",
		method: "POST",
		body: bank,
	});
});

test("bankTransferFromSubAccount, walletTransfer and walletTransferFromSubAccount use their paths", async () => {
	await nomba.transfers.bankTransferFromSubAccount("sub-1", bank);
	await nomba.transfers.walletTransfer(wallet);
	await nomba.transfers.walletTransferFromSubAccount("sub-1", wallet);
	const urls = fetchMock.mock.calls.slice(1).map((c) => c[0]);
	expect(urls).toEqual([
		"https://api.nomba.com/v2/transfers/bank/sub-1",
		"https://api.nomba.com/v2/transfers/wallet",
		"https://api.nomba.com/v2/transfers/wallet/sub-1",
	]);
});

test("a 201 'processing' response throws without onPending", async () => {
	fetchMock.mockImplementationOnce(
		async () =>
			new Response(
				JSON.stringify({
					code: "201",
					description: "PROCESSING",
					message: "Unable to process response, please rely on web hook",
					status: false,
					data: { status: "PENDING_BILLING" },
				}),
				{ status: 201 },
			),
	);
	await expect(nomba.transfers.bankTransfer(bank)).rejects.toMatchObject({
		name: "UnconfirmedOutcomeError",
		reason: "code",
		code: "201",
	});
});

// The transfer endpoints document only SUCCESS and PENDING_BILLING, and say to treat anything else as pending.
test("an undocumented status (REFUND on a transfer) is unconfirmed, not acted on", async () => {
	fetchMock.mockImplementationOnce(async () =>
		ok({ id: "API-TRANSFER-1", status: "REFUND" }),
	);
	await expect(nomba.transfers.walletTransfer(wallet)).rejects.toMatchObject({
		name: "UnconfirmedOutcomeError",
		reason: "status",
		status: "REFUND",
		data: { id: "API-TRANSFER-1", status: "REFUND" },
	});
});

test("a real failure still throws", async () => {
	fetchMock.mockImplementationOnce(
		async () =>
			new Response(
				JSON.stringify({ code: "02", description: "amount can not be null" }),
				{ status: 400 },
			),
	);
	await expect(nomba.transfers.bankTransfer(bank)).rejects.toBeInstanceOf(
		NombaError,
	);
});

test("code 201 is still an error on endpoints that do not accept it", async () => {
	fetchMock.mockImplementationOnce(
		async () =>
			new Response(
				JSON.stringify({ code: "201", description: "PROCESSING", data: {} }),
				{ status: 201 },
			),
	);
	await expect(nomba.transfers.listBanks()).rejects.toMatchObject({
		code: "201",
	});
});

test("a 401 is renewed and retried once", async () => {
	// A 401 means the request was not processed, so one retry after renewing the token is safe.
	const unauthorized = () =>
		new Response(JSON.stringify({ code: "401", description: "Unauthorized" }), {
			status: 401,
		});
	fetchMock
		.mockReset()
		.mockResolvedValueOnce(ok(tokenData))
		.mockResolvedValueOnce(unauthorized())
		.mockResolvedValueOnce(ok({ ...tokenData, access_token: "at2" }))
		.mockResolvedValueOnce(ok({ status: "SUCCESS", id: "x" }));
	expect(await nomba.transfers.bankTransfer(bank)).toEqual({
		status: "SUCCESS",
		id: "x",
	});
	expect(fetchMock).toHaveBeenCalledTimes(4);
});

test.each(["", ".", ".."])(
	"sub account ids that would change the endpoint are rejected: %j",
	async (bad) => {
		await expect(
			nomba.transfers.bankTransferFromSubAccount(bad, bank),
		).rejects.toThrow("Invalid id");
		await expect(
			nomba.transfers.walletTransferFromSubAccount(bad, wallet),
		).rejects.toThrow("Invalid id");
		expect(fetchMock).not.toHaveBeenCalled();
	},
);

const processing = () =>
	new Response(
		JSON.stringify({
			code: "201",
			description: "PROCESSING",
			data: { status: "PENDING_BILLING" },
		}),
		{ status: 201 },
	);

test("code 200 with status PENDING_BILLING throws without onPending", async () => {
	fetchMock.mockImplementationOnce(
		async () =>
			new Response(
				JSON.stringify({
					code: "200",
					description: "SUCCESS",
					status: true,
					data: {
						id: "API-TRANSFER-1",
						status: "PENDING_BILLING",
						amount: 1.0,
					},
				}),
				{ status: 200 },
			),
	);
	await expect(nomba.transfers.bankTransfer(bank)).rejects.toMatchObject({
		name: "UnconfirmedOutcomeError",
		reason: "status",
		status: "PENDING_BILLING",
		data: { id: "API-TRANSFER-1", status: "PENDING_BILLING", amount: 1.0 },
	});
});

test("every transfer method throws for 201 without onPending", async () => {
	fetchMock.mockImplementation(async () => processing());
	await expect(
		nomba.transfers.bankTransferFromSubAccount("sub-1", bank),
	).rejects.toMatchObject({ name: "UnconfirmedOutcomeError" });
	await expect(nomba.transfers.walletTransfer(wallet)).rejects.toMatchObject({
		name: "UnconfirmedOutcomeError",
	});
	await expect(
		nomba.transfers.walletTransferFromSubAccount("sub-1", wallet),
	).rejects.toMatchObject({ name: "UnconfirmedOutcomeError" });
});

test("the 401 retry resends the identical body and merchantTxRef", async () => {
	const unauthorized = () =>
		new Response(JSON.stringify({ code: "401", description: "Unauthorized" }), {
			status: 401,
		});
	fetchMock
		.mockReset()
		.mockResolvedValueOnce(ok(tokenData))
		.mockResolvedValueOnce(unauthorized())
		.mockResolvedValueOnce(ok({ ...tokenData, access_token: "at2" }))
		.mockResolvedValueOnce(ok({ status: "SUCCESS" }));
	await nomba.transfers.bankTransfer(bank);
	const first = fetchMock.mock.calls[1]?.[1].body;
	const retry = fetchMock.mock.calls[3]?.[1].body;
	expect(retry).toBe(first);
	expect(JSON.parse(retry)).toMatchObject({ merchantTxRef: "tx-1" });
});
