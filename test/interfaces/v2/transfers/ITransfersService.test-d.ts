import { describe, expectTypeOf, test } from "vitest";
import type {
	Bank,
	BankAccountLookupResult,
	BankTransferResult,
	WalletTransferResult,
} from "../../../../src/index.js";
import type { ITransfersService } from "../../../../src/interfaces/v2/transfers/ITransfersService.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { TransfersService } from "../../../../src/services/v2/transfers/transfers.service.js";

declare const svc: ITransfersService;

test("TransfersService implements ITransfersService", () => {
	expectTypeOf<TransfersService>().toMatchTypeOf<ITransfersService>();
});

test("ITransfersService exposes exactly TransfersService's public methods", () => {
	expectTypeOf<keyof ITransfersService>().toEqualTypeOf<
		keyof TransfersService
	>();
});

test("nomba.transfers is typed as ITransfersService", () => {
	expectTypeOf<Nomba["transfers"]>().toEqualTypeOf<ITransfersService>();
});

describe("ITransfersService return types match the documented response shapes", () => {
	test("listBanks", () => {
		expectTypeOf<
			ITransfersService["listBanks"]
		>().returns.resolves.toEqualTypeOf<Bank[]>();
	});

	test("lookupBankAccount", () => {
		expectTypeOf<
			ITransfersService["lookupBankAccount"]
		>().returns.resolves.toEqualTypeOf<BankAccountLookupResult>();
	});

	test("bankTransfer", () => {
		expectTypeOf<
			ReturnType<typeof svc.bankTransfer<BankTransferResult>>
		>().resolves.toEqualTypeOf<BankTransferResult>();
	});

	test("bankTransferFromSubAccount", () => {
		expectTypeOf<
			ReturnType<typeof svc.bankTransferFromSubAccount<BankTransferResult>>
		>().resolves.toEqualTypeOf<BankTransferResult>();
	});

	test("walletTransfer", () => {
		expectTypeOf<
			ReturnType<typeof svc.walletTransfer<WalletTransferResult>>
		>().resolves.toEqualTypeOf<WalletTransferResult>();
	});

	test("walletTransferFromSubAccount", () => {
		expectTypeOf<
			ReturnType<typeof svc.walletTransferFromSubAccount<WalletTransferResult>>
		>().resolves.toEqualTypeOf<WalletTransferResult>();
	});
});

test("bankTransfer resolves to what the outcome closures return", () => {
	type Call = ReturnType<typeof svc.bankTransfer<"ok" | "wait" | "no">>;
	expectTypeOf<Call>().resolves.toEqualTypeOf<
		BankTransferResult | "ok" | "wait" | "no"
	>();
});
