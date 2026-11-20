import { describe, expectTypeOf, test } from "vitest";
import type {
	EventLog,
	WebhookList,
	WebhookSubscription,
} from "../../../../src/index.js";
import type { IWebhooksService } from "../../../../src/interfaces/v1/webhooks/IWebhooksService.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { WebhooksService } from "../../../../src/services/v1/webhooks/webhooks.service.js";

test("WebhooksService implements IWebhooksService", () => {
	expectTypeOf<WebhooksService>().toMatchTypeOf<IWebhooksService>();
});

test("IWebhooksService exposes exactly WebhooksService's public methods", () => {
	expectTypeOf<keyof IWebhooksService>().toEqualTypeOf<keyof WebhooksService>();
});

test("nomba.webhooks is typed as IWebhooksService", () => {
	expectTypeOf<Nomba["webhooks"]>().toEqualTypeOf<IWebhooksService>();
});

describe("IWebhooksService return types match the documented response shapes", () => {
	test("eventLogs", () => {
		expectTypeOf<
			IWebhooksService["eventLogs"]
		>().returns.resolves.toEqualTypeOf<WebhookList<EventLog>>();
	});

	test("events", () => {
		expectTypeOf<IWebhooksService["events"]>().returns.resolves.toEqualTypeOf<
			WebhookList<WebhookSubscription>
		>();
	});

	test("repush", () => {
		expectTypeOf<
			IWebhooksService["repush"]
		>().returns.resolves.toEqualTypeOf<void>();
	});

	test("bulkRepush", () => {
		expectTypeOf<
			IWebhooksService["bulkRepush"]
		>().returns.resolves.toEqualTypeOf<void>();
	});

	test("replay", () => {
		expectTypeOf<
			IWebhooksService["replay"]
		>().returns.resolves.toEqualTypeOf<void>();
	});
});
