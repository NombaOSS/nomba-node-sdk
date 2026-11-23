const assert = require("node:assert/strict");
const {
	MemoryTokenStore,
	Nomba,
	NombaError,
	verifyWebhook,
} = require("@nomba/node-sdk");

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
console.log(`require OK on Node ${process.version}`);
