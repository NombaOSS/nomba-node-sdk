import { expect, test } from "vitest";
import { pathId } from "../../src/lib/util.js";

test("pathId rejects empty, '.' and '..'", () => {
	for (const v of ["", ".", ".."]) {
		expect(() => pathId(v)).toThrow(`Invalid id "${v}"`);
	}
});

test("pathId percent-encodes path separators rather than passing them through", () => {
	expect(pathId("a/b")).toBe("a%2Fb");
	expect(pathId("a\\b")).toBe("a%5Cb");
});

test("pathId passes an ordinary id through, encoded", () => {
	expect(pathId("txn-123")).toBe("txn-123");
});
