import { describe, expectTypeOf, test } from "vitest";
import type {
	CheckoutOrderCreated,
	CheckoutResult,
	CheckoutTransaction,
	TokenizedCardData,
	TokenizedCardList,
	TokenizedCardResult,
} from "../../../../src/types/v1/checkout/checkout.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("ICheckout", () => {
	test("CheckoutOrderCreated required fields", () => {
		expectTypeOf<RequiredKeys<CheckoutOrderCreated>>().toEqualTypeOf<
			"checkoutLink" | "orderReference"
		>();
	});

	test("CheckoutTransaction required fields", () => {
		expectTypeOf<RequiredKeys<CheckoutTransaction>>().toEqualTypeOf<never>();
	});

	test("CheckoutResult required fields", () => {
		expectTypeOf<RequiredKeys<CheckoutResult>>().toEqualTypeOf<
			"success" | "message"
		>();
	});

	test("TokenizedCardResult required fields", () => {
		expectTypeOf<RequiredKeys<TokenizedCardResult>>().toEqualTypeOf<never>();
	});

	test("TokenizedCardData required fields", () => {
		expectTypeOf<RequiredKeys<TokenizedCardData>>().toEqualTypeOf<never>();
	});

	test("TokenizedCardList required fields", () => {
		expectTypeOf<RequiredKeys<TokenizedCardList>>().toEqualTypeOf<never>();
	});
});
