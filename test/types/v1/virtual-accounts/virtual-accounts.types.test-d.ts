import { describe, expectTypeOf, test } from "vitest";
import type {
	CreateVirtualAccountParams,
	FilterVirtualAccountsParams,
	SimulateInflowParams,
	SimulateInflowResult,
	UpdateVirtualAccountParams,
} from "../../../../src/types/v1/virtual-accounts/virtual-accounts.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("virtual-accounts.types", () => {
	test("CreateVirtualAccountParams required fields", () => {
		expectTypeOf<RequiredKeys<CreateVirtualAccountParams>>().toEqualTypeOf<
			"accountRef" | "accountName"
		>();
	});

	test("UpdateVirtualAccountParams required fields", () => {
		expectTypeOf<
			RequiredKeys<UpdateVirtualAccountParams>
		>().toEqualTypeOf<never>();
	});

	test("FilterVirtualAccountsParams required fields", () => {
		expectTypeOf<
			RequiredKeys<FilterVirtualAccountsParams>
		>().toEqualTypeOf<never>();
	});

	test("SimulateInflowParams required fields", () => {
		expectTypeOf<RequiredKeys<SimulateInflowParams>>().toEqualTypeOf<
			"amount" | "senderAccountName"
		>();
	});

	test("SimulateInflowResult required fields", () => {
		expectTypeOf<RequiredKeys<SimulateInflowResult>>().toEqualTypeOf<
			| "status"
			| "responseCode"
			| "sessionId"
			| "accountNumber"
			| "accountRef"
			| "amount"
		>();
	});
});
