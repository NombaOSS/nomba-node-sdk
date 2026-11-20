import { describe } from "vitest";
import { TransfersService } from "../../../../src/services/v2/transfers/transfers.service.js";
import { outcomeCases } from "../../../support/outcomes.js";

const bank = {
	amount: 100,
	accountNumber: "0123456789",
	accountName: "A",
	bankCode: "058",
	merchantTxRef: "t",
	senderName: "S",
};
const wallet = {
	amount: 100,
	receiverAccountId: "r",
	merchantTxRef: "t",
	senderName: "S",
};
const answers = {
	success: { code: "200", data: { status: "SUCCESS" } },
	pending: { code: "201", data: { status: "PENDING_BILLING" } },
	unknownStatus: { code: "00", data: { status: "REFUND" } },
};

describe("transfers outcomes", () => {
	outcomeCases(
		"bankTransfer",
		(http, h) => new TransfersService(http).bankTransfer(bank, h),
		answers,
	);
	outcomeCases(
		"bankTransferFromSubAccount",
		(http, h) =>
			new TransfersService(http).bankTransferFromSubAccount("sub", bank, h),
		answers,
	);
	outcomeCases(
		"walletTransfer",
		(http, h) => new TransfersService(http).walletTransfer(wallet, h),
		answers,
	);
	outcomeCases(
		"walletTransferFromSubAccount",
		(http, h) =>
			new TransfersService(http).walletTransferFromSubAccount("sub", wallet, h),
		answers,
	);
});
