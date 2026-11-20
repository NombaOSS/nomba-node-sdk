import { describe, expectTypeOf, test } from "vitest";
import type {
	ChargeTokenizedCardParams,
	CheckoutOrder,
	CreateCheckoutOrderParams,
	FetchCheckoutTransactionParams,
	ListTokenizedCardsParams,
	RefundCheckoutTransactionParams,
	UpdateTokenizedCardParams,
} from "../../../../src/types/v1/checkout/checkout.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("checkout.types", () => {
	test("CheckoutOrder required fields", () => {
		expectTypeOf<RequiredKeys<CheckoutOrder>>().toEqualTypeOf<
			"callbackUrl" | "customerEmail" | "amount" | "currency"
		>();
	});

	test("CreateCheckoutOrderParams required fields", () => {
		expectTypeOf<
			RequiredKeys<CreateCheckoutOrderParams>
		>().toEqualTypeOf<"order">();
	});

	test("FetchCheckoutTransactionParams required fields", () => {
		expectTypeOf<
			RequiredKeys<FetchCheckoutTransactionParams>
		>().toEqualTypeOf<never>();
	});

	test("RefundCheckoutTransactionParams required fields", () => {
		expectTypeOf<
			RequiredKeys<RefundCheckoutTransactionParams>
		>().toEqualTypeOf<"transactionId">();
	});

	test("ChargeTokenizedCardParams required fields", () => {
		expectTypeOf<
			RequiredKeys<ChargeTokenizedCardParams>
		>().toEqualTypeOf<"tokenKey">();
	});

	test("ListTokenizedCardsParams required fields", () => {
		expectTypeOf<
			RequiredKeys<ListTokenizedCardsParams>
		>().toEqualTypeOf<never>();
	});

	test("UpdateTokenizedCardParams required fields", () => {
		expectTypeOf<RequiredKeys<UpdateTokenizedCardParams>>().toEqualTypeOf<
			"tokenKey" | "currentEmailAddress" | "newEmailAddress"
		>();
	});
});
