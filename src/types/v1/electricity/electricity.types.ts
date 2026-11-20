/**
 * @module nomba/types/v1/electricity
 * @description Electricity v1 validation types
 */

export type ElectricityProvider = {
	id: string;
	name: string;
};

export type ElectricityProvidersResult = {
	code: string;
	data: ElectricityProvider[];
};
