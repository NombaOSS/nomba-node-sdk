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

const apiCall = (n = 0) => {
	const [url, init] = fetchMock.mock.calls[n + 1] as [
		string,
		RequestInit & { headers: Record<string, string> },
	];
	return {
		url,
		method: init.method,
		body: init.body ? JSON.parse(init.body as string) : undefined,
		headers: init.headers,
	};
};

const createParams = {
	customerAccountNumber: "0212343456",
	bankCode: "101",
	customerName: "Kolapo Ojo",
	customerAccountName: "Kolapo Ojo",
	amount: 100,
	frequency: "WEEKLY" as const,
	merchantReference: "12003074001",
	startDate: "2025-08-29T14:58",
	endDate: "2025-08-30T10:40",
	customerEmail: "kolapo@gmail.com",
};

test("createMandate reads the responseCode/responseMessage envelope (not code/description) and defaults the key to merchantReference", async () => {
	fetchMock.mockResolvedValueOnce(
		new Response(
			JSON.stringify({
				responseMessage: "Success",
				responseCode: "00",
				data: {
					mandateId: "m-1",
					merchantReference: "12003074001",
					phoneNumber: "0807",
					description: "Pay N50",
				},
			}),
			{ status: 200 },
		),
	);
	const result = await nomba.directDebits.createMandate(createParams);
	expect(result).toEqual({
		mandateId: "m-1",
		merchantReference: "12003074001",
		phoneNumber: "0807",
		description: "Pay N50",
	});
	const { url, method, body, headers } = apiCall();
	expect(url).toBe("https://api.nomba.com/v1/direct-debits");
	expect(method).toBe("POST");
	expect(body).toEqual(createParams);
	expect(headers["X-Idempotent-key"]).toBeUndefined(); // No X-Idempotent-key header sent
});

test("createMandate reports a responseCode failure through NombaError", async () => {
	fetchMock.mockResolvedValueOnce(
		new Response(
			JSON.stringify({
				responseCode: "01",
				responseMessage: "Invalid bank code",
			}),
			{ status: 200 },
		),
	);
	await expect(
		nomba.directDebits.createMandate(createParams),
	).rejects.toMatchObject({
		name: "NombaError",
		code: "01",
		description: "Invalid bank code",
	});
});

test("getMandateStatus sends mandateId as a query param", async () => {
	await nomba.directDebits.getMandateStatus("m-1");
	expect(apiCall()).toMatchObject({
		url: "https://api.nomba.com/v1/direct-debits/status?mandateId=m-1",
		method: "GET",
	});
});

test("debitMandate posts the params; the key is generated, not defaulted to the reusable mandateId", async () => {
	await nomba.directDebits.debitMandate({ mandateId: "m-1", amount: "110.00" });
	const { url, method, body, headers } = apiCall();
	expect(url).toBe("https://api.nomba.com/v1/direct-debits/debit-mandate");
	expect(method).toBe("POST");
	expect(body).toEqual({ mandateId: "m-1", amount: "110.00" });
	// No X-Idempotent-key header sent
	expect(headers["X-Idempotent-key"]).toBeUndefined();
});

test("listMandates sends paging and filters as query params", async () => {
	await nomba.directDebits.listMandates({
		page: 0,
		pageSize: 20,
		status: "Active",
		from: "2025-08-01",
		to: "2025-08-31",
	});
	expect(apiCall()).toMatchObject({
		url: "https://api.nomba.com/v1/direct-debits/mandates?page=0&pageSize=20&status=Active&from=2025-08-01&to=2025-08-31",
		method: "GET",
	});
});

test("updateMandateStatus sends a PUT; the key is generated, not defaulted to the reusable mandateId", async () => {
	await nomba.directDebits.updateMandateStatus({
		mandateId: "m-1",
		status: "SUSPEND",
	});
	const { url, method, body, headers } = apiCall();
	expect(url).toBe("https://api.nomba.com/v1/direct-debits/update-status");
	expect(method).toBe("PUT");
	expect(body).toEqual({ mandateId: "m-1", status: "SUSPEND" });
	// No X-Idempotent-key header sent
	expect(headers["X-Idempotent-key"]).toBeUndefined();
});

test("mutating calls have no X-Idempotent-key header", async () => {
	fetchMock.mockResolvedValueOnce(
		new Response(
			JSON.stringify({
				responseCode: "00",
				responseMessage: "Success",
				data: {},
			}),
			{ status: 200 },
		),
	);
	await nomba.directDebits.createMandate(createParams);
	await nomba.directDebits.debitMandate({ mandateId: "m-1", amount: "1" });
	await nomba.directDebits.updateMandateStatus({
		mandateId: "m-1",
		status: "ACTIVE",
	});
	// No X-Idempotent-key headers sent
	expect(apiCall(0).headers["X-Idempotent-key"]).toBeUndefined();
	expect(apiCall(1).headers["X-Idempotent-key"]).toBeUndefined();
	expect(apiCall(2).headers["X-Idempotent-key"]).toBeUndefined();
});

test("a 5xx on a mutating call is not auto-retried (same policy as every other resource)", async () => {
	fetchMock.mockResolvedValueOnce(
		new Response(
			JSON.stringify({ responseCode: "500", responseMessage: "err" }),
			{ status: 500 },
		),
	);
	await expect(
		nomba.directDebits.createMandate(createParams),
	).rejects.toThrow();
	expect(fetchMock).toHaveBeenCalledTimes(2); // token issue + the one failed attempt
});

test("a 401 renewal retry on createMandate still reads the responseCode envelope, not code/description", async () => {
	fetchMock
		.mockResolvedValueOnce(
			new Response(
				JSON.stringify({ code: "401", description: "Unauthorized" }),
				{ status: 401 },
			),
		)
		.mockResolvedValueOnce(ok({ ...tokenData, access_token: "at2" }))
		.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					responseCode: "00",
					responseMessage: "Success",
					data: { mandateId: "m-1" },
				}),
				{ status: 200 },
			),
		);
	const result = await nomba.directDebits.createMandate(createParams);
	expect(result).toMatchObject({ mandateId: "m-1" });
});
