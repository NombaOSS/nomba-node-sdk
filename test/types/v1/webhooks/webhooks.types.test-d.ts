import { describe, expectTypeOf, test } from "vitest";
import type {
	EventLogsParams,
	EventsParams,
	ReplayParams,
} from "../../../../src/types/v1/webhooks/webhooks.types.js";
import type { RequiredKeys } from "../../../type-helpers.js";

describe("webhooks.types", () => {
	test("EventLogsParams required fields", () => {
		expectTypeOf<RequiredKeys<EventLogsParams>>().toEqualTypeOf<never>();
	});

	test("EventsParams required fields", () => {
		expectTypeOf<RequiredKeys<EventsParams>>().toEqualTypeOf<never>();
	});

	test("ReplayParams required fields", () => {
		expectTypeOf<RequiredKeys<ReplayParams>>().toEqualTypeOf<
			"startDate" | "endDate"
		>();
	});
});
