import { describe, expectTypeOf, test } from "vitest";
import type {
	CreatedMandate,
	MandateDebitResult,
	MandatePage,
	MandateStatus,
	UpdatedMandateStatus,
} from "../../../../src/index.js";
import type { IDirectDebitsService } from "../../../../src/interfaces/v1/direct-debits/IDirectDebitsService.js";
import type { Nomba } from "../../../../src/nomba.js";
import type { DirectDebitsService } from "../../../../src/services/v1/direct-debits/direct-debits.service.js";

test("DirectDebitsService implements IDirectDebitsService", () => {
	expectTypeOf<DirectDebitsService>().toMatchTypeOf<IDirectDebitsService>();
});

test("IDirectDebitsService exposes exactly DirectDebitsService's public methods", () => {
	expectTypeOf<keyof IDirectDebitsService>().toEqualTypeOf<
		keyof DirectDebitsService
	>();
});

test("nomba.directDebits is typed as IDirectDebitsService", () => {
	expectTypeOf<Nomba["directDebits"]>().toEqualTypeOf<IDirectDebitsService>();
});

describe("IDirectDebitsService return types match the documented response shapes", () => {
	test("createMandate", () => {
		expectTypeOf<
			IDirectDebitsService["createMandate"]
		>().returns.resolves.toEqualTypeOf<CreatedMandate>();
	});

	test("getMandateStatus", () => {
		expectTypeOf<
			IDirectDebitsService["getMandateStatus"]
		>().returns.resolves.toEqualTypeOf<MandateStatus>();
	});

	test("debitMandate", () => {
		expectTypeOf<
			IDirectDebitsService["debitMandate"]
		>().returns.resolves.toEqualTypeOf<MandateDebitResult>();
	});

	test("listMandates", () => {
		expectTypeOf<
			IDirectDebitsService["listMandates"]
		>().returns.resolves.toEqualTypeOf<MandatePage>();
	});

	test("updateMandateStatus", () => {
		expectTypeOf<
			IDirectDebitsService["updateMandateStatus"]
		>().returns.resolves.toEqualTypeOf<UpdatedMandateStatus>();
	});
});
