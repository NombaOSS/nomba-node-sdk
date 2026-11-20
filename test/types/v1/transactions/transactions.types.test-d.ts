import { describe, expectTypeOf, test } from "vitest";
import type {
	DateRangeParams,
	FilterTransactionsParams,
} from "../../../../src/types/v1/transactions/transactions.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("transactions.types", () => {
	test("DateRangeParams required fields", () => {
		expectTypeOf<RequiredKeys<DateRangeParams>>().toEqualTypeOf<never>();
	});

	test("FilterTransactionsParams required fields", () => {
		expectTypeOf<
			RequiredKeys<FilterTransactionsParams>
		>().toEqualTypeOf<never>();
	});
});
