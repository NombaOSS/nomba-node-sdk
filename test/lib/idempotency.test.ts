import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Nomba, NombaError, OutcomeUnknownError } from "../../src/index.js";

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
const fail = (status: number, code = String(status)) =>
	new Response(JSON.stringify({ code, description: "failed" }), { status });

let fetchMock: ReturnType<typeof vi.fn>;
let nomba: Nomba;
beforeEach(() => {
	fetchMock = vi.fn().mockResolvedValueOnce(ok(tokenData)); // token issue
	vi.stubGlobal("fetch", fetchMock);
	nomba = new Nomba({
		clientId: "cid",
		clientSecret: "secret",
		accountId: "acc-1",
		retryDelayMs: 0,
	});
});
afterEach(() => vi.unstubAllGlobals());

const apiCalls = () =>
	fetchMock.mock.calls.slice(1) as [
		string,
		RequestInit & { headers: Record<string, string> },
	][];
const keys = () =>
	apiCalls().map(([, init]) => init.headers["X-Idempotent-key"]);
type Caught = Error & {
	attempts: number;
	idempotencyKey: string;
	cause: unknown;
};
const caught = (p: Promise<unknown>) =>
	p.then(
		() => {
			throw new Error("expected the call to reject");
		},
		(e: unknown) => e as Caught,
	);
const post = (opts?: { idempotencyKey?: string }) =>
	nomba.request("POST", "/v1/x", { body: { a: 1 }, ...opts });

test("X-Idempotent-key header is not sent (idempotency is via merchantTxRef in body)", async () => {
	fetchMock.mockImplementation(async () => ok({}));
	await post();
	await nomba.request("GET", "/v1/x");
	const [postKey, getKey] = keys();
	expect(postKey).toBeUndefined();
	expect(getKey).toBeUndefined();
});

test("caller-supplied idempotencyKey is tracked internally but not sent as header", async () => {
	fetchMock.mockImplementation(async () => ok({}));
	await post({ idempotencyKey: "my-key" });
	expect(keys()).toEqual([undefined]); // No header sent
});

test("idempotencyKey is tracked per-call but not sent as header", async () => {
	fetchMock.mockImplementation(async () => ok({}));
	await post();
	await post();
	// No X-Idempotent-key headers sent
	expect(keys()).toEqual([undefined, undefined]);
});

// Nomba uses merchantTxRef (in request body) for idempotency, not headers. A live sandbox check (2026-09-22)
// confirmed X-Idempotent-key header does not dedupe. So a mutating call is not retried on any failure whose
// outcome is ambiguous — retrying with a different merchantTxRef could double-execute it. Only GETs and 429s
// (never processed at all) are retried. See #send's doc comment in src/services/http/http-client.service.ts.

test("a mutating call is NOT retried on a 5xx; it fails after one attempt", async () => {
	fetchMock.mockResolvedValueOnce(fail(500));
	await expect(caught(post())).resolves.toBeInstanceOf(OutcomeUnknownError);
	expect(apiCalls()).toHaveLength(1);
});

test("a mutating call is NOT retried on a network error or a timeout", async () => {
	fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
	const networkErr = await caught(post());
	expect(networkErr).toBeInstanceOf(OutcomeUnknownError);
	expect(apiCalls()).toHaveLength(1);

	fetchMock.mockRejectedValueOnce(
		new DOMException("timed out", "TimeoutError"),
	);
	const timeoutErr = await caught(post());
	expect(timeoutErr).toBeInstanceOf(OutcomeUnknownError);
	expect(apiCalls()).toHaveLength(2);
});

test("a GET (unlike a mutating call) IS retried on a 5xx until it succeeds", async () => {
	fetchMock
		.mockResolvedValueOnce(fail(500))
		.mockResolvedValueOnce(fail(503))
		.mockResolvedValueOnce(ok({ done: true }));
	expect(await nomba.request("GET", "/v1/x")).toEqual({ done: true });
	expect(apiCalls()).toHaveLength(3);
});

test("a mutating call that fails with unknown outcome throws OutcomeUnknownError after one attempt", async () => {
	fetchMock.mockResolvedValueOnce(fail(502));
	const err = await caught(post({ idempotencyKey: "k-1" }));
	expect(err).toBeInstanceOf(OutcomeUnknownError);
	expect(err).toMatchObject({
		method: "POST",
		path: "/v1/x",
		idempotencyKey: "k-1",
		attempts: 1,
	});
	expect(err.cause).toBeInstanceOf(NombaError);
	expect(apiCalls()).toHaveLength(1);
});

test("a 409 (same key still in flight) is reported as unknown after one attempt, not retried", async () => {
	fetchMock.mockResolvedValueOnce(
		new Response(
			JSON.stringify({
				code: "409",
				description:
					"Request with this idempotency key is currently being processed; please retry.",
			}),
			{ status: 409 },
		),
	);
	await expect(post()).rejects.toBeInstanceOf(OutcomeUnknownError);
	expect(apiCalls()).toHaveLength(1);
});

test("a definite rejection (4xx) is thrown at once, not retried", async () => {
	fetchMock.mockResolvedValueOnce(fail(400, "02"));
	await expect(post()).rejects.toMatchObject({
		name: "NombaError",
		status: 400,
		code: "02",
	});
	expect(apiCalls()).toHaveLength(1);
});

test("a 429 is retried, and stays a plain NombaError when retries run out", async () => {
	fetchMock.mockImplementation(async () => fail(429));
	const err = await caught(post());
	expect(err).toBeInstanceOf(NombaError);
	expect(err).not.toBeInstanceOf(OutcomeUnknownError);
	expect(apiCalls()).toHaveLength(3);
});

test("a GET that keeps failing throws the plain error after retries", async () => {
	fetchMock.mockImplementation(async () => fail(500));
	const err = await caught(nomba.request("GET", "/v1/x"));
	expect(err).toBeInstanceOf(NombaError);
	expect(apiCalls()).toHaveLength(3);
});

test("maxAttempts only affects GET/429 retries; a mutating call is one attempt either way", async () => {
	nomba = new Nomba({
		clientId: "cid",
		clientSecret: "secret",
		accountId: "acc-1",
		maxAttempts: 5,
	});
	fetchMock.mockResolvedValueOnce(fail(500));
	const err = await caught(post());
	expect(err).toBeInstanceOf(OutcomeUnknownError);
	expect(err.attempts).toBe(1);
	expect(apiCalls()).toHaveLength(1);
});

test("the 401 renewal retry does not send X-Idempotent-key header", async () => {
	fetchMock
		.mockResolvedValueOnce(fail(401))
		.mockResolvedValueOnce(ok({ ...tokenData, access_token: "at2" }))
		.mockResolvedValueOnce(ok({}));
	await post();
	const posted = apiCalls().filter(([url]) => url.endsWith("/v1/x"));
	expect(posted).toHaveLength(2);
	// No X-Idempotent-key headers sent
	expect(posted[0]?.[1].headers["X-Idempotent-key"]).toBeUndefined();
	expect(posted[1]?.[1].headers["X-Idempotent-key"]).toBeUndefined();
});

test("auth calls have no key and are not retried on 5xx (only on 429)", async () => {
	fetchMock.mockReset().mockResolvedValueOnce(fail(500));
	await expect(nomba.issueToken()).rejects.toMatchObject({ status: 500 });
	expect(fetchMock).toHaveBeenCalledTimes(1);
	expect(
		(
			fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }]
		)[1].headers["X-Idempotent-key"],
	).toBeUndefined();
	fetchMock
		.mockReset()
		.mockResolvedValueOnce(fail(429))
		.mockResolvedValueOnce(ok(tokenData));
	await nomba.issueToken();
	expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("every request has a timeout signal", async () => {
	fetchMock.mockImplementation(async () => ok({}));
	await nomba.request("GET", "/v1/x");
	expect(apiCalls()[0]?.[1].signal).toBeInstanceOf(AbortSignal);
});

test("transfers track merchantTxRef internally but don't send X-Idempotent-key header", async () => {
	fetchMock.mockImplementation(async () => ok({ status: "SUCCESS" }));
	const p = {
		amount: 1,
		accountNumber: "0123456789",
		accountName: "A B",
		bankCode: "058",
		merchantTxRef: "tx-1",
	};
	await nomba.transfers.bankTransfer(p);
	await nomba.transfers.bankTransfer({ ...p, merchantTxRef: "tx-2" });
	await nomba.transfers.walletTransfer({
		amount: 1,
		receiverAccountId: "r",
		merchantTxRef: "tx-3",
		senderName: "Test",
	});
	await nomba.transfers.bankTransferFromSubAccount("sub-1", {
		...p,
		merchantTxRef: "tx-4",
	});
	// No X-Idempotent-key headers sent (idempotency is via merchantTxRef in body)
	expect(keys()).toEqual([undefined, undefined, undefined, undefined]);
});

test("a transfer whose outcome stays unknown reports its merchantTxRef as the key, after one attempt", async () => {
	fetchMock.mockResolvedValueOnce(fail(504));
	const err = await caught(
		nomba.transfers.bankTransfer({
			amount: 1,
			accountNumber: "0123456789",
			accountName: "A B",
			bankCode: "058",
			merchantTxRef: "tx-9",
		}),
	);
	expect(err).toBeInstanceOf(OutcomeUnknownError);
	expect(err.idempotencyKey).toBe("tx-9");
	expect(err.attempts).toBe(1);
	expect(apiCalls()).toHaveLength(1);
});

test("a 409 that is a key conflict (not 'being processed') is a definite error, not retried", async () => {
	fetchMock.mockResolvedValueOnce(
		new Response(
			JSON.stringify({
				code: "409",
				description: "key already used for another request",
			}),
			{ status: 409 },
		),
	);
	await expect(post()).rejects.toMatchObject({
		name: "NombaError",
		status: 409,
	});
	expect(apiCalls()).toHaveLength(1);
});

test("an unreadable 200 body on a mutating call is 'outcome unknown' after one attempt", async () => {
	fetchMock.mockResolvedValueOnce(
		new Response("<html>cut off", { status: 200 }),
	);
	const err = await caught(post());
	expect(err).toBeInstanceOf(OutcomeUnknownError);
	expect(apiCalls()).toHaveLength(1);
});

test("an unreadable error body keeps its HTTP status", async () => {
	fetchMock.mockImplementationOnce(
		async () =>
			new Response("<html>bad request</html>", {
				status: 400,
				statusText: "Bad Request",
			}),
	);
	await expect(post()).rejects.toMatchObject({
		name: "NombaError",
		status: 400,
		description: "Bad Request",
	});
});

test("a 408 on a mutating call is unknown-outcome, not retried; a GET retries it", async () => {
	fetchMock.mockResolvedValueOnce(fail(408));
	await expect(caught(post())).resolves.toBeInstanceOf(OutcomeUnknownError);
	expect(apiCalls()).toHaveLength(1);

	fetchMock
		.mockResolvedValueOnce(fail(408))
		.mockResolvedValueOnce(ok({ done: true }));
	expect(await nomba.request("GET", "/v1/x")).toEqual({ done: true });
	expect(apiCalls()).toHaveLength(3);
});

test("transfer with merchantTxRef tracks it internally but doesn't send header", async () => {
	fetchMock.mockImplementation(async () => ok({ status: "SUCCESS" }));
	await nomba.transfers.walletTransfer({
		amount: 1,
		receiverAccountId: "r",
		merchantTxRef: "tx-7",
		senderName: "Test",
	});
	// No X-Idempotent-key header sent
	expect(keys()).toEqual([undefined]);
});

test.each(["has space", "new\nline", "ünïcode"])(
	"keys with spaces, newlines, or non-ASCII are allowed (tracked internally only): %j",
	async (key) => {
		// The key is never sent in headers, so any characters are valid.
		// User-provided values like orderReference or tokenKey can contain any characters.
		fetchMock.mockResolvedValueOnce(ok({ success: true }));
		await post({ idempotencyKey: key });
		expect(apiCalls()).toHaveLength(1);
	},
);
