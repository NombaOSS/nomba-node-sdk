import { describe, expectTypeOf, test } from "vitest";
import type {
	Terminal,
	TerminalList,
	TerminalPayment,
} from "../../../../src/types/v1/terminals/terminals.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("Terminal", () => {
	test("Terminal required fields", () => {
		expectTypeOf<RequiredKeys<Terminal>>().toEqualTypeOf<
			| "terminalId"
			| "serialNumber"
			| "accountId"
			| "parentAccountId"
			| "merchantName"
			| "terminalLabel"
			| "createdAt"
			| "updatedAt"
		>();
	});

	test("TerminalList required fields", () => {
		expectTypeOf<RequiredKeys<TerminalList>>().toEqualTypeOf<
			"results" | "cursor"
		>();
	});

	test("TerminalPayment required fields", () => {
		expectTypeOf<RequiredKeys<TerminalPayment>>().toEqualTypeOf<
			"paymentId" | "status" | "amount" | "currency" | "createdAt"
		>();
	});
});
