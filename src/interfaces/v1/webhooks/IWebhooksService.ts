/**
 * @module nomba/interfaces/webhooks
 * @description Webhooks service contract
 */

import type {
	EventLog,
	EventLogsParams,
	EventsParams,
	ReplayParams,
	WebhookList,
	WebhookSubscription,
} from "../../../types/v1/webhooks/webhooks.types.js";

export interface IWebhooksService {
	/**
	 * `POST /v1/webhooks/event-logs`. Webhooks sent to your system and how your server answered.
	 * @param params Filters and paging.
	 * @returns The matching event logs.
	 * @throws {NombaError} The request was rejected.
	 */
	eventLogs(params?: EventLogsParams): Promise<WebhookList<EventLog>>;
	/**
	 * `POST /v1/webhooks/events`. Your webhook subscriptions.
	 * @param params Filters and paging.
	 * @returns The matching subscriptions.
	 * @throws {NombaError} The request was rejected.
	 */
	events(params?: EventsParams): Promise<WebhookList<WebhookSubscription>>;
	/**
	 * `POST /v1/webhooks/re-push`. Resends one event. Takes an event log's `hookRequestId`; the request
	 * field is spelled `hooksRequestId`, as the guide shows.
	 * @param hookRequestId The event log's `hookRequestId`.
	 * @throws {NombaError} The resend was rejected.
	 */
	repush(hookRequestId: string): Promise<void>;
	/**
	 * `POST /v1/webhooks/bulk-re-push`.
	 * @param hookRequestIds The event logs' `hookRequestId`s.
	 * @throws {NombaError} The resend was rejected.
	 */
	bulkRepush(hookRequestIds: string[]): Promise<void>;
	/**
	 * `POST /v1/webhooks/replay`. Resends every matching event in the time window.
	 * @param params The event type and time window to replay.
	 * @throws {NombaError} The replay was rejected.
	 */
	replay(params: ReplayParams): Promise<void>;
}
