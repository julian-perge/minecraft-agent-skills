# ADR-0001: Bun is the only package manager

## Status

Accepted

## Date

2026-11-17

## Context

Issue #13 made `bun.lock` the lockfile for local work. CI still ran `npm ci`
against `package-lock.json`, so every dependency change had to update two
lockfiles. Docs, `AGENTS.md` and the justfile showed `bun` first and `npm` as
the fallback. Issue #14 removes `package-lock.json`, so the repo had to decide
whether `npm run check` stays a supported local fallback.

The `package.json` scripts run `node ./scripts/*.mjs`. Node 22 or later is
needed with either package manager.

## Decision

- Bun is the only supported package manager, in CI and for local work.
- `package.json` has `"packageManager": "bun@1.4.4"`. CI reads the bun
  version from it with `oven-sh/setup-bun` and `bun-version-file`.
- The `check` script chains `bun run`.
- CI keeps `actions/setup-node` with Node 22 and no npm cache, because the
  scripts run under node.
- `package-lock.json` is deleted. No doc, script or justfile recipe names npm as
  a fallback.

## Alternatives Considered

### Keep `npm run check` as a fallback

- Pros: contributors without bun can still run the gate.
- Cons: with no `package-lock.json`, `npm install` resolves unpinned versions.
  The `check` script would have to stay runner-agnostic, which needs extra code.
- Rejected: an unpinned fallback can pass or fail for reasons that CI never sees.

### Run the scripts under bun and remove node

- Pros: one runtime in CI.
- Cons: larger change, and it drops the Node 22 support that `engines` declares.
- Rejected: out of scope for #14.

### Pin the bun version only in the workflow

- Pros: `package.json` does not change.
- Cons: local work and CI can use different bun versions.
- Rejected: `packageManager` gives one source for both.

## Consequences

- A dependency change updates `bun.lock` only.
- Contributors must install bun 1.4.4 or later, and Node 22 or later.
- `scripts/validate-plugin-bundle.mjs` no longer checks a lockfile version. The
  release version lives in `package.json` and the two plugin manifests.
- A bun upgrade is a one-line change to `packageManager`, plus a `bun.lock`
  refresh when the lockfile format changes.
