# Releasing

Every push to `main` runs CI, works out the next SemVer version from the Conventional Commit PR titles since the last tag, and stages it on npm. Nothing is committed back to `main` — the git tag is the source of truth, and `version` in `package.json` stays at `0.0.0`.

## Steps

1. Merge a PR to `main` with a [Conventional Commits](https://www.conventionalcommits.org) title (`feat:`, `fix:`, `feat!:`, etc.) — enforced by the `pr-title` check.
2. The **Release** workflow computes the next version, builds `dist/`, and runs `npm stage publish`.
3. A maintainer approves the staged version with 2FA: `npm stage list @nomba/node-sdk`, then `npm stage approve <stage-id>`.
4. Once approved, the workflow tags the commit `v<version>` and creates the GitHub Release with auto-generated notes.

## Choosing the version

| PR title prefix                                                       | Bump                         |
| --------------------------------------------------------------------- | ---------------------------- |
| `feat:`                                                               | Minor                        |
| `fix:`, `perf:`, `revert:`                                            | Patch                        |
| `feat!:` (or any `!:` / breaking)                                     | Major (minor while on `0.x`) |
| anything else (`docs:`, `chore:`, `ci:`, `style:`, `test:`, `build:`) | No release                   |

Only the PR title counts — `BREAKING CHANGE:` footers in commit messages are ignored.

## After publishing

```bash
npm view @nomba/node-sdk@<version> gitHead   # confirms the published commit
```

If a run staged a version but failed to tag it, create the `v<version>` GitHub Release on that commit directly, or re-run the workflow.

## One-time setup (repo owner)

- `npm` environment in GitHub Actions with trusted publishing (OIDC) configured for `@nomba/node-sdk`.
- npm CLI on the publish runner must support `npm stage` (11.19.1+).
