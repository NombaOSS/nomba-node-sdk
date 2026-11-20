/**
 * @module nomba/types/v2/data
 * @description Data v2 types
 */

import type { Network } from "../../common/common.types.js";

export type DataPurchaseParams = {
	/** From `dataPlans`. Buying by amount is deprecated and not supported here. */
	productId: string;
	/** 11 to 13 characters. */
	phoneNumber: string;
	network: Network;
	/** Idempotency key: unique per purchase. */
	merchantTxRef: string;
	senderName?: string;
};

export type DataPurchaseV2Result = {
	/** Pass to requery to confirm the final status. */
	id: string;
	/** SUCCESS or PENDING_BILLING are documented; treat anything else as pending. */
	status: string;
	type: string;
	amount: number;
	timeCreated: string;
	source?: string;
	sourceUserId?: string | null;
	/** Phone number credited with the bundle. */
	customerBillerId?: string;
	/** The bundle's productId, e.g. "mtn1". */
	productId?: string;
	meta?: Record<string, unknown>;
	userId?: string | null;
};
