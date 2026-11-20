import { describe, expectTypeOf, test } from "vitest";
import type {
	AccountBalance,
	AccountDetails,
} from "../../../../src/types/v1/accounts/accounts.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("IAccount", () => {
	test("AccountBalance required fields", () => {
		expectTypeOf<RequiredKeys<AccountBalance>>().toEqualTypeOf<
			"amount" | "currency" | "timeCreated"
		>();
	});

	test("AccountDetails required fields", () => {
		expectTypeOf<RequiredKeys<AccountDetails>>().toEqualTypeOf<
			| "createdAt"
			| "accountId"
			| "accountHolderId"
			| "accountRef"
			| "bvn"
			| "status"
			| "type"
			| "accountName"
			| "currency"
			| "banks"
		>();
	});
});
