import { describe, expectTypeOf, test } from "vitest";
import type {
	CancelChargeTransactionParams,
	CardDetails,
	DeviceInformation,
	SaveCardOtpRequest,
	SubmitCardDetailsParams,
	SubmitCardOtpParams,
} from "../../../../src/types/v1/charge/charge.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("charge.types", () => {
	test("CardDetails required fields", () => {
		expectTypeOf<RequiredKeys<CardDetails>>().toEqualTypeOf<
			| "cardCVV"
			| "cardExpiryMonth"
			| "cardExpiryYear"
			| "cardNumber"
			| "cardPin"
		>();
	});

	test("DeviceInformation required fields", () => {
		expectTypeOf<RequiredKeys<DeviceInformation>>().toEqualTypeOf<never>();
	});

	test("SubmitCardDetailsParams required fields", () => {
		expectTypeOf<
			RequiredKeys<SubmitCardDetailsParams>
		>().toEqualTypeOf<never>();
	});

	test("SubmitCardOtpParams required fields", () => {
		expectTypeOf<RequiredKeys<SubmitCardOtpParams>>().toEqualTypeOf<
			"otp" | "orderReference" | "transactionId"
		>();
	});

	test("CancelChargeTransactionParams required fields", () => {
		expectTypeOf<RequiredKeys<CancelChargeTransactionParams>>().toEqualTypeOf<
			"transactionId" | "forceCancel"
		>();
	});

	test("SaveCardOtpRequest required fields", () => {
		expectTypeOf<RequiredKeys<SaveCardOtpRequest>>().toEqualTypeOf<
			"orderReference" | "phoneNumber"
		>();
	});
});
