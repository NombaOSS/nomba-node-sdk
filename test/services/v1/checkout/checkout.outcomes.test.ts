import { describe } from "vitest";
import { CheckoutService } from "../../../../src/services/v1/checkout/checkout.service.js";
import { outcomeCases } from "../../../support/outcomes.js";

const refundParams = { transactionId: "txn-123" } as never;

describe("checkout refund outcomes", () => {
	outcomeCases(
		"refund",
		(http, h) => new CheckoutService(http).refund(refundParams, h),
		{
			success: { code: "00", data: { success: true, message: "ok" } },
			pending: { code: "00", data: { success: false, message: "not yet" } },
			unknownStatus: { code: "00", data: { message: "no success flag" } },
		},
	);
});
