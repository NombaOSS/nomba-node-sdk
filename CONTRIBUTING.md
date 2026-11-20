# Contributing to the Nomba Node SDK

Thanks for helping developers get to work quickly with Nomba's APIs. Every contribution must follow the rules below. Pull requests that break them will not be merged.

## The rules

### 1. Match the Nomba documentation exactly

The SDK is a faithful client for the official Nomba API docs.

- Endpoints, HTTP methods, headers, auth flows, request and response fields, types, required/optional flags, and error formats must match the docs.
- Never guess or invent API behavior. If the docs are unclear or silent, ask in the issue or PR before writing code.
- Link the relevant docs page in your PR description for every endpoint you add or change.

### 2. Keep it simple

The best code is the code never written.

- Add only what is needed now. No speculative abstractions, config for values that never change, or scaffolding "for later".
- Reuse existing helpers and patterns in this repo before writing new ones.
- Prefer the standard library and native Node features. Do not add a dependency for something a few lines can do.
- Mark deliberate shortcuts with a known limit using a `limit:` comment that names the limit and the upgrade path.

### 3. Test your changes

- Every behavior change comes with tests that fail if the logic breaks.
- Tests must assert against the documented request and response shapes, not against your own assumptions.
- All tests must pass before you open a PR.

### 4. Get a review

- Review your own diff before requesting review. Remove dead code, debug output, and unrelated changes.
- Every PR needs at least one approving review from a maintainer.
- Address review comments in the PR. Do not resolve a thread without a fix or a reply.

## Pull requests

- Keep each PR focused on one change.
- Describe what changed and why, and link the docs page(s) it follows.
- Use [Conventional Commits](https://www.conventionalcommits.org) for PR titles (`feat:`, `fix:`, `feat!:` for breaking changes, `docs:`, `chore:`). A required check enforces this. PRs are squash-merged, and every merge to `main` releases to npm: `feat` bumps the minor version, `fix`, `perf` and `revert` bump the patch version, and a breaking change (`!` in the PR title, e.g. `feat!:`) bumps the major version (the minor version while we're on 0.x). Only the PR title counts; `BREAKING CHANGE:` footers in commits are ignored. Other types don't release. Release notes are on GitHub Releases. Don't edit the `version` in `package.json`; it stays at `0.0.0` and the release tag sets the published version.
- Requires Node 22 or newer (see `.nvmrc`). Code is TypeScript in `src/` (strict mode, no `any`) and linted/formatted with [Biome](https://biomejs.dev). Tests use [Vitest](https://vitest.dev) (`src/*.test.ts`). Run `npm run lint` (`npx biome check --write .` to autofix), `npm run typecheck` and `npm test` before pushing. CI runs the same.
- Layout: `src/lib/` is the shared core (client, errors, token store, paging helpers). `src/resources/` has one file per API area, named after its section in the Nomba API reference, with its `*.test.ts` beside it. Each resource is exposed on the `Nomba` client (e.g. `nomba.transfers`) and exported from `src/index.ts`.
- Never commit secrets, API keys, or real credentials, including in tests and examples.
- Update the README or usage docs if public behavior changes.

## Using Claude Code

This repo's [CLAUDE.md](CLAUDE.md) sets the same rules for AI-assisted work: the simplest solution that works, every change reviewed and tested, and exact adherence to the Nomba docs. If you use Claude Code, it will follow them automatically.
