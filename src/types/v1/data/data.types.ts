/**
 * @module nomba/types/v1/data
 * @description Data plans v1 types
 */

export type DataPlan = {
	productId: string;
	plan: string;
	amount: number;
};

export type DataPlansResult = {
	code: string;
	description: string;
	data: DataPlan[];
};
