import { expectTypeOf, test } from "vitest";
import type {
	DataPurchaseV2Result,
	IDataV2Service,
} from "../../../../src/index.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { DataV2Service } from "../../../../src/services/v2/data/data.service.js";
import type { RequiredKeys } from "../../../type-helpers.js";

declare const svc: IDataV2Service;

test("DataV2Service implements IDataV2Service with nothing extra", () => {
	expectTypeOf<DataV2Service>().toMatchTypeOf<IDataV2Service>();
	expectTypeOf<keyof IDataV2Service>().toEqualTypeOf<keyof DataV2Service>();
});

test("nomba.data is v2", () => {
	expectTypeOf<Nomba["data"]>().toEqualTypeOf<IDataV2Service>();
});

test("return types", () => {
	expectTypeOf<
		ReturnType<typeof svc.buyData<DataPurchaseV2Result>>
	>().resolves.toEqualTypeOf<DataPurchaseV2Result>();
	expectTypeOf<
		ReturnType<typeof svc.buyDataFromSubAccount<DataPurchaseV2Result>>
	>().resolves.toEqualTypeOf<DataPurchaseV2Result>();
});

test("DataPurchaseV2Result required fields match DataVendingV2Response", () => {
	expectTypeOf<RequiredKeys<DataPurchaseV2Result>>().toEqualTypeOf<
		"id" | "status" | "type" | "amount" | "timeCreated"
	>();
});
