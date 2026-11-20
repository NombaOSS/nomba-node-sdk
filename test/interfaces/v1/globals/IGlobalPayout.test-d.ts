import { describe, expectTypeOf, test } from "vitest";
import type {
	Conversion,
	ExchangeRate,
	InstitutionProvider,
	PaymentMethodInfo,
	PayoutAccount,
	PayoutResult,
	PayoutTransaction,
} from "../../../../src/types/v1/globals/payout.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("IGlobalPayout", () => {
	test("PayoutAccount required fields", () => {
		expectTypeOf<RequiredKeys<PayoutAccount>>().toEqualTypeOf<
			| "accountId"
			| "name"
			| "currency"
			| "balance"
			| "availableBalance"
			| "status"
		>();
	});

	test("ExchangeRate required fields", () => {
		expectTypeOf<RequiredKeys<ExchangeRate>>().toEqualTypeOf<
			| "exchangeRateId"
			| "currencyPairName"
			| "bidRate"
			| "askRate"
			| "midRate"
			| "createdAt"
		>();
	});

	test("Conversion required fields", () => {
		expectTypeOf<RequiredKeys<Conversion>>().toEqualTypeOf<
			| "fromAmount"
			| "fromCurrency"
			| "toAmount"
			| "toCurrency"
			| "exchangeRateId"
		>();
	});

	test("PayoutResult required fields", () => {
		expectTypeOf<RequiredKeys<PayoutResult>>().toEqualTypeOf<
			"wtTransactionId" | "status"
		>();
	});

	test("PayoutTransaction required fields", () => {
		expectTypeOf<RequiredKeys<PayoutTransaction>>().toEqualTypeOf<
			"transactionId" | "status"
		>();
	});

	test("InstitutionProvider required fields", () => {
		expectTypeOf<RequiredKeys<InstitutionProvider>>().toEqualTypeOf<
			"code" | "displayName"
		>();
	});

	test("PaymentMethodInfo required fields", () => {
		expectTypeOf<RequiredKeys<PaymentMethodInfo>>().toEqualTypeOf<
			"code" | "displayName"
		>();
	});
});
