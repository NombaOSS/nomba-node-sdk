/**
 * @module nomba/types/v2/airtime
 * @description Airtime v2 types
 */

import type { Network } from "../../common/common.types.js";

export type AirtimePurchaseParams = {
	amount: number;
	/** 11 to 13 characters. */
	phoneNumber: string;
	network: Network;
	/** Idempotency key: unique per purchase. */
	merchantTxRef: string;
	senderName?: string;
};

export type AirtimePurchaseV2Result = {
	/** Pass to requery to confirm the final status. */
	id: string;
	/** SUCCESS or PENDING_BILLING are documented; treat anything else as pending. */
	status: string;
	type: string;
	amount: number;
	timeCreated: string;
	source?: string;
	sourceUserId?: string | null;
	/** Phone number credited with the airtime. */
	customerBillerId?: string;
	/** The spec types it as a string; a sandbox call (2026-09-29) returned null. */
	productId?: string | null;
	meta?: Record<string, unknown>;
	userId?: string | null;
};
