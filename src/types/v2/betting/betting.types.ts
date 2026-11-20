/**
 * @module nomba/types/v2/betting
 * @description Betting v2 types
 */

export type BettingPaymentParams = {
	/** From `bettingProviders`. */
	bettingProvider: string;
	/** Idempotency key: unique per payment. */
	merchantTxRef: string;
	phoneNumber: string;
	payerName: string;
	amount: number;
	/** Same as verified with `lookupBetting`. */
	customerId: string;
};

export type BettingPaymentV2Result = {
	/** Pass to requery to confirm the final status. */
	id: string;
	/** SUCCESS or PENDING_BILLING are documented; treat anything else as pending. */
	status: string;
	/** e.g. betting. */
	type: string;
	amount: number;
	timeCreated: string;
	source?: string;
	sourceUserId?: string | null;
	/** Betting account credited with the payment. */
	customerBillerId?: string;
	/** The betting provider, e.g. "betnaija". */
	productId?: string;
	meta?: Record<string, unknown>;
	userId?: string | null;
};
