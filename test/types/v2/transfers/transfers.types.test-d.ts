import { describe, expectTypeOf, test } from "vitest";
import type {
	BankAccountLookupParams,
	BankTransferParams,
	WalletTransferParams,
} from "../../../../src/types/v2/transfers/transfers.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("transfers.types", () => {
	test("BankAccountLookupParams required fields", () => {
		expectTypeOf<RequiredKeys<BankAccountLookupParams>>().toEqualTypeOf<
			"accountNumber" | "bankCode"
		>();
	});

	test("BankTransferParams required fields", () => {
		expectTypeOf<RequiredKeys<BankTransferParams>>().toEqualTypeOf<
			"amount" | "accountNumber" | "accountName" | "bankCode" | "merchantTxRef"
		>();
	});

	test("WalletTransferParams required fields", () => {
		expectTypeOf<RequiredKeys<WalletTransferParams>>().toEqualTypeOf<
			"amount" | "receiverAccountId" | "merchantTxRef" | "senderName"
		>();
	});
});
