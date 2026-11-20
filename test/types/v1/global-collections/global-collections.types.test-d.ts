import { describe, expectTypeOf, test } from "vitest";
import type { InitiateInflowParams } from "../../../../src/types/v1/globals/collections.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("global-collections.types", () => {
	test("InitiateInflowParams required fields", () => {
		expectTypeOf<RequiredKeys<InitiateInflowParams>>().toEqualTypeOf<
			| "phoneNumber"
			| "callbackUrl"
			| "amount"
			| "currency"
			| "topupVendor"
			| "idempotencyKey"
		>();
	});
});
