import { describe, expectTypeOf, test } from "vitest";
import type {
	VirtualAccount,
	VirtualAccountList,
} from "../../../../src/types/v1/virtual-accounts/virtual-accounts.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("IVirtualAccounts", () => {
	test("VirtualAccount required fields", () => {
		expectTypeOf<RequiredKeys<VirtualAccount>>().toEqualTypeOf<
			| "createdAt"
			| "accountHolderId"
			| "accountRef"
			| "bvn"
			| "accountName"
			| "bankName"
			| "bankAccountName"
			| "bankAccountNumber"
			| "currency"
			| "expired"
		>();
	});

	test("VirtualAccountList required fields", () => {
		expectTypeOf<RequiredKeys<VirtualAccountList>>().toEqualTypeOf<
			"results" | "cursor"
		>();
	});
});
