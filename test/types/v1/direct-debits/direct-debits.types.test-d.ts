import { describe, expectTypeOf, test } from "vitest";
import type {
	CreateMandateParams,
	DebitMandateParams,
	ListMandatesParams,
	UpdateMandateStatusParams,
} from "../../../../src/types/v1/direct-debits/direct-debits.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("direct-debits.types", () => {
	test("CreateMandateParams required fields", () => {
		expectTypeOf<RequiredKeys<CreateMandateParams>>().toEqualTypeOf<
			| "customerAccountNumber"
			| "bankCode"
			| "customerName"
			| "customerAccountName"
			| "amount"
			| "frequency"
			| "merchantReference"
			| "startDate"
			| "endDate"
			| "customerEmail"
		>();
	});

	test("DebitMandateParams required fields", () => {
		expectTypeOf<RequiredKeys<DebitMandateParams>>().toEqualTypeOf<
			"mandateId" | "amount"
		>();
	});

	test("ListMandatesParams required fields", () => {
		expectTypeOf<RequiredKeys<ListMandatesParams>>().toEqualTypeOf<
			"page" | "pageSize"
		>();
	});

	test("UpdateMandateStatusParams required fields", () => {
		expectTypeOf<RequiredKeys<UpdateMandateStatusParams>>().toEqualTypeOf<
			"mandateId" | "status"
		>();
	});
});
