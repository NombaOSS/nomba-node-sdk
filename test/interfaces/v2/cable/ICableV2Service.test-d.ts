import { expectTypeOf, test } from "vitest";
import type {
	CablePaymentV2Result,
	ICableV2Service,
} from "../../../../src/index.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { CableV2Service } from "../../../../src/services/v2/cable/cable.service.js";
import type { RequiredKeys } from "../../../type-helpers.js";

declare const svc: ICableV2Service;

test("CableV2Service implements ICableV2Service with nothing extra", () => {
	expectTypeOf<CableV2Service>().toMatchTypeOf<ICableV2Service>();
	expectTypeOf<keyof ICableV2Service>().toEqualTypeOf<keyof CableV2Service>();
});

test("v2 has purchases only", () => {
	expectTypeOf<keyof ICableV2Service>().toEqualTypeOf<
		"subscribeCableTv" | "subscribeCableTvFromSubAccount"
	>();
});

test("nomba.cable is v2", () => {
	expectTypeOf<Nomba["cable"]>().toEqualTypeOf<ICableV2Service>();
});

test("return types", () => {
	expectTypeOf<
		ReturnType<typeof svc.subscribeCableTv<CablePaymentV2Result>>
	>().resolves.toEqualTypeOf<CablePaymentV2Result>();
	expectTypeOf<
		ReturnType<typeof svc.subscribeCableTvFromSubAccount<CablePaymentV2Result>>
	>().resolves.toEqualTypeOf<CablePaymentV2Result>();
});

test("CablePaymentV2Result required fields", () => {
	expectTypeOf<RequiredKeys<CablePaymentV2Result>>().toEqualTypeOf<
		"id" | "status" | "type" | "amount" | "timeCreated"
	>();
});
