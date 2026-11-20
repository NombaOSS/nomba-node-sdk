import { describe, expectTypeOf, test } from "vitest";
import type {
	CollectionTransaction,
	InflowProvider,
	InflowResult,
} from "../../../../src/index.js";
import type { IGlobalCollectionsService } from "../../../../src/interfaces/v1/globals/collections/IGlobalCollectionsService.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { GlobalCollectionsService } from "../../../../src/services/v1/globals/collections.service.js";

test("GlobalCollectionsService implements IGlobalCollectionsService", () => {
	expectTypeOf<GlobalCollectionsService>().toMatchTypeOf<IGlobalCollectionsService>();
});

test("IGlobalCollectionsService exposes exactly GlobalCollectionsService's public methods", () => {
	expectTypeOf<keyof IGlobalCollectionsService>().toEqualTypeOf<
		keyof GlobalCollectionsService
	>();
});

test("nomba.globalCollections is typed as IGlobalCollectionsService", () => {
	expectTypeOf<
		Nomba["globalCollections"]
	>().toEqualTypeOf<IGlobalCollectionsService>();
});

describe("IGlobalCollectionsService return types match the documented response shapes", () => {
	test("inflowProviders", () => {
		expectTypeOf<
			IGlobalCollectionsService["inflowProviders"]
		>().returns.resolves.toEqualTypeOf<InflowProvider[]>();
	});

	test("initiateInflow", () => {
		expectTypeOf<
			IGlobalCollectionsService["initiateInflow"]
		>().returns.resolves.toEqualTypeOf<InflowResult>();
	});

	test("getTransaction", () => {
		expectTypeOf<
			IGlobalCollectionsService["getTransaction"]
		>().returns.resolves.toEqualTypeOf<CollectionTransaction>();
	});
});
