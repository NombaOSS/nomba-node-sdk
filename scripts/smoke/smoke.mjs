import assert from "node:assert/strict";
import {
	MemoryTokenStore,
	Nomba,
	NombaError,
	verifyWebhook,
} from "@nomba/node-sdk";

const nomba = new Nomba({
	clientId: "smoke",
	clientSecret: "smoke",
	accountId: "smoke",
});
assert.equal(typeof nomba.transfers, "object");
assert.equal(typeof nomba.checkout, "object");
assert.equal(typeof NombaError, "function");
assert.equal(typeof MemoryTokenStore, "function");
assert.equal(
	verifyWebhook("{}", "invalid", "2025-01-01T00:00:00Z", "secret"),
	false,
);
console.log(`import OK on Node ${process.version}`);
