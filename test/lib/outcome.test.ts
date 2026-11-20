import { describe, expect, test, vi } from "vitest";
import {
	IdempotencyKeyAbsentError,
	NombaError,
	OutcomeUnknownError,
	UnconfirmedOutcomeError,
} from "../../src/lib/errors.js";
import { classify, REJECTED, settle } from "../../src/lib/outcome.js";
import type { OutcomeTable } from "../../src/types/common/outcome.types.js";
import { fakeHttp } from "../support/fake-http.js";

const table: OutcomeTable = {
	codes: { "00": "success", "201": "pending", ...REJECTED },
	statuses: {
		SUCCESS: "success",
		PENDING_BILLING: "pending",
	},
};
const call = (
	answer: () => unknown,
	idempotencyKey: string | undefined | null = "test-key",
	options = {},
) => {
	const f = fakeHttp(answer);
	return {
		...f,
		result: settle(
			f.http,
			"POST",
			"/v1/x",
			{ body: 1 },
			table,
			{ field: "testKey", value: idempotencyKey as string },
			options,
		),
	};
};
const handlers = () => ({
	onSuccess: vi.fn((_data: unknown) => "success"),
	onPending: vi.fn((_info: unknown) => "pending"),
	onFailed: vi.fn((_info: unknown) => "failed"),
});

describe("classify", () => {
	test.each([
		["00", "SUCCESS", "success"],
		["00", "PENDING_BILLING", "pending"],
		["00", "REFUND", "pending"],
		["201", "SUCCESS", "pending"],
		["400", undefined, "failed"],
		["00", "SOMETHING_NEW", "pending"],
		["00", undefined, "pending"],
		["299", "SUCCESS", "pending"],
	])("code %s, status %s is %s", (code, status, want) => {
		expect(classify(table, code, status)).toBe(want);
	});

	test("a table without statuses classifies by code alone", () => {
		expect(classify({ codes: { "00": "success" } }, "00", undefined)).toBe(
			"success",
		);
	});
});

describe("settle", () => {
	test("asks the transport for documented non-failure codes only, with the envelope", async () => {
		const { request, result } = call(() => ({
			code: "00",
			data: { status: "SUCCESS" },
		}));
		await result;
		expect(request.mock.calls[0]?.[2]).toMatchObject({
			okCodes: { length: 2 },
		});
		expect(request).toHaveBeenCalledWith("POST", "/v1/x", {
			body: 1,
			idempotencyKey: "test-key",
			okCodes: expect.arrayContaining(["00", "201"]),
			envelope: true,
		});
	});

	test("each outcome goes to its closure, and the call resolves to what it returns", async () => {
		for (const [answer, want] of [
			[{ code: "00", data: { status: "SUCCESS" } }, "success"],
			[{ code: "201", data: {} }, "pending"],
			[new NombaError(400, "400", "bad"), "failed"],
			[new OutcomeUnknownError("POST", "/v1/x", "k", 1, null), "pending"],
		] as const) {
			const h = handlers();
			expect(await call(() => answer, "test-key", h).result).toBe(want);
			const called = [h.onSuccess, h.onPending, h.onFailed].filter(
				(f) => f.mock.calls.length,
			);
			expect(called).toHaveLength(1);
		}
	});

	test("an undocumented code never reaches onSuccess or onFailed", async () => {
		const h = handlers();
		const { result, events } = call(
			() => new NombaError(200, "299", "odd"),
			"test-key",
			h,
		);
		expect(await result).toBe("pending");
		expect(h.onPending.mock.calls[0]?.[0]).toMatchObject({ code: "299" });
		expect(events).toEqual([
			{
				method: "POST",
				path: "/v1/x",
				outcome: "pending",
				code: "299",
				idempotencyKey: "test-key",
			},
		]);
	});

	test("an undocumented status never reaches onSuccess or onFailed", async () => {
		const h = handlers();
		const data = { status: "SOMETHING_NEW" };
		expect(await call(() => ({ code: "00", data }), "test-key", h).result).toBe(
			"pending",
		);
		expect(h.onPending).toHaveBeenCalledWith({
			data,
			code: "00",
			status: "SOMETHING_NEW",
			idempotencyKey: "test-key",
		});
	});

	describe("without closures", () => {
		test("success resolves data", async () => {
			const data = { status: "SUCCESS" };
			await expect(call(() => ({ code: "00", data })).result).resolves.toBe(
				data,
			);
		});

		test("documented pending throws so it cannot be mistaken for success", async () => {
			const data = { status: "PENDING_BILLING" };
			await expect(
				call(() => ({ code: "00", data })).result,
			).rejects.toMatchObject({
				name: "UnconfirmedOutcomeError",
				reason: "status",
				status: "PENDING_BILLING",
			});
		});

		test("an undocumented code with a documented status still throws", async () => {
			await expect(
				call(() => ({ code: "299", data: { status: "SUCCESS" } })).result,
			).rejects.toMatchObject({ reason: "code", code: "299" });
		});

		test("an undocumented code or status throws UnconfirmedOutcomeError", async () => {
			await expect(
				call(() => new NombaError(200, "299", "odd")).result,
			).rejects.toMatchObject({ reason: "code", code: "299" });
			await expect(
				call(() => ({ code: "00", data: { status: "NEW" } })).result,
			).rejects.toBeInstanceOf(UnconfirmedOutcomeError);
			await expect(
				call(() => ({ code: "00", data: {} })).result,
			).rejects.toMatchObject({ reason: "status", status: undefined });
		});

		test("a rejection throws the NombaError and a lost response the OutcomeUnknownError", async () => {
			const rejected = new NombaError(400, "400", "bad");
			await expect(call(() => rejected).result).rejects.toBe(rejected);
			const lost = new OutcomeUnknownError("POST", "/v1/x", "k", 1, null);
			await expect(call(() => lost).result).rejects.toBe(lost);
		});

		test("a 409 key conflict is unconfirmed, never failed: the first attempt may have gone through", async () => {
			const conflict = new NombaError(409, "409", "idempotency key conflict");
			await expect(call(() => conflict).result).rejects.toMatchObject({
				name: "UnconfirmedOutcomeError",
				reason: "code",
				code: "409",
				cause: conflict,
			});
			const h = handlers();
			expect(await call(() => conflict, "test-key", h).result).toBe("pending");
			expect(h.onFailed).not.toHaveBeenCalled();
		});

		test("a 2xx carrying a documented failure code stays a NombaError", async () => {
			const e = new NombaError(200, "403", "forbidden");
			await expect(call(() => e).result).rejects.toBe(e);
		});
	});

	test("an error thrown inside a closure reaches the caller untouched", async () => {
		const boom = new Error("mine");
		await expect(
			call(() => ({ code: "00", data: { status: "SUCCESS" } }), "test-key", {
				onSuccess: () => {
					throw boom;
				},
			}).result,
		).rejects.toBe(boom);
	});

	test("a lost response reports the key the client generated", async () => {
		const { events, result } = call(
			() => new OutcomeUnknownError("POST", "/v1/x", "generated-key", 1, null),
			"test-key",
			{ onPending: () => "pending" },
		);
		await result;
		expect(events[0]).toMatchObject({
			outcome: "pending",
			idempotencyKey: "generated-key",
		});
	});

	test("statuses that are Object.prototype keys are not documented", async () => {
		expect(classify(table, "00", "constructor")).toBe("pending");
		expect(classify(table, "toString", "SUCCESS")).toBe("pending");
		await expect(
			call(() => ({ code: "00", data: { status: "constructor" } })).result,
		).rejects.toMatchObject({ name: "UnconfirmedOutcomeError" });
	});

	test("the idempotency key is sent and reported", async () => {
		const { request, events, result } = call(
			() => ({ code: "00", data: { status: "SUCCESS" } }),
			"key-1",
		);
		await result;
		expect(request.mock.calls[0]?.[2]).toMatchObject({
			idempotencyKey: "key-1",
		});
		expect(events[0]).toMatchObject({
			outcome: "success",
			idempotencyKey: "key-1",
		});
	});

	test.each(["", "   "])(
		"throws IdempotencyKeyAbsentError when key is %j",
		async (key) => {
			await expect(
				call(() => ({ code: "00", data: { status: "SUCCESS" } }), key).result,
			).rejects.toThrow(IdempotencyKeyAbsentError);
		},
	);

	test("IdempotencyKeyAbsentError includes field and path", async () => {
		await expect(
			call(() => ({ code: "00", data: { status: "SUCCESS" } }), "").result,
		).rejects.toMatchObject({
			name: "IdempotencyKeyAbsentError",
			field: "testKey",
			path: "/v1/x",
		});
	});
});
