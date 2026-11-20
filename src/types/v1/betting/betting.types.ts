/**
 * @module nomba/types/v1/betting
 * @description Betting v1 validation types
 */

export type BettingProvider = {
	id: string;
	name: string;
	biller_id: string;
	lookup_id: string;
	amount?: string;
};

export type BettingProvidersResult = {
	code: string;
	description: string;
	message: string;
	data: BettingProvider[];
};

export type BettingCustomerLookupParams = {
	bettingProvider: string;
	customerId: string;
};

export type BettingCustomerLookupResult = {
	code: string;
	/** Customer name associated with the betting account */
	data: string;
};
