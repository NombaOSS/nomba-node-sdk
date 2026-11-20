/**
 * @module nomba/types/requery
 * @description Requery types
 */

import type { TransferType } from "../../v2/transfers/transfers.types.js";

type LookupFields = {
	transactionRef?: string;
	merchantTxRef?: string;
	/** Online checkout order reference. */
	orderReference?: string;
	/** Online checkout order id. */
	orderId?: string;
};

/** Each field is independently optional per the docs, but the endpoint needs at least one to identify a transaction. */
export type TransactionLookup =
	| ({ transactionRef: string } & LookupFields)
	| ({ merchantTxRef: string } & LookupFields)
	| ({ orderReference: string } & LookupFields)
	| ({ orderId: string } & LookupFields);

export type Transaction = {
	id: string;
	/** No "NEW" here, unlike TransferStatus — the requery endpoints' spec doesn't list it. */
	status:
		| "SUCCESS"
		| "PENDING_BILLING"
		| "REFUND"
		| "CANCELLED"
		| "PAYMENT_FAILED"
		| "REVERSED_BY_VENDOR";
	amount: number;
	fixedCharge?: number;
	source: "api" | "pos" | "web" | "android_app" | "ios_app";
	type: TransferType;
	gatewayMessage: string;
	customerBillerId?: string;
	timeCreated: string;
	posTid?: string;
	terminalId?: string;
	providerTerminalId?: string;
	/** Retrieval Reference Number. */
	rrn?: string;
	posSerialNumber?: string;
	posTerminalLabel?: string;
	/** System Trace Audit Number. */
	stan?: string;
	paymentVendorReference?: string;
	userId?: string;
	posRrn?: string;
	merchantTxRef?: string;
};
