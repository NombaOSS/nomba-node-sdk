import { expectTypeOf, test } from "vitest";
import type {
	BettingPaymentV2Result,
	IBettingV2Service,
} from "../../../../src/index.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { BettingV2Service } from "../../../../src/services/v2/betting/betting.service.js";
import type { RequiredKeys } from "../../../type-helpers.js";

declare const svc: IBettingV2Service;

test("BettingV2Service implements IBettingV2Service with nothing extra", () => {
	expectTypeOf<BettingV2Service>().toMatchTypeOf<IBettingV2Service>();
	expectTypeOf<keyof IBettingV2Service>().toEqualTypeOf<
		keyof BettingV2Service
	>();
});

test("v2 has purchases only", () => {
	expectTypeOf<keyof IBettingV2Service>().toEqualTypeOf<
		"payBetting" | "payBettingFromSubAccount"
	>();
});

test("nomba.betting is v2", () => {
	expectTypeOf<Nomba["betting"]>().toEqualTypeOf<IBettingV2Service>();
});

test("return types", () => {
	expectTypeOf<
		ReturnType<typeof svc.payBetting<BettingPaymentV2Result>>
	>().resolves.toEqualTypeOf<BettingPaymentV2Result>();
	expectTypeOf<
		ReturnType<typeof svc.payBettingFromSubAccount<BettingPaymentV2Result>>
	>().resolves.toEqualTypeOf<BettingPaymentV2Result>();
});

test("BettingPaymentV2Result required fields", () => {
	expectTypeOf<RequiredKeys<BettingPaymentV2Result>>().toEqualTypeOf<
		"id" | "status" | "type" | "amount" | "timeCreated"
	>();
});
