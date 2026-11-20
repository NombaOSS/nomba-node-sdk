import { describe, expectTypeOf, test } from "vitest";
import type {
	Conversion,
	ExchangeRate,
	InstitutionProvider,
	PaymentMethodInfo,
	PayoutAccount,
	PayoutResult,
	PayoutTransaction,
} from "../../../../src/index.js";
import type { IGlobalPayoutService } from "../../../../src/interfaces/v1/globals/payouts/IGlobalPayoutService.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { GlobalPayoutService } from "../../../../src/services/v1/globals/payout.service.js";

declare const svc: IGlobalPayoutService;

test("GlobalPayoutService implements IGlobalPayoutService", () => {
	expectTypeOf<GlobalPayoutService>().toMatchTypeOf<IGlobalPayoutService>();
});

test("IGlobalPayoutService exposes exactly GlobalPayoutService's public methods", () => {
	expectTypeOf<keyof IGlobalPayoutService>().toEqualTypeOf<
		keyof GlobalPayoutService
	>();
});

test("nomba.globalPayout is typed as IGlobalPayoutService", () => {
	expectTypeOf<Nomba["globalPayout"]>().toEqualTypeOf<IGlobalPayoutService>();
});

describe("IGlobalPayoutService return types match the documented response shapes", () => {
	test("listAccounts", () => {
		expectTypeOf<
			IGlobalPayoutService["listAccounts"]
		>().returns.resolves.toEqualTypeOf<PayoutAccount[]>();
	});

	test("getAccount", () => {
		expectTypeOf<
			IGlobalPayoutService["getAccount"]
		>().returns.resolves.toEqualTypeOf<PayoutAccount>();
	});

	test("listSandboxAccounts", () => {
		expectTypeOf<
			IGlobalPayoutService["listSandboxAccounts"]
		>().returns.resolves.toEqualTypeOf<PayoutAccount[]>();
	});

	test("getSandboxAccount", () => {
		expectTypeOf<
			IGlobalPayoutService["getSandboxAccount"]
		>().returns.resolves.toEqualTypeOf<PayoutAccount>();
	});

	test("exchangeRates", () => {
		expectTypeOf<
			IGlobalPayoutService["exchangeRates"]
		>().returns.resolves.toEqualTypeOf<ExchangeRate[]>();
	});

	test("convert", () => {
		expectTypeOf<
			IGlobalPayoutService["convert"]
		>().returns.resolves.toEqualTypeOf<Conversion>();
	});

	test("institutionProviders", () => {
		expectTypeOf<
			IGlobalPayoutService["institutionProviders"]
		>().returns.resolves.toEqualTypeOf<InstitutionProvider[]>();
	});

	test("paymentMethods", () => {
		expectTypeOf<
			IGlobalPayoutService["paymentMethods"]
		>().returns.resolves.toEqualTypeOf<PaymentMethodInfo[]>();
	});

	test("authorizeTransfer", () => {
		expectTypeOf<
			ReturnType<typeof svc.authorizeTransfer<PayoutResult>>
		>().resolves.toEqualTypeOf<PayoutResult>();
	});

	test("authorizeExchange", () => {
		expectTypeOf<
			ReturnType<typeof svc.authorizeExchange<PayoutResult>>
		>().resolves.toEqualTypeOf<PayoutResult>();
	});

	test("getTransaction", () => {
		expectTypeOf<
			IGlobalPayoutService["getTransaction"]
		>().returns.resolves.toEqualTypeOf<PayoutTransaction>();
	});
});

test("authorizeTransfer resolves to what the outcome closures return", () => {
	type Call = ReturnType<typeof svc.authorizeTransfer<"ok" | "wait" | "no">>;
	expectTypeOf<Call>().resolves.toEqualTypeOf<
		PayoutResult | "ok" | "wait" | "no"
	>();
});
