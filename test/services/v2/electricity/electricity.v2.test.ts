import { describe, expect, test } from "vitest";
import { ElectricityV2Service } from "../../../../src/services/v2/electricity/electricity.service.js";
import { fakeHttp } from "../../../support/fake-http.js";
import { outcomeCases } from "../../../support/outcomes.js";

// Trimmed from a real sandbox response (2026-09-29).
const paid = {
	id: "API-PHCN-8FAC8-46865bca-8c19-496d-b176-17f139e4d35c",
	status: "SUCCESS",
	type: "phcn",
	amount: 1000,
	source: "api",
	sourceUserId: null,
	customerBillerId: "1234567890",
	productId: "enugu",
	meta: {
		phcnToken: "43557934939308375700",
		units: "16.4",
		merchantTxRef: "probe-phcn",
	},
	userId: null,
	timeCreated: "2026-09-29T18:18:48.527Z",
};
const params = { merchantTxRef: "ref-1" } as never;
const answers = {
	success: { code: "200", data: paid },
	pending: { code: "201", data: { ...paid, status: "PENDING_BILLING" } },
	unknownStatus: { code: "200", data: { ...paid, status: "PROCESSING" } },
};

describe("electricity v2 outcomes", () => {
	outcomeCases(
		"payElectricity",
		(http, h) => new ElectricityV2Service(http).payElectricity(params, h),
		answers,
	);
	outcomeCases(
		"payElectricityFromSubAccount",
		(http, h) =>
			new ElectricityV2Service(http).payElectricityFromSubAccount(
				"sub",
				params,
				h,
			),
		answers,
	);
});

describe("electricity v2 requests", () => {
	test("lookupMeter calls GET /v2/bill/electricity/lookup with query params", async () => {
		const lookup = { name: "John Doe", address: "unknown" };
		const { http, request } = fakeHttp(() => lookup);
		const svc = new ElectricityV2Service(http);
		await expect(
			svc.lookupMeter({ disco: "ekedc", customerId: "1234567890" }),
		).resolves.toEqual(lookup);
		expect(request.mock.calls[0]?.slice(0, 3)).toEqual([
			"GET",
			"/v2/bill/electricity/lookup",
			{ query: { disco: "ekedc", customerId: "1234567890" } },
		]);
	});

	test("payElectricity posts to /v2/bill/electricity and its sub-account path, keyed by merchantTxRef", async () => {
		const { http, request } = fakeHttp(() => ({ code: "200", data: paid }));
		const svc = new ElectricityV2Service(http);
		await expect(svc.payElectricity(params)).resolves.toBe(paid);
		await svc.payElectricityFromSubAccount("sub-1", params);
		expect(
			request.mock.calls.map((c) => [
				c[1],
				(c[2] as { idempotencyKey: string }).idempotencyKey,
			]),
		).toEqual([
			["/v2/bill/electricity", "ref-1"],
			["/v2/bill/electricity/sub-1", "ref-1"],
		]);
	});

	test("accepts both 00 and 200 success codes (guides vs reference discrepancy)", async () => {
		const { http: http00 } = fakeHttp(() => ({ code: "00", data: paid }));
		await expect(
			new ElectricityV2Service(http00).payElectricity(params),
		).resolves.toEqual(paid);

		const { http: http200 } = fakeHttp(() => ({ code: "200", data: paid }));
		await expect(
			new ElectricityV2Service(http200).payElectricity(params),
		).resolves.toEqual(paid);
	});
});
