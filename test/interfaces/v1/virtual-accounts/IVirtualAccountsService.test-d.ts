import { describe, expectTypeOf, test } from "vitest";
import type {
	CreatedVirtualAccount,
	SimulateInflowResult,
	VirtualAccount,
	VirtualAccountList,
} from "../../../../src/index.js";
import type { IVirtualAccountsService } from "../../../../src/interfaces/v1/virtual-accounts/IVirtualAccountsService.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { VirtualAccountsService } from "../../../../src/services/v1/virtual-accounts/virtual-accounts.service.js";

test("VirtualAccountsService implements IVirtualAccountsService", () => {
	expectTypeOf<VirtualAccountsService>().toMatchTypeOf<IVirtualAccountsService>();
});

test("IVirtualAccountsService exposes exactly VirtualAccountsService's public methods", () => {
	expectTypeOf<keyof IVirtualAccountsService>().toEqualTypeOf<
		keyof VirtualAccountsService
	>();
});

test("nomba.virtualAccounts is typed as IVirtualAccountsService", () => {
	expectTypeOf<
		Nomba["virtualAccounts"]
	>().toEqualTypeOf<IVirtualAccountsService>();
});

describe("IVirtualAccountsService return types match the documented response shapes", () => {
	test("create", () => {
		expectTypeOf<
			IVirtualAccountsService["create"]
		>().returns.resolves.toEqualTypeOf<CreatedVirtualAccount>();
	});

	test("createForSubAccount", () => {
		expectTypeOf<
			IVirtualAccountsService["createForSubAccount"]
		>().returns.resolves.toEqualTypeOf<CreatedVirtualAccount>();
	});

	test("get", () => {
		expectTypeOf<
			IVirtualAccountsService["get"]
		>().returns.resolves.toEqualTypeOf<VirtualAccount>();
	});

	test("update", () => {
		expectTypeOf<
			IVirtualAccountsService["update"]
		>().returns.resolves.toEqualTypeOf<{ updated: boolean }>();
	});

	test("expire", () => {
		expectTypeOf<
			IVirtualAccountsService["expire"]
		>().returns.resolves.toEqualTypeOf<{ expired: boolean }>();
	});

	test("list", () => {
		expectTypeOf<
			IVirtualAccountsService["list"]
		>().returns.resolves.toEqualTypeOf<VirtualAccountList>();
	});

	test("iterate", () => {
		expectTypeOf<IVirtualAccountsService["iterate"]>().returns.toEqualTypeOf<
			AsyncGenerator<VirtualAccount>
		>();
	});

	test("simulateInflow", () => {
		expectTypeOf<
			IVirtualAccountsService["simulateInflow"]
		>().returns.resolves.toEqualTypeOf<SimulateInflowResult>();
	});
});
