import { describe, expectTypeOf, test } from "vitest";
import type {
	AssignTerminalParams,
	PushPaymentRequestParams,
} from "../../../../src/types/v1/terminals/terminals.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("terminals.types", () => {
	test("AssignTerminalParams required fields", () => {
		expectTypeOf<
			RequiredKeys<AssignTerminalParams>
		>().toEqualTypeOf<"serialNumber">();
	});

	test("PushPaymentRequestParams required fields", () => {
		expectTypeOf<RequiredKeys<PushPaymentRequestParams>>().toEqualTypeOf<
			"merchantTxRef" | "amount" | "currency"
		>();
	});
});
