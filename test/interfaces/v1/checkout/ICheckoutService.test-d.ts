import { describe, expectTypeOf, test } from "vitest";
import type {
	ChargeTokenizedCardResult,
	CheckoutOrderCreated,
	CheckoutResult,
	CheckoutTransaction,
	TokenizedCardData,
	TokenizedCardList,
	TokenizedCardResult,
	UpdatedTokenizedCard,
} from "../../../../src/index.js";
import type { ICheckoutService } from "../../../../src/interfaces/v1/checkout/ICheckoutService.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { CheckoutService } from "../../../../src/services/v1/checkout/checkout.service.js";

declare const svc: ICheckoutService;

test("CheckoutService implements ICheckoutService", () => {
	expectTypeOf<CheckoutService>().toMatchTypeOf<ICheckoutService>();
});

test("ICheckoutService exposes exactly CheckoutService's public methods", () => {
	expectTypeOf<keyof ICheckoutService>().toEqualTypeOf<keyof CheckoutService>();
});

test("nomba.checkout is typed as ICheckoutService", () => {
	expectTypeOf<Nomba["checkout"]>().toEqualTypeOf<ICheckoutService>();
});

describe("ICheckoutService return types match the documented response shapes", () => {
	test("createOrder", () => {
		expectTypeOf<
			ICheckoutService["createOrder"]
		>().returns.resolves.toEqualTypeOf<CheckoutOrderCreated>();
	});

	test("fetchTransaction", () => {
		expectTypeOf<
			ICheckoutService["fetchTransaction"]
		>().returns.resolves.toEqualTypeOf<CheckoutTransaction>();
	});

	test("cancelOrder", () => {
		expectTypeOf<
			ICheckoutService["cancelOrder"]
		>().returns.resolves.toEqualTypeOf<CheckoutResult>();
	});

	test("refund", () => {
		expectTypeOf<
			ReturnType<typeof svc.refund<CheckoutResult>>
		>().resolves.toEqualTypeOf<CheckoutResult>();
	});

	test("chargeTokenizedCard", () => {
		expectTypeOf<
			ICheckoutService["chargeTokenizedCard"]
		>().returns.resolves.toEqualTypeOf<ChargeTokenizedCardResult>();
	});

	test("listTokenizedCards", () => {
		expectTypeOf<
			ICheckoutService["listTokenizedCards"]
		>().returns.resolves.toEqualTypeOf<TokenizedCardList>();
	});

	test("iterateTokenizedCards", () => {
		expectTypeOf<
			ICheckoutService["iterateTokenizedCards"]
		>().returns.toEqualTypeOf<AsyncGenerator<TokenizedCardData>>();
	});

	test("updateTokenizedCard", () => {
		expectTypeOf<
			ICheckoutService["updateTokenizedCard"]
		>().returns.resolves.toEqualTypeOf<UpdatedTokenizedCard>();
	});

	test("deleteTokenizedCard", () => {
		expectTypeOf<
			ICheckoutService["deleteTokenizedCard"]
		>().returns.resolves.toEqualTypeOf<TokenizedCardResult>();
	});
});

test("refund resolves to what the outcome closures return", () => {
	type Call = ReturnType<typeof svc.refund<"ok" | "wait" | "no">>;
	expectTypeOf<Call>().resolves.toEqualTypeOf<
		CheckoutResult | "ok" | "wait" | "no"
	>();
});
