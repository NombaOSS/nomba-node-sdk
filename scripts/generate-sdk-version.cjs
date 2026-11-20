const { writeFileSync } = require("node:fs");
const { version } = require("../package.json");

writeFileSync(
	`${__dirname}/../src/lib/sdk-version.generated.ts`,
	`export const SDK_VERSION = ${JSON.stringify(version)};\n`,
);
