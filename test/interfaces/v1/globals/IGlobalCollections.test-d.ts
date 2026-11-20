import { describe, expectTypeOf, test } from "vitest";
import type {
	CollectionTransaction,
	InflowProvider,
	InflowResult,
} from "../../../../src/types/v1/globals/collections.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("IGlobalCollections", () => {
	test("InflowProvider required fields", () => {
		expectTypeOf<RequiredKeys<InflowProvider>>().toEqualTypeOf<
			"code" | "displayName"
		>();
	});

	test("InflowResult required fields", () => {
		expectTypeOf<RequiredKeys<InflowResult>>().toEqualTypeOf<
			"transactionReference" | "status"
		>();
	});

	test("CollectionTransaction required fields", () => {
		expectTypeOf<RequiredKeys<CollectionTransaction>>().toEqualTypeOf<
			"transactionId" | "status" | "amount" | "currency"
		>();
	});
});
