/**
 * @module nomba/types/webhooks
 * @description Webhooks types
 */

export type EventLogsParams = {
	coreUserId?: string;
	limit?: number;
	/** e.g. payment_success. */
	eventType?: string;
	/** e.g. 2025-03-03. */
	startDateTime?: string;
	endDateTime?: string;
};

export type EventsParams = {
	coreUserId?: string;
	limit?: number;
};

/** INCONCLUSIVE and PUSHED events may already have reached your server: make your handler idempotent. */
export type ReplayStatus = "INITIATED" | "FAILED" | "INCONCLUSIVE" | "PUSHED";

export type ReplayEventType =
	| "PAYMENT_SUCCESS"
	| "PAYMENT_FAILED"
	| "PAYOUT_SUCCESS"
	| "PAYOUT_FAILED"
	| "ORDER_SUCCESS"
	| "PAYMENT_REVERSAL"
	| "PAYOUT_REFUND";

export type ReplayParams = {
	/** RFC 3339, e.g. 2026-01-27T00:00:00Z. */
	startDate: string;
	endDate: string;
	filter?: { statuses?: ReplayStatus[]; eventTypes?: ReplayEventType[] };
};

export type EventLog = {
	webhookUrl?: string;
	eventId?: number;
	eventType?: string;
	/** Pass to `repush` / `bulkRepush`. */
	hookRequestId?: string;
	/** Your server's response body. */
	responsePayload?: string;
	responseHttpStatus?: number;
};

export type WebhookSubscription = {
	webHookId?: number;
	eventURL?: string;
	description?: string;
	eventType?: string;
	enabled?: boolean;
};

/**
 * `pageToken` is returned, but the guide does not say how to send it back for the next page, so the SDK
 * does not paginate.
 */
export type WebhookList<T> = {
	list: T[];
	pageToken?: string;
};
