import { expectTypeOf, test } from "vitest";
import type {
	ElectricityPaymentV2Result,
	IElectricityV2Service,
} from "../../../../src/index.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { ElectricityV2Service } from "../../../../src/services/v2/electricity/electricity.service.js";
import type { RequiredKeys } from "../../../type-helpers.js";

declare const svc: IElectricityV2Service;

test("ElectricityV2Service implements IElectricityV2Service with nothing extra", () => {
	expectTypeOf<ElectricityV2Service>().toMatchTypeOf<IElectricityV2Service>();
	expectTypeOf<keyof IElectricityV2Service>().toEqualTypeOf<
		keyof ElectricityV2Service
	>();
});

test("v2 has lookup and purchases", () => {
	expectTypeOf<keyof IElectricityV2Service>().toEqualTypeOf<
		"lookupMeter" | "payElectricity" | "payElectricityFromSubAccount"
	>();
});

test("nomba.electricity is v2", () => {
	expectTypeOf<Nomba["electricity"]>().toEqualTypeOf<IElectricityV2Service>();
});

test("return types", () => {
	expectTypeOf<
		ReturnType<typeof svc.payElectricity<ElectricityPaymentV2Result>>
	>().resolves.toEqualTypeOf<ElectricityPaymentV2Result>();
	expectTypeOf<
		ReturnType<
			typeof svc.payElectricityFromSubAccount<ElectricityPaymentV2Result>
		>
	>().resolves.toEqualTypeOf<ElectricityPaymentV2Result>();
});

test("ElectricityPaymentV2Result required fields", () => {
	expectTypeOf<RequiredKeys<ElectricityPaymentV2Result>>().toEqualTypeOf<
		"id" | "status" | "type" | "amount" | "timeCreated"
	>();
});

test("the bundled bills product is gone", () => {
	expectTypeOf<Nomba>().not.toHaveProperty("bills");
});
