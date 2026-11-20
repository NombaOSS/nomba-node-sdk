import { expectTypeOf, test } from "vitest";
import type {
	AirtimePurchaseV2Result,
	IAirtimeV2Service,
} from "../../../../src/index.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { AirtimeV2Service } from "../../../../src/services/v2/airtime/airtime.service.js";
import type { RequiredKeys } from "../../../type-helpers.js";

declare const svc: IAirtimeV2Service;

test("AirtimeV2Service implements IAirtimeV2Service with nothing extra", () => {
	expectTypeOf<AirtimeV2Service>().toMatchTypeOf<IAirtimeV2Service>();
	expectTypeOf<keyof IAirtimeV2Service>().toEqualTypeOf<
		keyof AirtimeV2Service
	>();
});

test("nomba.airtime is v2", () => {
	expectTypeOf<Nomba["airtime"]>().toEqualTypeOf<IAirtimeV2Service>();
});

test("return types", () => {
	expectTypeOf<
		ReturnType<typeof svc.buyAirtime<AirtimePurchaseV2Result>>
	>().resolves.toEqualTypeOf<AirtimePurchaseV2Result>();
	expectTypeOf<
		ReturnType<typeof svc.buyAirtimeFromSubAccount<AirtimePurchaseV2Result>>
	>().resolves.toEqualTypeOf<AirtimePurchaseV2Result>();
});

test("AirtimePurchaseV2Result required fields match AirtimePurchaseV2Response", () => {
	expectTypeOf<RequiredKeys<AirtimePurchaseV2Result>>().toEqualTypeOf<
		"id" | "status" | "type" | "amount" | "timeCreated"
	>();
});
