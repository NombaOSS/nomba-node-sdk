import { describe, expectTypeOf, test } from "vitest";
import type {
	EventLog,
	WebhookList,
	WebhookSubscription,
} from "../../../../src/types/v1/webhooks/webhooks.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("IWebhooks", () => {
	test("EventLog required fields", () => {
		expectTypeOf<RequiredKeys<EventLog>>().toEqualTypeOf<never>();
	});

	test("WebhookSubscription required fields", () => {
		expectTypeOf<RequiredKeys<WebhookSubscription>>().toEqualTypeOf<never>();
	});

	test("WebhookList required fields", () => {
		expectTypeOf<RequiredKeys<WebhookList<unknown>>>().toEqualTypeOf<"list">();
	});
});
