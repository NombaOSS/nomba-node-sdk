/**
 * @module nomba/webhooks
 * @description Nomba SDK for Node.js
 * @description Webhooks resource: delivery logs, re-push and replay
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 * @see https://developer.nomba.com/docs/api-basics/troubleshoot-webhooks
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { IWebhooksService } from "../../../interfaces/v1/webhooks/IWebhooksService.js";
import type {
	EventLog,
	EventLogsParams,
	EventsParams,
	ReplayParams,
	WebhookList,
	WebhookSubscription,
} from "../../../types/v1/webhooks/webhooks.types.js";

// Documented in the guide only (no API reference page). Its examples answer code "200", not "00", and never
// mark request fields as required, so every field is optional here.
const OK_CODES = ["00", "200"];

/** Webhooks (v1): delivery logs, re-push, and replay for troubleshooting webhook delivery. */
export class WebhooksService implements IWebhooksService {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `POST /v1/webhooks/event-logs`. Returns webhooks sent to your system and how your server answered.
	 * Useful for debugging missed or failed deliveries.
	 * @param params Filters (e.g., `startDate`, `endDate`, `eventType`).
	 * @returns A list of webhook event logs.
	 * @throws {NombaError} The call failed.
	 */
	eventLogs(params: EventLogsParams = {}): Promise<WebhookList<EventLog>> {
		return this.http.request("POST", "/v1/webhooks/event-logs", {
			body: params,
			okCodes: OK_CODES,
		});
	}

	/**
	 * `POST /v1/webhooks/events`. Returns your webhook subscriptions.
	 * @param params Filters (e.g., `eventType`).
	 * @returns A list of webhook subscriptions.
	 * @throws {NombaError} The call failed.
	 */
	events(params: EventsParams = {}): Promise<WebhookList<WebhookSubscription>> {
		return this.http.request("POST", "/v1/webhooks/events", {
			body: params,
			okCodes: OK_CODES,
		});
	}

	/**
	 * `POST /v1/webhooks/re-push`. Resends a single webhook event. Use the `hookRequestId` from `eventLogs`.
	 * @param hookRequestId The event log's ID to resend.
	 * @throws {NombaError} The call failed, e.g. `hookRequestId` does not exist.
	 */
	repush(hookRequestId: string): Promise<void> {
		return this.#post("re-push", { hooksRequestId: hookRequestId });
	}

	/**
	 * `POST /v1/webhooks/bulk-re-push`. Resends multiple webhook events at once.
	 * @param hookRequestIds The event log IDs to resend.
	 * @throws {NombaError} The call failed.
	 */
	bulkRepush(hookRequestIds: string[]): Promise<void> {
		return this.#post("bulk-re-push", { hooksRequestIds: hookRequestIds });
	}

	/**
	 * `POST /v1/webhooks/replay`. Resends every matching webhook event in a time window.
	 * Useful for recovering from webhook handler outages.
	 * @param params The time window (`startDate`, `endDate`) and optional filters.
	 * @throws {NombaError} The call failed.
	 */
	replay(params: ReplayParams): Promise<void> {
		return this.#post("replay", params);
	}

	// These answer with no `data`, so the client resolves to undefined.
	#post(path: string, body: unknown): Promise<void> {
		return this.http.request("POST", `/v1/webhooks/${path}`, {
			body,
			okCodes: OK_CODES,
		});
	}
}
