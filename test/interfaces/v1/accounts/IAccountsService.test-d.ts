import { describe, expectTypeOf, test } from "vitest";
import type {
	AccountBalance,
	AccountDetails,
	Terminal,
	TerminalList,
} from "../../../../src/index.js";
import type { IAccountsService } from "../../../../src/interfaces/v1/accounts/IAccountsService.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { AccountsService } from "../../../../src/services/v1/accounts/accounts.service.js";

test("AccountsService implements IAccountsService", () => {
	expectTypeOf<AccountsService>().toMatchTypeOf<IAccountsService>();
});

test("IAccountsService exposes exactly AccountsService's public methods", () => {
	expectTypeOf<keyof IAccountsService>().toEqualTypeOf<keyof AccountsService>();
});

test("nomba.accounts is typed as IAccountsService", () => {
	expectTypeOf<Nomba["accounts"]>().toEqualTypeOf<IAccountsService>();
});

describe("IAccountsService return types match the documented response shapes", () => {
	test("getParentAccount", () => {
		expectTypeOf<
			IAccountsService["getParentAccount"]
		>().returns.resolves.toEqualTypeOf<AccountDetails>();
	});

	test("getParentBalance", () => {
		expectTypeOf<
			IAccountsService["getParentBalance"]
		>().returns.resolves.toEqualTypeOf<AccountBalance>();
	});

	test("getSubAccount", () => {
		expectTypeOf<
			IAccountsService["getSubAccount"]
		>().returns.resolves.toEqualTypeOf<AccountDetails>();
	});

	test("getSubAccountBalance", () => {
		expectTypeOf<
			IAccountsService["getSubAccountBalance"]
		>().returns.resolves.toEqualTypeOf<AccountBalance>();
	});

	test("listParentTerminals", () => {
		expectTypeOf<
			IAccountsService["listParentTerminals"]
		>().returns.resolves.toEqualTypeOf<TerminalList>();
	});

	test("listSubAccountTerminals", () => {
		expectTypeOf<
			IAccountsService["listSubAccountTerminals"]
		>().returns.resolves.toEqualTypeOf<TerminalList>();
	});

	test("iterateParentTerminals", () => {
		expectTypeOf<
			IAccountsService["iterateParentTerminals"]
		>().returns.toEqualTypeOf<AsyncGenerator<Terminal>>();
	});

	test("iterateSubAccountTerminals", () => {
		expectTypeOf<
			IAccountsService["iterateSubAccountTerminals"]
		>().returns.toEqualTypeOf<AsyncGenerator<Terminal>>();
	});
});
