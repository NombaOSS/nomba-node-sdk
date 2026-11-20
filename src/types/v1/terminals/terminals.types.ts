/**
 * @module nomba/types/terminals
 * @description Terminals types
 */

import type { PageParams } from "../../../lib/util.js";

export type TerminalListParams = PageParams & {
	terminalId?: string;
	serialNumber?: string;
	terminalLabel?: string;
	merchantName?: string;
};

export type AssignTerminalParams = {
	serialNumber: string;
	terminalLabel?: string;
};

export type PushPaymentRequestParams = {
	/** Unique identifier for the order associated with the payment. */
	merchantTxRef: string;
	/** In the smallest currency unit (e.g. kobo). */
	amount: number;
	currency: "NGN" | "USD" | "CDF";
};

export type Terminal = {
	terminalId: string;
	serialNumber: string;
	accountId: string;
	parentAccountId: string;
	merchantName: string;
	terminalLabel: string;
	createdAt: string;
	updatedAt: string;
};

export type TerminalList = {
	results: Terminal[];
	/** Pass as `cursor` to get the next page. Empty when there are no more pages. */
	cursor: string;
};

export type TerminalPayment = {
	paymentId: string;
	status: "pending" | "completed" | "failed";
	amount: number;
	currency: string;
	createdAt: string;
};
