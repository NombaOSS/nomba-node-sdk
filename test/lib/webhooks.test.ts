import { expect, test } from "vitest";
import { verifyWebhook } from "../../src/index.js";

// A fabricated event, signed with a fabricated secret (not a real merchant's signing key).
const body = JSON.stringify({
	event_type: "payment_success",
	requestId: "11111111-1111-4111-8111-111111111111",
	data: {
		merchant: {
			walletId: "000000000000000000000000",
			walletBalance: 6052,
			userId: "22222222-2222-4222-8222-222222222222",
		},
		terminal: {},
		transaction: {
			aliasAccountNumber: "0000000000",
			fee: 5,
			type: "vact_transfer",
			transactionId: "API-TEST-00000-00000000-0000-0000-0000-000000000000",
			responseCode: "",
			transactionAmount: 10,
			time: "2025-01-01T00:00:00Z",
		},
		customer: { bankCode: "000000", senderName: "Jane Doe" },
	},
});
const signature = "qDSjE0asA2mU7KR5r0Wl2LBNcGNkKDSDSrAIGmrn+zo=";
const timestamp = "2025-01-01T00:00:00Z";
const secret = "test-signing-secret";

test("accepts the documented webhook, as a raw body or parsed", () => {
	expect(verifyWebhook(body, signature, timestamp, secret)).toBe(true);
	expect(verifyWebhook(JSON.parse(body), signature, timestamp, secret)).toBe(
		true,
	);
});

test("rejects a signature that only differs in case (compared exact-case)", () => {
	expect(verifyWebhook(body, signature.toUpperCase(), timestamp, secret)).toBe(
		false,
	);
});

test("rejects a wrong secret, timestamp, signature or tampered body", () => {
	expect(verifyWebhook(body, signature, timestamp, "other")).toBe(false);
	expect(verifyWebhook(body, signature, "2025-01-01T00:00:01Z", secret)).toBe(
		false,
	);
	expect(verifyWebhook(body, "short", timestamp, secret)).toBe(false);
	expect(
		verifyWebhook(
			body.replace("vact_transfer", "other"),
			signature,
			timestamp,
			secret,
		),
	).toBe(false);
});

test('a responseCode of "null" is signed as empty', () => {
	const event = JSON.parse(body);
	event.data.transaction.responseCode = "null";
	expect(verifyWebhook(event, signature, timestamp, secret)).toBe(true);
});

test("a Buffer body (express.raw) is verified", () => {
	expect(verifyWebhook(Buffer.from(body), signature, timestamp, secret)).toBe(
		true,
	);
});

test("a missing signature header or unparseable body is rejected, not thrown", () => {
	expect(verifyWebhook(body, undefined, timestamp, secret)).toBe(false);
	expect(verifyWebhook("not json", signature, timestamp, secret)).toBe(false);
	expect(verifyWebhook("null", signature, timestamp, secret)).toBe(false);
});
