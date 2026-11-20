import { describe } from "vitest";
import { OutcomeUnknownError } from "../../../../src/lib/errors.js";
import { GlobalPayoutService } from "../../../../src/services/v1/globals/payout.service.js";
import { outcomeCases } from "../../../support/outcomes.js";

const transferParams = { idempotencyKey: "test-key" } as never;
const exchangeParams = { idempotencyKey: "test-key" } as never;

describe("global payout outcomes", () => {
	outcomeCases(
		"authorizeTransfer",
		(http, h) =>
			new GlobalPayoutService(http).authorizeTransfer(transferParams, h),
		{
			success: { code: "00", data: { status: "COMPLETED" } },
			// FAILED is documented but not said to be final, so it stays pending.
			pending: { code: "00", data: { status: "FAILED" } },
			unknownStatus: { code: "00", data: { status: "REFUND" } },
		},
	);
	outcomeCases(
		"authorizeExchange",
		(http, h) =>
			new GlobalPayoutService(http).authorizeExchange(exchangeParams, h),
		{
			// No documented statuses: classified by code alone, whatever data.status says.
			success: { code: "00", data: { status: "PROCESSING" } },
			pending: new OutcomeUnknownError("POST", "/x", "k", 1, null),
		},
	);
});
