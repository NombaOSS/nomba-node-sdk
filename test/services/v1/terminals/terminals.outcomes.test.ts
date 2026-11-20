import { describe } from "vitest";
import { TerminalsService } from "../../../../src/services/v1/terminals/terminals.service.js";
import { outcomeCases } from "../../../support/outcomes.js";

describe("terminal payment request outcomes", () => {
	outcomeCases(
		"pushPaymentRequest",
		(http, h) =>
			new TerminalsService(http).pushPaymentRequest(
				"T1",
				{ merchantTxRef: "t", amount: 100, currency: "NGN" },
				h,
			),
		{
			success: { code: "00", data: { status: "completed" } },
			// "failed" is documented but not said to be final, so it stays pending.
			pending: { code: "00", data: { status: "failed" } },
			unknownStatus: { code: "00", data: { status: "cancelled" } },
		},
	);
});
