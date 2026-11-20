import { describe, expect, test } from "vitest";
import { CableV2Service } from "../../../../src/services/v2/cable/cable.service.js";
import { fakeHttp } from "../../../support/fake-http.js";
import { outcomeCases } from "../../../support/outcomes.js";

const paid = {
	id: "API-CABLE-1",
	status: "SUCCESS",
	type: "cable",
	amount: 1000,
	timeCreated: "2026-09-29T18:18:48.527Z",
};
const params = { merchantTxRef: "ref-1" } as never;
const answers = {
	success: { code: "200", data: paid },
	pending: { code: "201", data: { ...paid, status: "PENDING_BILLING" } },
	unknownStatus: { code: "200", data: { ...paid, status: "PROCESSING" } },
};

describe("cable v2 outcomes", () => {
	outcomeCases(
		"subscribeCableTv",
		(http, h) => new CableV2Service(http).subscribeCableTv(params, h),
		answers,
	);
	outcomeCases(
		"subscribeCableTvFromSubAccount",
		(http, h) =>
			new CableV2Service(http).subscribeCableTvFromSubAccount("sub", params, h),
		answers,
	);
});

describe("cable v2 requests", () => {
	test("subscribeCableTv posts to /v2/bill/cabletv and its sub-account path, keyed by merchantTxRef", async () => {
		const { http, request } = fakeHttp(() => ({ code: "200", data: paid }));
		const svc = new CableV2Service(http);
		await expect(svc.subscribeCableTv(params)).resolves.toBe(paid);
		await svc.subscribeCableTvFromSubAccount("sub-1", params);
		expect(
			request.mock.calls.map((c) => [
				c[1],
				(c[2] as { idempotencyKey: string }).idempotencyKey,
			]),
		).toEqual([
			["/v2/bill/cabletv", "ref-1"],
			["/v2/bill/cabletv/sub-1", "ref-1"],
		]);
	});

	test("accepts both 00 and 200 success codes (guides vs reference discrepancy)", async () => {
		const { http: http00 } = fakeHttp(() => ({ code: "00", data: paid }));
		await expect(
			new CableV2Service(http00).subscribeCableTv(params),
		).resolves.toEqual(paid);

		const { http: http200 } = fakeHttp(() => ({ code: "200", data: paid }));
		await expect(
			new CableV2Service(http200).subscribeCableTv(params),
		).resolves.toEqual(paid);
	});
});
