import { describe, expectTypeOf, test } from "vitest";
import type {
	BankTransaction,
	VirtualAccountTransaction,
} from "../../../../src/types/v1/transactions/transactions.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("ITransactions", () => {
	test("BankTransaction required fields", () => {
		expectTypeOf<RequiredKeys<BankTransaction>>().toEqualTypeOf<
			| "amount"
			| "currency"
			| "meta"
			| "status"
			| "timeUpdated"
			| "walletBalance"
			| "transactionType"
		>();
	});

	test("VirtualAccountTransaction required fields", () => {
		expectTypeOf<RequiredKeys<VirtualAccountTransaction>>().toEqualTypeOf<
			"id" | "status" | "amount" | "timeCreated"
		>();
	});
});
