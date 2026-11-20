import { describe, expect, test } from "vitest";
import { AirtimeV2Service } from "../../../../src/services/v2/airtime/airtime.service.js";
import { DataV2Service } from "../../../../src/services/v2/data/data.service.js";
import { fakeHttp } from "../../../support/fake-http.js";
import { outcomeCases } from "../../../support/outcomes.js";

// Trimmed from real sandbox responses (2026-09-29).
const topupData = {
	id: "API-TOPUP-8FAC8-d70b1066-04e0-4591-93f2-982ab29ec0a7",
	status: "SUCCESS",
	type: "topup",
	amount: 50,
	source: "api",
	sourceUserId: null,
	customerBillerId: "08012345678",
	productId: null,
	meta: { merchantTxRef: "probe-topup-1790704503883", rrn: "260929185506" },
	userId: null,
	timeCreated: "2026-09-29T17:55:06.562Z",
};
const bundleData = {
	...topupData,
	id: "API-DATA-8FAC8-5eb48572",
	type: "data",
	amount: 100,
	productId: "mtn1",
};

const airtime = {
	amount: 50,
	phoneNumber: "08012345678",
	network: "MTN" as const,
	merchantTxRef: "ref-1",
};
const bundle = {
	productId: "mtn1",
	phoneNumber: "08012345678",
	network: "MTN" as const,
	merchantTxRef: "ref-1",
};

const answers = (data: object) => ({
	success: { code: "200", data },
	pending: { code: "201", data: { ...data, status: "PENDING_BILLING" } },
	unknownStatus: { code: "200", data: { ...data, status: "PROCESSING" } },
});

describe("v2 outcomes", () => {
	outcomeCases(
		"buyAirtime",
		(http, h) => new AirtimeV2Service(http).buyAirtime(airtime, h),
		answers(topupData),
	);
	outcomeCases(
		"buyAirtimeFromSubAccount",
		(http, h) =>
			new AirtimeV2Service(http).buyAirtimeFromSubAccount("sub", airtime, h),
		answers(topupData),
	);
	outcomeCases(
		"buyData",
		(http, h) => new DataV2Service(http).buyData(bundle, h),
		answers(bundleData),
	);
	outcomeCases(
		"buyDataFromSubAccount",
		(http, h) =>
			new DataV2Service(http).buyDataFromSubAccount("sub", bundle, h),
		answers(bundleData),
	);
});

describe("v2 requests", () => {
	const fake = fakeHttp(() => ({ code: "200", data: topupData }));

	test("the real sandbox success resolves the data", async () => {
		const { http } = fakeHttp(() => ({ code: "200", data: topupData }));
		await expect(new AirtimeV2Service(http).buyAirtime(airtime)).resolves.toBe(
			topupData,
		);
	});

	test.each([
		[
			"buyAirtime",
			() => new AirtimeV2Service(fake.http).buyAirtime(airtime),
			"/v2/bill/topup",
		],
		[
			"buyAirtimeFromSubAccount",
			() =>
				new AirtimeV2Service(fake.http).buyAirtimeFromSubAccount(
					"sub-1",
					airtime,
				),
			"/v2/bill/topup/sub-1",
		],
		[
			"buyData",
			() => new DataV2Service(fake.http).buyData(bundle),
			"/v2/bill/data",
		],
		[
			"buyDataFromSubAccount",
			() => new DataV2Service(fake.http).buyDataFromSubAccount("sub-1", bundle),
			"/v2/bill/data/sub-1",
		],
	])(
		"%s posts to its v2 path keyed by merchantTxRef",
		async (_, call, path) => {
			await call();
			expect(fake.request).toHaveBeenLastCalledWith(
				"POST",
				path,
				expect.objectContaining({ idempotencyKey: "ref-1" }),
			);
		},
	);

	test("accepts both 00 and 200 success codes (guides vs reference discrepancy)", async () => {
		const f00 = fakeHttp(() => ({ code: "00", data: topupData }));
		await expect(
			new AirtimeV2Service(f00.http).buyAirtime(airtime),
		).resolves.toEqual(topupData);

		const f200 = fakeHttp(() => ({ code: "200", data: topupData }));
		await expect(
			new AirtimeV2Service(f200.http).buyAirtime(airtime),
		).resolves.toEqual(topupData);
	});
});
