/**
 * @module nomba/types/transactions
 * @description Transactions types
 */

import type { Page, PageParams } from "../../../lib/util.js";
import type { TransferType } from "../../v2/transfers/transfers.types.js";
import type { Transaction } from "../requery/requery.types.js";

export type BankTransaction = {
	amount: number;
	currency: "NGN";
	meta: {
		billerId?: string;
		terminalActionId?: string;
		productId?: string;
		fee?: number;
		type?: string;
		transactionId?: string;
		/** Retrieval Reference Number. */
		rrn?: string;
		parentAccountId?: string;
		terminalLabel?: string;
		accountId?: string;
		merchantTxRef?: string;
		transactionAmount?: number;
		mCollectionsId?: string;
	};
	status:
		| "SUCCESS"
		| "PENDING_BILLING"
		| "REFUND"
		| "CANCELLED"
		| "PAYMENT_FAILED"
		| "REVERSED_BY_VENDOR";
	timeUpdated: string;
	walletBalance: number;
	transactionType: "CREDIT" | "DEBIT";
};

/** From the guide's example only (no API reference page); amounts come back as strings, e.g. "100.0". */
export type VirtualAccountTransaction = {
	[key: string]: unknown;
	id: string;
	status: string;
	amount: string;
	fixedCharge?: string;
	source?: string;
	type?: string;
	timeCreated: string;
	timeUpdated?: string;
	walletCurrency?: string;
	walletBalance?: string;
	paymentVendorReference?: string;
	senderName?: string;
	recipientAccountNumber?: string;
	recipientAccountName?: string;
	recipientAccountType?: string;
	sessionId?: string;
	accountNumber?: string;
	bankCode?: string;
	bankName?: string;
	/** e.g. CREDIT. */
	entryType?: string;
	narration?: string;
	currency?: string;
};

export type DateRangeParams = {
	/** UTC, e.g. "2023-01-01T00:00:00" */
	dateFrom?: string;
	/** UTC, e.g. "2024-09-30T23:59:59" */
	dateTo?: string;
};

export type TransactionListParams = PageParams & DateRangeParams;

/** Pass `cursor` back to get the next page. Empty when there are no more pages. */
export type TransactionList = Page<Transaction>;

export type BankTransactionList = Page<BankTransaction>;

export type FilterTransactionsParams = {
	transactionRef?: string;
	/** Broader than Transaction's own status: includes filter-only states like NEW and PENDING_PAYMENT. */
	status?:
		| "NEW"
		| "PENDING_PAYMENT"
		| "PAYMENT_SUCCESSFUL"
		| "PAYMENT_FAILED"
		| "PENDING_BILLING"
		| "SUCCESS"
		| "REFUND";
	source?: "api" | "pos" | "web" | "android_app" | "ios_app";
	type?: TransferType;
	terminalId?: string;
	/** Retrieval Reference Number. */
	rrn?: string;
	merchantTxRef?: string;
	/** Online checkout order reference. */
	orderReference?: string;
	/** Online checkout order id. */
	orderId?: string;
};

export type VirtualAccountTransactionParams = DateRangeParams & {
	/** The virtual account number. */
	accountNumber: string;
};
