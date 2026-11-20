import { describe, expectTypeOf, test } from "vitest";
import type { SubAccountLookup } from "../../../../src/types/v1/accounts/accounts.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("accounts.types", () => {
	test("SubAccountLookup required fields", () => {
		expectTypeOf<RequiredKeys<SubAccountLookup>>().toEqualTypeOf<never>();
	});
});
