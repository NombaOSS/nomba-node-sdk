import { Nomba, verifyWebhook } from "@nomba/node-sdk";

const nomba: Nomba = new Nomba({
	clientId: "smoke",
	clientSecret: "smoke",
	accountId: "smoke",
});
const valid: boolean = verifyWebhook(
	"{}",
	"invalid",
	"2025-01-01T00:00:00Z",
	"secret",
);

export { nomba, valid };
