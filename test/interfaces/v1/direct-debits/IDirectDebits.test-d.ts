import { describe, expectTypeOf, test } from "vitest";
import type {
	CreatedMandate,
	DirectDebitMandate,
	MandateDebitResult,
	MandatePage,
	MandateStatus,
	UpdatedMandateStatus,
} from "../../../../src/types/v1/direct-debits/direct-debits.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("IDirectDebits", () => {
	test("CreatedMandate required fields", () => {
		expectTypeOf<RequiredKeys<CreatedMandate>>().toEqualTypeOf<
			"mandateId" | "merchantReference" | "phoneNumber" | "description"
		>();
	});

	test("MandateStatus required fields", () => {
		expectTypeOf<RequiredKeys<MandateStatus>>().toEqualTypeOf<
			| "customerAccountName"
			| "mandateId"
			| "customerAccountNumber"
			| "mandateStatus"
		>();
	});

	test("MandateDebitResult required fields", () => {
		expectTypeOf<RequiredKeys<MandateDebitResult>>().toEqualTypeOf<never>();
	});

	test("MandatePage required fields", () => {
		expectTypeOf<RequiredKeys<MandatePage>>().toEqualTypeOf<never>();
	});

	test("DirectDebitMandate required fields", () => {
		expectTypeOf<RequiredKeys<DirectDebitMandate>>().toEqualTypeOf<never>();
	});

	test("UpdatedMandateStatus required fields", () => {
		expectTypeOf<RequiredKeys<UpdatedMandateStatus>>().toEqualTypeOf<never>();
	});
});
