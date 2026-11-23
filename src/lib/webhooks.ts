/**
 * @module nomba/lib/webhooks
 * @description Nomba SDK for Node.js
 * @description Webhook signature verification
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 * @see https://developer.nomba.com/docs/api-basics/webhook
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/** The fields the signature covers. Everything else in the event is left as `unknown`. */
export interface WebhookEvent {
	[key: string]: unknown;
	/** e.g. payment_success, payment_failed, payout_success, payout_refund. */
	event_type?: string;
	requestId?: string;
	data?: {
		[key: string]: unknown;
		merchant?: { [key: string]: unknown; userId?: string; walletId?: string };
		transaction?: {
			[key: string]: unknown;
			transactionId?: string;
			type?: string;
			time?: string;
			responseCode?: string;
		};
	};
}

/**
 * The base64 HMAC-SHA256 of the signing string the docs define:
 * event_type:requestId:userId:walletId:transactionId:type:time:responseCode:timestamp,
 * with a missing field (or a responseCode of "null") as "".
 */
function webhookSignature(
	event: WebhookEvent,
	secret: string,
	timestamp: string,
): string {
	const merchant = event.data?.merchant ?? {};
	const tx = event.data?.transaction ?? {};
	const responseCode = tx.responseCode === "null" ? "" : tx.responseCode;
	const signed = [
		event.event_type,
		event.requestId,
		merchant.userId,
		merchant.walletId,
		tx.transactionId,
		tx.type,
		tx.time,
		responseCode,
		timestamp,
	]
		.map((v) => v || "")
		.join(":");
	return createHmac("sha256", secret).update(signed).digest("base64");
}

/**
 * True when `signature` (the nomba-signature header) matches the event, signed with your dashboard's
 * webhook signature key and the nomba-timestamp header. `body` is the raw request body (string or Buffer) or the parsed event.
 * A missing or malformed signature or body returns false rather than throwing.
 * Compared exact-case: folding case before comparing would shrink the effective alphabet and weaken
 * forgery resistance, and nothing backs case-insensitivity as real API behavior.
 */
export function verifyWebhook(
	body: string | Buffer | WebhookEvent,
	signature: string | undefined,
	timestamp: string,
	secret: string,
): boolean {
	if (typeof signature !== "string") return false;
	let event: WebhookEvent;
	try {
		event =
			typeof body === "string" || Buffer.isBuffer(body)
				? JSON.parse(body.toString())
				: body;
	} catch {
		return false;
	}
	if (typeof event !== "object" || event === null) return false;
	const expected = Buffer.from(webhookSignature(event, secret, timestamp));
	const given = Buffer.from(signature);
	return expected.length === given.length && timingSafeEqual(expected, given);
}
