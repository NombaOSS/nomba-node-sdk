import { describe, expectTypeOf, test } from "vitest";
import type { Transaction } from "../../../../src/types/v1/requery/requery.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("IRequery", () => {
	test("Transaction required fields", () => {
		expectTypeOf<RequiredKeys<Transaction>>().toEqualTypeOf<
			| "id"
			| "status"
			| "amount"
			| "source"
			| "type"
			| "gatewayMessage"
			| "timeCreated"
		>();
	});
});
