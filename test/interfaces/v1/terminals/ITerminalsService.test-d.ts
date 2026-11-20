import { describe, expectTypeOf, test } from "vitest";
import type { Terminal, TerminalPayment } from "../../../../src/index.js";
import type { ITerminalsService } from "../../../../src/interfaces/v1/terminals/ITerminalsService.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { TerminalsService } from "../../../../src/services/v1/terminals/terminals.service.js";

declare const svc: ITerminalsService;

test("TerminalsService implements ITerminalsService", () => {
	expectTypeOf<TerminalsService>().toMatchTypeOf<ITerminalsService>();
});

test("ITerminalsService exposes exactly TerminalsService's public methods", () => {
	expectTypeOf<keyof ITerminalsService>().toEqualTypeOf<
		keyof TerminalsService
	>();
});

test("nomba.terminals is typed as ITerminalsService", () => {
	expectTypeOf<Nomba["terminals"]>().toEqualTypeOf<ITerminalsService>();
});

describe("ITerminalsService return types match the documented response shapes", () => {
	test("assignToParent", () => {
		expectTypeOf<
			ITerminalsService["assignToParent"]
		>().returns.resolves.toEqualTypeOf<Terminal>();
	});

	test("assignToSubAccount", () => {
		expectTypeOf<
			ITerminalsService["assignToSubAccount"]
		>().returns.resolves.toEqualTypeOf<Terminal>();
	});

	test("unassignFromParent", () => {
		expectTypeOf<
			ITerminalsService["unassignFromParent"]
		>().returns.resolves.toEqualTypeOf<Terminal>();
	});

	test("unassignFromSubAccount", () => {
		expectTypeOf<
			ITerminalsService["unassignFromSubAccount"]
		>().returns.resolves.toEqualTypeOf<Terminal>();
	});

	test("pushPaymentRequest", () => {
		expectTypeOf<
			ReturnType<typeof svc.pushPaymentRequest<TerminalPayment>>
		>().resolves.toEqualTypeOf<TerminalPayment>();
	});
});

test("pushPaymentRequest resolves to what the outcome closures return", () => {
	type Call = ReturnType<typeof svc.pushPaymentRequest<"ok" | "wait" | "no">>;
	expectTypeOf<Call>().resolves.toEqualTypeOf<
		TerminalPayment | "ok" | "wait" | "no"
	>();
});
