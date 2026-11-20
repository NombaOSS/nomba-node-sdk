import { expectTypeOf, test } from "vitest";
import type {
	BankTransferResult,
	CallOptions,
	FailedInfo,
	ITransfersService,
	Outcome,
	OutcomeHandlers,
	PendingInfo,
} from "../../../src/index.js";
import type { RequiredKeys } from "../../type-helpers.js";

declare const transfers: ITransfersService;
declare const params: Parameters<ITransfersService["bankTransfer"]>[0];

test("Outcome is exactly success, pending or failed", () => {
	expectTypeOf<Outcome>().toEqualTypeOf<"success" | "pending" | "failed">();
});

test("every closure is optional", () => {
	expectTypeOf<RequiredKeys<OutcomeHandlers<unknown>>>().toEqualTypeOf<never>();
});

test("CallOptions is the outcome closures (idempotency key is now derived from params)", () => {
	expectTypeOf<CallOptions<BankTransferResult, number>>().toEqualTypeOf<
		OutcomeHandlers<BankTransferResult, number>
	>();
});

test("closures receive the typed data and info", () => {
	transfers.bankTransfer(params, {
		onSuccess: (data) => expectTypeOf(data).toEqualTypeOf<BankTransferResult>(),
		onPending: (info) =>
			expectTypeOf(info).toEqualTypeOf<PendingInfo<BankTransferResult>>(),
		onFailed: (info) =>
			expectTypeOf(info).toEqualTypeOf<FailedInfo<BankTransferResult>>(),
	});
});

test("the call resolves to the closures' return type, or the data when one is missing", () => {
	const all = transfers.bankTransfer(params, {
		onSuccess: () => 1 as const,
		onPending: () => 2 as const,
		onFailed: () => 3 as const,
	});
	expectTypeOf(all).resolves.toEqualTypeOf<BankTransferResult | 1 | 2 | 3>();
	expectTypeOf(
		transfers.bankTransfer(params),
	).resolves.toEqualTypeOf<BankTransferResult>();
});
