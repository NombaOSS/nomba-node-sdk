import { describe, expectTypeOf, test } from "vitest";
import type {
	ConvertMoneyParams,
	ExchangeRatesParams,
	InstitutionProvidersParams,
	PaymentMethodsParams,
} from "../../../../src/types/v1/globals/payout.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("global-payout.types", () => {
	test("ExchangeRatesParams required fields", () => {
		expectTypeOf<RequiredKeys<ExchangeRatesParams>>().toEqualTypeOf<
			"from" | "to"
		>();
	});

	test("ConvertMoneyParams required fields", () => {
		expectTypeOf<RequiredKeys<ConvertMoneyParams>>().toEqualTypeOf<
			"amount" | "currency" | "destinationCurrency" | "transactionType"
		>();
	});

	test("InstitutionProvidersParams required fields", () => {
		expectTypeOf<
			RequiredKeys<InstitutionProvidersParams>
		>().toEqualTypeOf<never>();
	});

	test("PaymentMethodsParams required fields", () => {
		expectTypeOf<RequiredKeys<PaymentMethodsParams>>().toEqualTypeOf<never>();
	});
});
