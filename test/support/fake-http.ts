import { vi } from "vitest";
import type { IHttpClient } from "../../src/interfaces/http/IHttpClient.js";
import type { OutcomeEvent } from "../../src/types/common/outcome.types.js";

/** An IHttpClient that answers every request with `answer` (a value, or an error to throw). */
export const fakeHttp = (answer: () => unknown) => {
	const events: OutcomeEvent[] = [];
	const request = vi.fn(async (..._args: unknown[]) => {
		const a = answer();
		if (a instanceof Error) throw a;
		return a;
	});
	const http: IHttpClient = {
		environment: "sandbox",
		request: request as IHttpClient["request"],
		issueToken: vi.fn(),
		refreshToken: vi.fn(),
		revokeToken: vi.fn(),
		reportOutcome: (e) => {
			events.push(e);
		},
	};
	return { http, request, events };
};
