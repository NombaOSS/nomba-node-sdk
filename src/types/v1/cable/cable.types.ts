/**
 * @module nomba/types/v1/cable
 * @description Cable TV v1 validation types
 */

export type CablePlan = {
	subScriptionType: string;
	amount: number;
};

export type CablePlansParams = {
	cableTvType: string;
};

export type CablePlansResult = {
	code: string;
	data: CablePlan[];
};

export type CableCustomerLookupParams = {
	cableTvType: string;
	customerId: string;
};

export type CableCustomerLookupResult = {
	code: string;
	/** Customer name associated with the cable account */
	data: string;
};
