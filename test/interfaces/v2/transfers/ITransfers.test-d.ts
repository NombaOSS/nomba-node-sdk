import { describe, expectTypeOf, test } from "vitest";
import type {
	Bank,
	BankAccountLookupResult,
	BankTransferMeta,
	BankTransferResult,
	WalletTransferResult,
} from "../../../../src/types/v2/transfers/transfers.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("ITransfers", () => {
	test("Bank required fields", () => {
		expectTypeOf<RequiredKeys<Bank>>().toEqualTypeOf<never>();
	});

	test("BankAccountLookupResult required fields", () => {
		expectTypeOf<
			RequiredKeys<BankAccountLookupResult>
		>().toEqualTypeOf<never>();
	});

	test("BankTransferMeta required fields", () => {
		expectTypeOf<RequiredKeys<BankTransferMeta>>().toEqualTypeOf<never>();
	});

	test("BankTransferResult required fields", () => {
		expectTypeOf<RequiredKeys<BankTransferResult>>().toEqualTypeOf<"status">();
	});

	test("WalletTransferResult required fields", () => {
		expectTypeOf<
			RequiredKeys<WalletTransferResult>
		>().toEqualTypeOf<"status">();
	});
});
