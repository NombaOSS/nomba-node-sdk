/**
 * @module nomba/types/global-collections
 * @description GlobalCollections types
 */

export type InitiateInflowParams = {
	/** The customer's mobile money number. */
	phoneNumber: string;
	/** Nomba POSTs here when the status changes. Must be publicly reachable. */
	callbackUrl: string;
	amount: number;
	/** ISO 4217, e.g. CDF. */
	currency: string;
	/** A `code` from `inflowProviders`. */
	topupVendor: string;
	/**
	 * Sent in the body; the API dedupes on it. Required to prevent double disbursement. After an
	 * OutcomeUnknownError, retry with the same key. After a definite rejection, use a new key.
	 */
	idempotencyKey: string;
};

export type InflowProvider = {
	/** Pass as `topupVendor`, e.g. MPESA, AIRTEL, ORANGE. */
	code: string;
	displayName: string;
};

export type InflowResult = {
	/** Pass to `getTransaction`. */
	transactionReference: string;
	/** e.g. PENDING. */
	status: string;
	message?: string;
	idempotencyKey?: string;
};

export type CollectionTransaction = {
	transactionId: string;
	coreUserId?: string;
	/** The customer's mobile money number. */
	account?: string;
	/** PENDING_APPROVAL: no outcome within the polling window; it can still settle later. */
	status: "PENDING" | "APPROVED" | "SUCCESS" | "FAILED" | "PENDING_APPROVAL";
	amount: number;
	currency: string;
	/** Echoes `topupVendor`. */
	vendor?: string;
	/** ACCEPTED, APPROVED or DECLINED. */
	gatewayMessage?: string;
	/** Plain-words meaning of gatewayMessage; null for anything else. */
	gatewayCode?: string | null;
};
