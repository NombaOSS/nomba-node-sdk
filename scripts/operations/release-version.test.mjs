import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test } from "vitest";
import {
	bumpFor,
	FIRST_VERSION,
	nextVersion,
	parseHeader,
} from "./release-version.mjs";

describe("parseHeader", () => {
	test.each([
		["feat: add transfers", { type: "feat", breaking: false }],
		["fix(auth): refresh expired token", { type: "fix", breaking: false }],
		["feat!: drop Node 20", { type: "feat", breaking: true }],
		[
			"refactor(direct-debits)!: rename fields",
			{ type: "refactor", breaking: true },
		],
		["chore: set SDK code owners (#6)", { type: "chore", breaking: false }],
	])("accepts %j", (header, expected) => {
		expect(parseHeader(header)).toEqual(expected);
	});

	test.each([
		"Merge pull request #2 from NombaOSS/add-ci",
		"add transfers",
		"feature: add transfers",
		"Feat: add transfers",
		"feat:add transfers",
		"feat: ",
		"feat(): add transfers",
		"",
	])("rejects %j", (header) => {
		expect(parseHeader(header)).toBeNull();
	});
});

describe("bumpFor", () => {
	test.each([
		["feat: add transfers", "minor"],
		["fix: handle 429", "patch"],
		["perf: reuse connections", "patch"],
		["revert: feat: add transfers (#9)", "patch"],
		["feat!: drop Node 20", "major"],
		["chore!: drop Node 20 support", "major"],
		["docs: fix typo", null],
		["chore: set SDK code owners (#6)", null],
		["ci: add release workflow", null],
		["Merge pull request #2 from NombaOSS/add-ci", null],
	])("%j -> %s", (subject, expected) => {
		expect(bumpFor(subject)).toBe(expected);
	});
});

describe("nextVersion", () => {
	test("first release is FIRST_VERSION whatever the commits", () => {
		expect(FIRST_VERSION).toBe("0.1.0");
		expect(nextVersion(null, [])).toBe("0.1.0");
		expect(nextVersion(null, ["feat!: everything"])).toBe("0.1.0");
	});

	test("returns null when nothing releasable changed", () => {
		expect(nextVersion("0.1.0", [])).toBeNull();
		expect(nextVersion("0.1.0", ["docs: a", "chore: b", ""])).toBeNull();
	});

	test("takes the largest bump across commits", () => {
		expect(nextVersion("1.2.3", ["fix: a", "docs: b"])).toBe("1.2.4");
		expect(nextVersion("1.2.3", ["fix: a", "feat: b"])).toBe("1.3.0");
		expect(nextVersion("1.2.3", ["feat!: a", "fix: b"])).toBe("2.0.0");
	});

	test("on 0.x a breaking change bumps minor, not major", () => {
		expect(nextVersion("0.1.0", ["feat!: a"])).toBe("0.2.0");
		expect(nextVersion("0.1.4", ["feat: a"])).toBe("0.2.0");
		expect(nextVersion("0.1.4", ["fix: a"])).toBe("0.1.5");
	});
});

describe("CLI", () => {
	const script = fileURLToPath(
		new URL("./release-version.mjs", import.meta.url),
	);
	let dir;
	afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

	const git = (...args) =>
		execFileSync(
			"git",
			[
				"-c",
				"user.name=t",
				"-c",
				"user.email=t@t",
				"-c",
				"commit.gpgsign=false",
				"-c",
				"tag.gpgsign=false",
				...args,
			],
			{ cwd: dir },
		);
	const commit = (message) =>
		git("commit", "--allow-empty", "-q", "-m", message);
	const run = (...args) =>
		execFileSync("node", [script, ...args], {
			cwd: dir,
			encoding: "utf8",
		}).trim();
	const repo = () => {
		dir = mkdtempSync(join(tmpdir(), "release-version-"));
		git("init", "-q");
	};

	test("next: FIRST_VERSION with no tags", () => {
		repo();
		commit("chore: initial import");
		expect(run("next")).toBe("0.1.0");
	});

	test("next: bumps from the latest v* tag using commits since it", () => {
		repo();
		commit("feat: initial");
		git("tag", "v0.1.0");
		commit("feat!: breaking but ignored, already released");
		git("tag", "v0.2.0");
		git("tag", "not-a-release");
		commit("fix: a");
		commit("feat(transfers): b\n\nbody line");
		expect(run("next")).toBe("0.3.0");
	});

	test("next: uses the highest vX.Y.Z tag, not the nearest, and skips pre-releases", () => {
		repo();
		commit("feat: initial");
		git("tag", "v0.2.1"); // e.g. a maintenance tag merged back in
		commit("feat: b");
		git("tag", "v0.3.0");
		git("tag", "v0.9.0-rc.1");
		git("tag", "v1");
		commit("fix: c");
		expect(run("next")).toBe("0.3.1");
	});

	test("next: reads only subjects, so a BREAKING CHANGE footer doesn't bump", () => {
		repo();
		commit("feat: initial");
		git("tag", "v1.0.0");
		commit(
			"fix: handle 429 (#9)\n\n* wip\n\nBREAKING CHANGE: undone later in the PR",
		);
		expect(run("next")).toBe("1.0.1");
	});

	test("next: fails in a shallow clone instead of restarting at FIRST_VERSION", () => {
		repo();
		commit("feat: initial");
		git("tag", "v0.1.0");
		commit("fix: a");
		const origin = dir;
		dir = mkdtempSync(join(tmpdir(), "release-version-shallow-"));
		git("clone", "-q", "--depth", "1", `file://${origin}`, ".");
		expect(() => run("next")).toThrow();
		rmSync(origin, { recursive: true, force: true });
	});

	test("next: prints nothing when nothing releasable changed", () => {
		repo();
		commit("feat: initial");
		git("tag", "v0.1.0");
		commit("docs: readme");
		expect(run("next")).toBe("");
	});

	test("check-title passes a Conventional Commit and fails otherwise", () => {
		repo();
		expect(run("check-title", "feat(auth): add token refresh")).toBe("");
		expect(() => run("check-title", "Update README")).toThrow(
			/not a Conventional Commit/,
		);
	});
});
