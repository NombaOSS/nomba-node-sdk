import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	MemoryTokenStore,
	Nomba,
	NombaError,
	type NombaOptions,
	type TokenStore,
} from "../../../src/index.js";
import { SDK_VERSION } from "../../../src/lib/sdk-version.js";

const opts = { clientId: "cid", clientSecret: "secret", accountId: "acc-1" };
const inMinutes = (m: number) =>
	new Date(Date.now() + m * 60_000).toISOString();
const token = (n: number, expiresAt = inMinutes(30)) => ({
	businessId: "biz",
	access_token: `at${n}`,
	refresh_token: `rt${n}`,
	expiresAt,
});
const ok = (data?: unknown) =>
	new Response(JSON.stringify({ code: "00", description: "Success", data }), {
		status: 200,
	});

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
	fetchMock = vi.fn();
	vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const call = (i: number) => {
	const [url, init] = fetchMock.mock.calls[i] as [string, RequestInit];
	return {
		url,
		init,
		body: init.body ? JSON.parse(init.body as string) : undefined,
	};
};

test("issueToken sends credentials with accountId header and no Authorization", async () => {
	fetchMock.mockResolvedValueOnce(ok(token(1)));
	expect(await new Nomba(opts).issueToken()).toEqual(
		token(1, expect.any(String)),
	);
	const { url, init, body } = call(0);
	expect(url).toBe("https://api.nomba.com/v1/auth/token/issue");
	expect(init.method).toBe("POST");
	expect(init.headers).toEqual({
		accountId: "acc-1",
		"Content-Type": "application/json",
		"X-Nomba-Sdk-Version": SDK_VERSION,
		"User-Agent": `nomba_node_sdk:v${SDK_VERSION}`,
	});
	expect(body).toEqual({
		grant_type: "client_credentials",
		client_id: "cid",
		client_secret: "secret",
	});
});

test("every request refuses to follow a redirect, so the bearer token can't leak to another host", async () => {
	fetchMock.mockResolvedValueOnce(ok(token(1)));
	await new Nomba(opts).issueToken();
	expect(call(0).init.redirect).toBe("error");
});

test("sandbox environment uses the sandbox base URL", async () => {
	fetchMock.mockResolvedValueOnce(ok(token(1)));
	await new Nomba({ ...opts, environment: "sandbox" }).issueToken();
	expect(call(0).url).toBe("https://sandbox.nomba.com/v1/auth/token/issue");
});

test("request issues a token once, shared by concurrent calls, then sends it as Bearer", async () => {
	fetchMock
		.mockResolvedValueOnce(ok(token(1)))
		.mockResolvedValueOnce(ok({ n: 1 }))
		.mockResolvedValueOnce(ok({ n: 2 }));
	const nomba = new Nomba(opts);
	await Promise.all([
		nomba.request("GET", "/v1/a"),
		nomba.request("GET", "/v1/b"),
	]);
	expect(fetchMock).toHaveBeenCalledTimes(3);
	expect(call(1).init.headers).toEqual({
		accountId: "acc-1",
		Authorization: "Bearer at1",
		"X-Nomba-Sdk-Version": SDK_VERSION,
		"User-Agent": `nomba_node_sdk:v${SDK_VERSION}`,
	});
	expect(call(1).init.body).toBeUndefined();
});

test("refreshes with the old token when within 5 minutes of expiry", async () => {
	fetchMock
		.mockResolvedValueOnce(ok(token(1, inMinutes(4))))
		.mockResolvedValueOnce(ok(token(2)))
		.mockResolvedValueOnce(ok({}));
	const nomba = new Nomba(opts);
	await nomba.issueToken();
	await nomba.request("GET", "/v1/a");
	const refresh = call(1);
	expect(refresh.url).toBe("https://api.nomba.com/v1/auth/token/refresh");
	expect(refresh.init.headers).toEqual({
		accountId: "acc-1",
		"Content-Type": "application/json",
		Authorization: "Bearer at1",
		"X-Nomba-Sdk-Version": SDK_VERSION,
		"User-Agent": `nomba_node_sdk:v${SDK_VERSION}`,
	});
	expect(refresh.body).toEqual({
		grant_type: "refresh_token",
		refresh_token: "rt1",
	});
	expect(call(2).init.headers).toMatchObject({ Authorization: "Bearer at2" });
});

test("falls back to issuing a new token if refresh fails", async () => {
	fetchMock
		.mockResolvedValueOnce(ok(token(1, inMinutes(1))))
		.mockResolvedValueOnce(
			new Response(
				JSON.stringify({ code: "02", description: "Token expired" }),
				{ status: 401 },
			),
		)
		.mockResolvedValueOnce(ok(token(2)))
		.mockResolvedValueOnce(ok({}));
	const nomba = new Nomba(opts);
	await nomba.issueToken();
	await nomba.request("GET", "/v1/a");
	expect(call(2).url).toBe("https://api.nomba.com/v1/auth/token/issue");
	expect(call(3).init.headers).toMatchObject({ Authorization: "Bearer at2" });
});

test("revokeToken sends clientId and access_token, then the next request re-issues", async () => {
	fetchMock
		.mockResolvedValueOnce(ok(token(1)))
		.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					code: "00",
					description: "Token revoked successfully",
				}),
			),
		)
		.mockResolvedValueOnce(ok(token(2)))
		.mockResolvedValueOnce(ok({}));
	const nomba = new Nomba(opts);
	await nomba.issueToken();
	await nomba.revokeToken();
	expect(call(1).url).toBe("https://api.nomba.com/v1/auth/token/revoke");
	expect(call(1).body).toEqual({ clientId: "cid", access_token: "at1" });
	await nomba.request("GET", "/v1/a");
	expect(call(2).url).toBe("https://api.nomba.com/v1/auth/token/issue");
	expect(call(3).init.headers).toMatchObject({ Authorization: "Bearer at2" });
});

test("a 401 triggers one refresh and a retry", async () => {
	const unauthorized = () =>
		new Response(JSON.stringify({ code: "401", description: "Unauthorized" }), {
			status: 401,
		});
	fetchMock
		.mockResolvedValueOnce(ok(token(1)))
		.mockResolvedValueOnce(unauthorized())
		.mockResolvedValueOnce(ok(token(2)))
		.mockResolvedValueOnce(ok({ done: true }));
	const nomba = new Nomba(opts);
	await nomba.issueToken();
	expect(await nomba.request("GET", "/v1/a")).toEqual({ done: true });
	expect(call(2).url).toBe("https://api.nomba.com/v1/auth/token/refresh");
	expect(call(3).init.headers).toMatchObject({ Authorization: "Bearer at2" });
});

test("a refresh failing with 5xx is not retried as an issue", async () => {
	fetchMock
		.mockResolvedValueOnce(ok(token(1, inMinutes(1))))
		.mockResolvedValueOnce(
			new Response(
				JSON.stringify({ code: "500", description: "Server error" }),
				{ status: 500 },
			),
		);
	const nomba = new Nomba(opts);
	await nomba.issueToken();
	await expect(nomba.request("GET", "/v1/a")).rejects.toMatchObject({
		name: "TokenError",
		cause: { status: 500 },
	});
	expect(fetchMock).toHaveBeenCalledTimes(2);
});

test.each(["toString", "constructor", "__proto__"])(
	"inherited object keys are not environments: %s",
	(environment) => {
		// @ts-expect-error invalid on purpose
		expect(() => new Nomba({ ...opts, environment })).toThrow(
			"Unknown environment",
		);
	},
);

test("unknown environment throws", () => {
	// @ts-expect-error invalid on purpose
	expect(() => new Nomba({ ...opts, environment: "live" })).toThrow(
		"Unknown environment",
	);
});

test("a 200 with a non-00 code throws NombaError", async () => {
	fetchMock.mockResolvedValueOnce(
		new Response(
			JSON.stringify({
				code: "01",
				description: "Invalid credentials",
				data: null,
			}),
			{ status: 200 },
		),
	);
	await expect(new Nomba(opts).issueToken()).rejects.toMatchObject({
		name: "NombaError",
		status: 200,
		code: "01",
		description: "Invalid credentials",
	});
});

test("a failed issueToken never leaks the client secret in the thrown error", async () => {
	fetchMock.mockResolvedValueOnce(
		new Response(
			JSON.stringify({ code: "01", description: "Invalid credentials" }),
			{ status: 200 },
		),
	);
	const err = await new Nomba(opts).issueToken().catch((e) => e);
	expect(String(err)).not.toContain(opts.clientSecret);
	expect(JSON.stringify(err)).not.toContain(opts.clientSecret);
});

test("a failed refreshToken never leaks the refresh token in the thrown error", async () => {
	fetchMock
		.mockResolvedValueOnce(ok(token(1)))
		.mockResolvedValueOnce(
			new Response(
				JSON.stringify({ code: "01", description: "Invalid refresh token" }),
				{ status: 200 },
			),
		);
	const nomba = new Nomba(opts);
	await nomba.issueToken();
	const err = await nomba.refreshToken().catch((e) => e);
	expect(String(err)).not.toContain(token(1).refresh_token);
	expect(JSON.stringify(err)).not.toContain(token(1).refresh_token);
});

test("a non-JSON error response throws NombaError with the HTTP status", async () => {
	fetchMock.mockResolvedValueOnce(
		new Response("<html>bad gateway</html>", {
			status: 502,
			statusText: "Bad Gateway",
		}),
	);
	const err = await new Nomba(opts).issueToken().catch((e) => e);
	expect(err).toBeInstanceOf(NombaError);
	expect(err).toMatchObject({
		status: 502,
		code: "502",
		description: "Bad Gateway",
	});
});

test("uses a custom token store for get, set and clear", async () => {
	const store = new MemoryTokenStore();
	const spies = {
		get: vi.spyOn(store, "get"),
		set: vi.spyOn(store, "set"),
		clear: vi.spyOn(store, "clear"),
	};
	fetchMock
		.mockResolvedValueOnce(ok(token(1)))
		.mockResolvedValueOnce(
			new Response(JSON.stringify({ code: "00", description: "revoked" })),
		);
	const nomba = new Nomba({ ...opts, tokenStore: store });
	await nomba.issueToken();
	expect(spies.set).toHaveBeenCalledWith(token(1, expect.any(String)));
	await nomba.revokeToken();
	expect(spies.clear).toHaveBeenCalledOnce();
	expect(await store.get()).toBeUndefined();
});

test("instances sharing a store with a lock issue only one token", async () => {
	const inner = new MemoryTokenStore();
	let tail: Promise<unknown> = Promise.resolve();
	const store: TokenStore = {
		get: () => inner.get(),
		set: (t) => inner.set(t),
		clear: () => inner.clear(),
		// Minimal in-process mutex standing in for a distributed lock.
		lock: (fn) => {
			const run = tail.then(fn);
			tail = run.catch(() => {});
			return run;
		},
	};
	fetchMock
		.mockResolvedValueOnce(ok(token(1)))
		.mockResolvedValueOnce(ok({}))
		.mockResolvedValueOnce(ok({}));
	const a = new Nomba({ ...opts, tokenStore: store });
	const b = new Nomba({ ...opts, tokenStore: store });
	await Promise.all([a.request("GET", "/v1/a"), b.request("GET", "/v1/b")]);
	const urls = fetchMock.mock.calls.map((c) => c[0]);
	expect(urls.filter((u) => u.endsWith("/token/issue"))).toHaveLength(1);
	expect(fetchMock).toHaveBeenCalledTimes(3);
});

test("a 401 adopts a token another instance already stored instead of refreshing", async () => {
	const store = new MemoryTokenStore();
	fetchMock.mockResolvedValueOnce(ok(token(1)));
	const nomba = new Nomba({ ...opts, tokenStore: store });
	await nomba.issueToken();
	fetchMock
		.mockImplementationOnce(async () => {
			await store.set(token(2)); // another instance rotated the session
			return new Response(
				JSON.stringify({ code: "401", description: "Unauthorized" }),
				{ status: 401 },
			);
		})
		.mockResolvedValueOnce(ok({ done: true }));
	expect(await nomba.request("GET", "/v1/a")).toEqual({ done: true });
	expect(fetchMock).toHaveBeenCalledTimes(3);
	expect(call(2).init.headers).toMatchObject({ Authorization: "Bearer at2" });
});

const failing = (over: Partial<TokenStore>): TokenStore => ({
	get: () => undefined,
	set: () => {},
	clear: () => {},
	...over,
});

test("a store that keeps failing set() does not fail requests or force a re-issue", async () => {
	const set = vi.fn().mockRejectedValue(new Error("redis down"));
	const onStoreError = vi.fn();
	fetchMock
		.mockResolvedValueOnce(ok(token(1)))
		.mockResolvedValueOnce(ok({}))
		.mockResolvedValueOnce(ok({}));
	const nomba = new Nomba({
		...opts,
		tokenStore: failing({ set }),
		onStoreError,
	});
	await nomba.request("GET", "/v1/a");
	await nomba.request("GET", "/v1/b");
	expect(set).toHaveBeenCalledTimes(3); // first try + 2 retries
	expect(onStoreError).toHaveBeenCalledOnce();
	expect(fetchMock).toHaveBeenCalledTimes(3); // one issue, two requests
	expect(call(2).init.headers).toMatchObject({ Authorization: "Bearer at1" });
});

test("a transient set() failure is retried without reporting an error", async () => {
	const set = vi
		.fn()
		.mockRejectedValueOnce(new Error("blip"))
		.mockResolvedValue(undefined);
	const onStoreError = vi.fn();
	fetchMock.mockResolvedValueOnce(ok(token(1)));
	await new Nomba({
		...opts,
		tokenStore: failing({ set }),
		onStoreError,
	}).issueToken();
	expect(set).toHaveBeenCalledTimes(2);
	expect(onStoreError).not.toHaveBeenCalled();
});

test("a failing get() falls back to this process's token", async () => {
	const inner = new MemoryTokenStore();
	let down = false;
	const store = failing({
		get: () => {
			if (down) throw new Error("redis down");
			return inner.get();
		},
		set: (t) => inner.set(t),
	});
	const onStoreError = vi.fn();
	fetchMock.mockResolvedValueOnce(ok(token(1))).mockResolvedValueOnce(ok({}));
	const nomba = new Nomba({ ...opts, tokenStore: store, onStoreError });
	await nomba.issueToken();
	down = true;
	await nomba.request("GET", "/v1/a");
	expect(onStoreError).toHaveBeenCalled();
	expect(fetchMock).toHaveBeenCalledTimes(2); // no re-issue
});

// base + path concatenation: these would send the bearer token to another host.
test.each([".attacker.example/x", "@attacker.example/x", "x", ""])(
	"request rejects a path that could change the host: %j",
	async (path) => {
		await expect(new Nomba(opts).request("GET", path)).rejects.toThrow(
			TypeError,
		);
		expect(fetchMock).not.toHaveBeenCalled();
	},
);

test("request keeps absolute paths on the configured host", async () => {
	fetchMock.mockResolvedValueOnce(ok(token(1))).mockResolvedValueOnce(ok({}));
	await new Nomba(opts).request("GET", "//attacker.example/x");
	expect(fetchMock.mock.calls[1]?.[0]).toBe(
		"https://api.nomba.com//attacker.example/x",
	);
});

describe("client-level closures", () => {
	const reply = (code: string, data: unknown) =>
		new Response(JSON.stringify({ code, description: "x", data }), {
			status: 200,
		});
	const token = {
		businessId: "biz",
		access_token: "at1",
		refresh_token: "rt1",
		expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
	};
	const client = (extra: Partial<NombaOptions>) => {
		const myFetch = vi
			.fn()
			.mockResolvedValueOnce(reply("00", token))
			.mockResolvedValue(reply("00", { status: "SUCCESS" }));
		const nomba = new Nomba({
			clientId: "cid",
			clientSecret: "secret",
			accountId: "acc-1",
			fetch: myFetch,
			...extra,
		});
		return { nomba, myFetch };
	};

	test("an injected fetch is used instead of the global one", async () => {
		const globalFetch = vi.fn();
		vi.stubGlobal("fetch", globalFetch);
		const { nomba, myFetch } = client({});
		await nomba.accounts.getParentBalance();
		expect(myFetch).toHaveBeenCalledTimes(2);
		expect(globalFetch).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});

	test("onRequest and onResponse see every attempt", async () => {
		const onRequest = vi.fn();
		const onResponse = vi.fn();
		const { nomba } = client({ onRequest, onResponse });
		await nomba.accounts.getParentBalance();
		expect(onRequest).toHaveBeenLastCalledWith({
			method: "GET",
			path: "/v1/accounts/balance",
			attempt: 1,
		});
		expect(onResponse).toHaveBeenLastCalledWith(
			expect.objectContaining({
				method: "GET",
				path: "/v1/accounts/balance",
				httpStatus: 200,
				code: "00",
			}),
		);
	});

	test("a hook that throws never fails the request", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { nomba } = client({
			onRequest: () => {
				throw new Error("broken logger");
			},
			onOutcome: () => {
				throw new Error("broken alerting");
			},
		});
		await expect(
			nomba.transfers.walletTransfer({
				amount: 1,
				receiverAccountId: "r",
				merchantTxRef: "t",
				senderName: "Test",
			}),
		).resolves.toEqual({ status: "SUCCESS" });
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	test("onOutcome fires once per money-moving call", async () => {
		const onOutcome = vi.fn();
		const { nomba } = client({ onOutcome });
		await nomba.transfers.walletTransfer({
			amount: 1,
			receiverAccountId: "r",
			merchantTxRef: "t",
			senderName: "Test",
		});
		expect(onOutcome).toHaveBeenCalledExactlyOnceWith({
			method: "POST",
			path: "/v2/transfers/wallet",
			outcome: "success",
			code: "00",
			status: "SUCCESS",
			idempotencyKey: "t",
		});
	});
});

test("electricity, cable, betting, airtime and data services are available", () => {
	const nomba = new Nomba(opts);
	expect(nomba.electricity).toBeDefined();
	expect(nomba.cable).toBeDefined();
	expect(nomba.betting).toBeDefined();
	expect(nomba.airtime).toBeDefined();
	expect(nomba.data).toBeDefined();
});

test("hooks never see the query string, which can carry secrets such as a card OTP", async () => {
	const seen: string[] = [];
	const nomba = new Nomba({
		...opts,
		fetch: vi
			.fn()
			.mockResolvedValueOnce(ok(token(1)))
			.mockResolvedValue(ok([])),
		onRequest: ({ path }) => seen.push(path),
		onResponse: ({ path }) => seen.push(path),
	});
	await nomba.request("GET", "/v1/cards", { query: { otp: "123456" } });
	expect(seen.filter((p) => p.startsWith("/v1/cards"))).toEqual([
		"/v1/cards",
		"/v1/cards",
	]);
	expect(seen.join()).not.toContain("123456");
});

test("a payment whose token cannot be fetched is never reported as pending", async () => {
	const onOutcome = vi.fn();
	const onPending = vi.fn();
	const nomba = new Nomba({
		...opts,
		maxAttempts: 1,
		onOutcome,
		fetch: vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ code: "500", description: "down" }), {
				status: 500,
			}),
		),
	});
	await expect(
		nomba.transfers.walletTransfer(
			{
				amount: 1,
				receiverAccountId: "r",
				merchantTxRef: "t",
				senderName: "Test",
			},
			{ onPending },
		),
	).rejects.toMatchObject({ name: "TokenError" });
	expect(onPending).not.toHaveBeenCalled();
	expect(onOutcome).not.toHaveBeenCalled();
});
