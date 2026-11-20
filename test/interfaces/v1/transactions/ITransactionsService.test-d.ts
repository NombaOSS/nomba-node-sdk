import { describe, expectTypeOf, test } from "vitest";
import type {
	BankTransaction,
	BankTransactionList,
	Transaction,
	TransactionList,
	VirtualAccountTransaction,
} from "../../../../src/index.js";
import type { ITransactionsService } from "../../../../src/interfaces/v1/transactions/ITransactionsService.js";
import type { Page } from "../../../../src/lib/util.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { TransactionsService } from "../../../../src/services/v1/transactions/transactions.service.js";

test("TransactionsService implements ITransactionsService", () => {
	expectTypeOf<TransactionsService>().toMatchTypeOf<ITransactionsService>();
});

test("ITransactionsService exposes exactly TransactionsService's public methods", () => {
	expectTypeOf<keyof ITransactionsService>().toEqualTypeOf<
		keyof TransactionsService
	>();
});

test("nomba.transactions is typed as ITransactionsService", () => {
	expectTypeOf<Nomba["transactions"]>().toEqualTypeOf<ITransactionsService>();
});

describe("ITransactionsService return types match the documented response shapes", () => {
	test("listBankTransactions", () => {
		expectTypeOf<
			ITransactionsService["listBankTransactions"]
		>().returns.resolves.toEqualTypeOf<BankTransactionList>();
	});

	test("iterateBankTransactions", () => {
		expectTypeOf<
			ITransactionsService["iterateBankTransactions"]
		>().returns.toEqualTypeOf<AsyncGenerator<BankTransaction>>();
	});

	test("listVirtualAccountTransactions", () => {
		expectTypeOf<
			ITransactionsService["listVirtualAccountTransactions"]
		>().returns.resolves.toEqualTypeOf<Page<VirtualAccountTransaction>>();
	});

	test("listParentTransactions", () => {
		expectTypeOf<
			ITransactionsService["listParentTransactions"]
		>().returns.resolves.toEqualTypeOf<TransactionList>();
	});

	test("iterateParentTransactions", () => {
		expectTypeOf<
			ITransactionsService["iterateParentTransactions"]
		>().returns.toEqualTypeOf<AsyncGenerator<Transaction>>();
	});

	test("listSubAccountTransactions", () => {
		expectTypeOf<
			ITransactionsService["listSubAccountTransactions"]
		>().returns.resolves.toEqualTypeOf<TransactionList>();
	});

	test("iterateSubAccountTransactions", () => {
		expectTypeOf<
			ITransactionsService["iterateSubAccountTransactions"]
		>().returns.toEqualTypeOf<AsyncGenerator<Transaction>>();
	});

	test("filterParentTransactions", () => {
		expectTypeOf<
			ITransactionsService["filterParentTransactions"]
		>().returns.resolves.toEqualTypeOf<TransactionList>();
	});

	test("iterateFilteredParentTransactions", () => {
		expectTypeOf<
			ITransactionsService["iterateFilteredParentTransactions"]
		>().returns.toEqualTypeOf<AsyncGenerator<Transaction>>();
	});

	test("filterSubAccountTransactions", () => {
		expectTypeOf<
			ITransactionsService["filterSubAccountTransactions"]
		>().returns.resolves.toEqualTypeOf<TransactionList>();
	});

	test("iterateFilteredSubAccountTransactions", () => {
		expectTypeOf<
			ITransactionsService["iterateFilteredSubAccountTransactions"]
		>().returns.toEqualTypeOf<AsyncGenerator<Transaction>>();
	});
});
