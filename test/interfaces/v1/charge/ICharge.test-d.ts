import { describe, expectTypeOf, test } from "vitest";
import type {
	ChargeOrder,
	ChargeOrderDetails,
	ChargeTransactionDetails,
	FlashAccount,
	SubmitCardDetailsResult,
	SubmitCardOtpResult,
} from "../../../../src/types/v1/charge/charge.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("ICharge", () => {
	test("ChargeOrderDetails required fields", () => {
		expectTypeOf<RequiredKeys<ChargeOrderDetails>>().toEqualTypeOf<never>();
	});

	test("ChargeOrder required fields", () => {
		expectTypeOf<RequiredKeys<ChargeOrder>>().toEqualTypeOf<never>();
	});

	test("SubmitCardDetailsResult required fields", () => {
		expectTypeOf<
			RequiredKeys<SubmitCardDetailsResult>
		>().toEqualTypeOf<never>();
	});

	test("SubmitCardOtpResult required fields", () => {
		expectTypeOf<RequiredKeys<SubmitCardOtpResult>>().toEqualTypeOf<
			"status" | "message"
		>();
	});

	test("ChargeTransactionDetails required fields", () => {
		expectTypeOf<RequiredKeys<ChargeTransactionDetails>>().toEqualTypeOf<
			"status" | "message"
		>();
	});

	test("FlashAccount required fields", () => {
		expectTypeOf<RequiredKeys<FlashAccount>>().toEqualTypeOf<
			"accountNumber" | "accountName" | "bankName"
		>();
	});
});
