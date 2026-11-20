/**
 * @module nomba/types/v2/cable
 * @description Cable TV v2 types
 */

/** The guide lists dstv, gotv, startimes and ShowMax. */
export type CableTvType =
	| "dstv"
	| "gotv"
	| "startimes"
	| "ShowMax"
	| (string & {});

export type CableTvSubscriptionParams = {
	cableTvType: CableTvType;
	/** Idempotency key: unique per payment. */
	merchantTxRef: string;
	payerName: string;
	amount: number;
	customerId: string;
};

export type CablePaymentV2Result = {
	/** Pass to requery to confirm the final status. */
	id: string;
	/** SUCCESS or PENDING_BILLING are documented; treat anything else as pending. */
	status: string;
	/** e.g. dstv. */
	type: string;
	amount: number;
	timeCreated: string;
	source?: string;
	sourceUserId?: string | null;
	/** Smartcard number credited with the payment. */
	customerBillerId?: string;
	/** The cable TV provider, e.g. "gotv". */
	productId?: string;
	meta?: Record<string, unknown>;
	userId?: string | null;
};
