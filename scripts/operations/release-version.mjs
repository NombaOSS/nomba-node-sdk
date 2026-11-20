// Works out the next SemVer version from Conventional Commit subjects. PRs are
// squash-merged with the PR title as the subject, and pr-title.yml checks the
// title, so each commit on main carries one reviewed bump. Bodies are ignored.
// Used by .github/workflows/release.yml (`next`) and pr-title.yml (`check-title`).
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const FIRST_VERSION = "0.1.0";

const TYPES = [
	"feat",
	"fix",
	"perf",
	"refactor",
	"docs",
	"style",
	"test",
	"build",
	"ci",
	"chore",
	"revert",
];
const HEADER = /^(\w+)(?:\([^()]+\))?(!)?: \S/;
const RANK = { patch: 1, minor: 2, major: 3 };

/** Parses a Conventional Commit header, or returns null if it isn't one. */
export function parseHeader(header) {
	const match = HEADER.exec(header);
	if (!match || !TYPES.includes(match[1])) return null;
	return { type: match[1], breaking: match[2] === "!" };
}

/** The bump a commit subject asks for: "major", "minor", "patch" or null. */
export function bumpFor(subject) {
	const parsed = parseHeader(subject);
	if (parsed?.breaking) return "major";
	if (parsed?.type === "feat") return "minor";
	if (["fix", "perf", "revert"].includes(parsed?.type)) return "patch";
	return null;
}

/**
 * The version to release after `lastVersion` (null if never released), given
 * the commit subjects since. Returns null when no commit changes the package.
 */
export function nextVersion(lastVersion, subjects) {
	if (lastVersion === null) return FIRST_VERSION;
	let bump = null;
	for (const subject of subjects) {
		const b = bumpFor(subject);
		if (b && (!bump || RANK[b] > RANK[bump])) bump = b;
	}
	if (!bump) return null;
	const [major, minor, patch] = lastVersion.split(".").map(Number);
	// SemVer 0.x: the public API isn't stable yet, so breaking changes bump minor.
	if (bump === "major" && major === 0) bump = "minor";
	if (bump === "major") return `${major + 1}.0.0`;
	if (bump === "minor") return `${major}.${minor + 1}.0`;
	return `${major}.${minor}.${patch + 1}`;
}

const git = (...args) =>
	execFileSync("git", args, {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "inherit"],
	}).trim();

/** The highest vX.Y.Z tag reachable from HEAD, or null if there is none. */
function lastTag() {
	if (git("rev-parse", "--is-shallow-repository") === "true")
		throw new Error("Shallow clone: tags and history are incomplete.");
	return (
		git("tag", "--list", "--merged", "HEAD", "--sort=-v:refname", "v*")
			.split("\n")
			.find((tag) => /^v\d+\.\d+\.\d+$/.test(tag)) ?? null
	);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const [command, arg = ""] = process.argv.slice(2);
	if (command === "check-title") {
		if (!parseHeader(arg)) {
			console.error(
				`PR title is not a Conventional Commit: "${arg}"\n` +
					`Use "<type>: <summary>", e.g. "feat: add transfers", "fix(auth): refresh expired token", "feat!: drop Node 20".\n` +
					`Types: ${TYPES.join(", ")}`,
			);
			process.exit(1);
		}
	} else if (command === "next") {
		const tag = lastTag();
		const subjects = tag
			? git("log", "--format=%s", `${tag}..HEAD`).split("\n")
			: [];
		console.log(nextVersion(tag?.slice(1) ?? null, subjects) ?? "");
	} else {
		console.error("Usage: release-version.mjs next | check-title <title>");
		process.exit(1);
	}
}
