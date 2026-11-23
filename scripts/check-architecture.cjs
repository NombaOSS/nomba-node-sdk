// Locks two invariants CODEOWNERS can't catch by itself: which files may touch Node built-ins, and
// that no runtime dependency sneaks into package.json.
const { readdirSync, readFileSync, statSync } = require("node:fs");
const { join, relative } = require("node:path");

const SRC = join(__dirname, "..", "src");
const NODE_IMPORT_ALLOWLIST = new Set([
	"services/http/http-client.service.ts",
	"lib/webhooks.ts",
]);

function* walk(dir) {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) yield* walk(full);
		else yield full;
	}
}

let failed = false;
const fail = (msg) => {
	console.error(`check-architecture: ${msg}`);
	failed = true;
};

for (const file of walk(SRC)) {
	const rel = relative(SRC, file).replaceAll("\\", "/");
	if (!rel.endsWith(".ts") || NODE_IMPORT_ALLOWLIST.has(rel)) continue;
	if (/from "node:/.test(readFileSync(file, "utf8")))
		fail(
			`src/${rel} imports a Node built-in; only ${[...NODE_IMPORT_ALLOWLIST].join(", ")} may`,
		);
}

const { dependencies } = require("../package.json");
if (dependencies && Object.keys(dependencies).length > 0)
	fail(
		`package.json declares runtime dependencies: ${Object.keys(dependencies).join(", ")}`,
	);

process.exit(failed ? 1 : 0);
