import { describe, expect, test } from "vitest";
import { BettingV2Service } from "../../../../src/services/v2/betting/betting.service.js";
import { fakeHttp } from "../../../support/fake-http.js";
import { outcomeCases } from "../../../support/outcomes.js";

const paid = {
	id: "API-BETTING-1",
	status: "SUCCESS",
	type: "betting",
	amount: 1000,
	timeCreated: "2026-09-29T18:18:48.527Z",
};
const params = { merchantTxRef: "ref-1" } as never;
const answers = {
	success: { code: "200", data: paid },
	pending: { code: "201", data: { ...paid, status: "PENDING_BILLING" } },
	unknownStatus: { code: "200", data: { ...paid, status: "PROCESSING" } },
};

describe("betting v2 outcomes", () => {
	outcomeCases(
		"payBetting",
		(http, h) => new BettingV2Service(http).payBetting(params, h),
		answers,
	);
	outcomeCases(
		"payBettingFromSubAccount",
		(http, h) =>
			new BettingV2Service(http).payBettingFromSubAccount("sub", params, h),
		answers,
	);
});

describe("betting v2 requests", () => {
	test("payBetting posts to /v2/bill/betting and its sub-account path, keyed by merchantTxRef", async () => {
		const { http, request } = fakeHttp(() => ({ code: "200", data: paid }));
		const svc = new BettingV2Service(http);
		await expect(svc.payBetting(params)).resolves.toBe(paid);
		await svc.payBettingFromSubAccount("sub-1", params);
		expect(
			request.mock.calls.map((c) => [
				c[1],
				(c[2] as { idempotencyKey: string }).idempotencyKey,
			]),
		).toEqual([
			["/v2/bill/betting", "ref-1"],
			["/v2/bill/betting/sub-1", "ref-1"],
		]);
	});

	test("accepts both 00 and 200 success codes (guides vs reference discrepancy)", async () => {
		const { http: http00 } = fakeHttp(() => ({ code: "00", data: paid }));
		await expect(
			new BettingV2Service(http00).payBetting(params),
		).resolves.toEqual(paid);

		const { http: http200 } = fakeHttp(() => ({ code: "200", data: paid }));
		await expect(
			new BettingV2Service(http200).payBetting(params),
		).resolves.toEqual(paid);
	});
});
