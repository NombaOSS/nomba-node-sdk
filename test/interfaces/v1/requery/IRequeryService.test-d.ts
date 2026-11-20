import { describe, expectTypeOf, test } from "vitest";
import type { Transaction } from "../../../../src/index.js";
import type { IRequeryService } from "../../../../src/interfaces/v1/requery/IRequeryService.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { RequeryService } from "../../../../src/services/v1/requery/requery.service.js";

test("RequeryService implements IRequeryService", () => {
	expectTypeOf<RequeryService>().toMatchTypeOf<IRequeryService>();
});

test("IRequeryService exposes exactly RequeryService's public methods", () => {
	expectTypeOf<keyof IRequeryService>().toEqualTypeOf<keyof RequeryService>();
});

test("nomba.requery is typed as IRequeryService", () => {
	expectTypeOf<Nomba["requery"]>().toEqualTypeOf<IRequeryService>();
});

describe("IRequeryService return types match the documented response shapes", () => {
	test("fetchParentTransaction", () => {
		expectTypeOf<
			IRequeryService["fetchParentTransaction"]
		>().returns.resolves.toEqualTypeOf<Transaction>();
	});

	test("fetchSubAccountTransaction", () => {
		expectTypeOf<
			IRequeryService["fetchSubAccountTransaction"]
		>().returns.resolves.toEqualTypeOf<Transaction>();
	});

	test("requeryBySession", () => {
		expectTypeOf<
			IRequeryService["requeryBySession"]
		>().returns.resolves.toEqualTypeOf<Transaction>();
	});
});
