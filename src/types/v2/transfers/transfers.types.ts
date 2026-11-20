/**
 * @module nomba/types/transfers
 * @description Transfers types
 */

export type BankAccountLookupParams = {
	/** 10 digits. */
	accountNumber: string;
	/** From `listBanks`. */
	bankCode: string;
};

export type BankTransferParams = {
	amount: number;
	/** 10 digits. */
	accountNumber: string;
	accountName: string;
	bankCode: string;
	/** Idempotency key: unique per transfer, and reused (never regenerated) when retrying a pending one. */
	merchantTxRef: string;
	senderName?: string;
	narration?: string;
};

export type WalletTransferParams = {
	amount: number;
	receiverAccountId: string;
	/** Idempotency key: unique per transfer, and reused (never regenerated) when retrying a pending one. */
	merchantTxRef: string;
	/** Required per API documentation. */
	senderName: string;
	narration?: string;
};

/** The spec lists SUCCESS and PENDING_BILLING for bank transfers; the guide also shows NEW and REFUND. */
export type TransferStatus =
	| "SUCCESS"
	| "PENDING_BILLING"
	| "NEW"
	| "REFUND"
	| "CANCELLED"
	| "PAYMENT_FAILED"
	| "REVERSED_BY_VENDOR";

export type TransferType =
	| "withdrawal"
	| "purchase"
	| "transfer"
	| "p2p"
	| "online_checkout"
	| "qrt_credit"
	| "qrt_debit";

export type Bank = {
	code?: string;
	name?: string;
	/** May be null. */
	nipCode?: string | null;
	/** Empty string when no logo is available. */
	logo?: string;
};

export type BankAccountLookupResult = {
	accountNumber?: string;
	accountName?: string;
};

/**
 * Only the fields the docs agree on are named. The guide's sample payload has other fields and types that
 * differ from the spec (for example numeric and boolean values), so the rest is left as `unknown`.
 */
export type BankTransferMeta = {
	[key: string]: unknown;
	api_rrn?: string;
	narration?: string;
	recipientName?: string;
	sender_name?: string;
	merchantTxRef?: string;
	api_client_id?: string;
	currency?: string;
	accountNumber?: string;
	bankName?: string;
	bankCode?: string;
	sessionId?: string;
	paymentVendorReference?: string;
};

/**
 * `status` is always present. When the API answers 201 ("processing"), it is the only field, so
 * treat PENDING_BILLING as pending: wait for the webhook or requery, and do not send the transfer again.
 */
export type BankTransferResult = {
	status: TransferStatus;
	/** A string in the spec, a number in the guide's sample response. */
	amount?: string | number;
	source?: string;
	sourceUserId?: string;
	customerBillerId?: string;
	productId?: string;
	meta?: BankTransferMeta;
	fee?: number;
	timeCreated?: string;
	/** Use it to requery the transfer. */
	id?: string;
	type?: TransferType;
};

/** As for BankTransferResult, `status` is the only field guaranteed when the API answers 201. */
export type WalletTransferResult = {
	status: TransferStatus;
	amount?: number;
	meta?: {
		merchantTxRef?: string;
		api_client_id?: string;
		api_account_id?: string;
		/** Retrieval Reference Number. */
		rrn?: string;
	};
	fee?: number;
	timeCreated?: string;
	id?: string;
	type?: TransferType;
};
