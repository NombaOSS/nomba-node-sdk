/**
 * @module nomba/types/v2/electricity
 * @description Electricity v2 types
 */

export type ElectricityPaymentParams = {
	/** From `electricityProviders`. */
	disco: string;
	/** Idempotency key: unique per payment. */
	merchantTxRef: string;
	payerName: string;
	amount: number;
	customerId: string;
	/** Usually PREPAID or POSTPAID. */
	meterType: string;
};

export type MeterLookupV2Params = {
	disco: string;
	customerId: string;
};

export type MeterLookupV2Result = {
	name: string;
	/** `"unknown"` if the provider supplies no address. */
	address: string;
};

export type ElectricityPaymentV2Result = {
	/** Pass to requery to confirm the final status. */
	id: string;
	/** SUCCESS or PENDING_BILLING are documented; treat anything else as pending. */
	status: string;
	/** e.g. phcn. */
	type: string;
	amount: number;
	timeCreated: string;
	source?: string;
	sourceUserId?: string | null;
	/** Meter number credited with the payment. */
	customerBillerId?: string;
	/** The disco, e.g. "enugu". */
	productId?: string;
	/** The token (`phcnToken`, `phcnVendToken`) and the units bought. */
	meta?: Record<string, unknown>;
	userId?: string | null;
};
