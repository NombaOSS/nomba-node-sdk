import { describe, expectTypeOf, test } from "vitest";
import type {
	ChargeOrder,
	ChargeTransactionDetails,
	CheckoutResult,
	FlashAccount,
	SubmitCardDetailsResult,
	SubmitCardOtpResult,
	TokenizedCardData,
} from "../../../../src/index.js";
import type { IChargeService } from "../../../../src/interfaces/v1/charge/IChargeService.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { ChargeService } from "../../../../src/services/v1/charge/charge.service.js";

test("ChargeService implements IChargeService", () => {
	expectTypeOf<ChargeService>().toMatchTypeOf<IChargeService>();
});

test("IChargeService exposes exactly ChargeService's public methods", () => {
	expectTypeOf<keyof IChargeService>().toEqualTypeOf<keyof ChargeService>();
});

test("nomba.charge is typed as IChargeService", () => {
	expectTypeOf<Nomba["charge"]>().toEqualTypeOf<IChargeService>();
});

describe("IChargeService return types match the documented response shapes", () => {
	test("getOrder", () => {
		expectTypeOf<
			IChargeService["getOrder"]
		>().returns.resolves.toEqualTypeOf<ChargeOrder>();
	});

	test("submitCardDetails", () => {
		expectTypeOf<
			IChargeService["submitCardDetails"]
		>().returns.resolves.toEqualTypeOf<SubmitCardDetailsResult>();
	});

	test("submitCardOtp", () => {
		expectTypeOf<
			IChargeService["submitCardOtp"]
		>().returns.resolves.toEqualTypeOf<SubmitCardOtpResult>();
	});

	test("resendOtp", () => {
		expectTypeOf<
			IChargeService["resendOtp"]
		>().returns.resolves.toEqualTypeOf<CheckoutResult>();
	});

	test("fetchTransactionDetails", () => {
		expectTypeOf<
			IChargeService["fetchTransactionDetails"]
		>().returns.resolves.toEqualTypeOf<ChargeTransactionDetails>();
	});

	test("fetchFlashAccount", () => {
		expectTypeOf<
			IChargeService["fetchFlashAccount"]
		>().returns.resolves.toEqualTypeOf<FlashAccount>();
	});

	test("cancelTransaction", () => {
		expectTypeOf<
			IChargeService["cancelTransaction"]
		>().returns.resolves.toEqualTypeOf<CheckoutResult>();
	});

	test("requestSavedCardsOtp", () => {
		expectTypeOf<
			IChargeService["requestSavedCardsOtp"]
		>().returns.resolves.toEqualTypeOf<CheckoutResult>();
	});

	test("getSavedCards", () => {
		expectTypeOf<
			IChargeService["getSavedCards"]
		>().returns.resolves.toEqualTypeOf<{
			tokenizedCardData?: TokenizedCardData[];
		}>();
	});

	test("requestSaveCardOtp", () => {
		expectTypeOf<
			IChargeService["requestSaveCardOtp"]
		>().returns.resolves.toEqualTypeOf<CheckoutResult>();
	});

	test("submitSaveCardOtp", () => {
		expectTypeOf<
			IChargeService["submitSaveCardOtp"]
		>().returns.resolves.toEqualTypeOf<CheckoutResult>();
	});
});
