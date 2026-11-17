Source issue: [#14](https://github.com/julian-perge/minecraft-agent-skills/issues/14)

# Spec: Move CI to bun and remove package-lock.json (V1)

Decision record: [ADR-0001](../docs/adr/0001-bun-is-the-only-package-manager.md).

## Objective

Make bun the only package manager. CI installs from `bun.lock` and runs
`bun run check`. `package-lock.json` is deleted, so a dependency change updates
one lockfile. `npm run check` is no longer a supported local fallback.

This change runs after #26. #26 sets version 3.0.0 in `package-lock.json` and in
the files that the plugin bundle validator checks. #14 then deletes the
lockfile and its version check.

## Tech Stack

- bun 1.4.4, pinned with `"packageManager": "bun@1.4.4"` in `package.json`.
- Node 22 or later. The `package.json` scripts run `node ./scripts/*.mjs`.
- GitHub Actions: `actions/checkout`, `actions/setup-node`, `oven-sh/setup-bun`,
  each pinned to a full commit SHA.

## Commands

See `AGENTS.md`. After this change:

```bash
bun install --frozen-lockfile   # install exactly what bun.lock records
bun run check                   # the full gate, the same command CI runs
just check                      # the same gate through the justfile
```

## Project Structure

Files that change:

```text
.github/workflows/skills-audit.yml   setup-bun step, bun install, bun run check
package.json                         packageManager field, check chains bun run
package-lock.json                    deleted
scripts/validate-plugin-bundle.mjs   remove the package-lock version check
scripts/setup-dev-tools.sh           require node and bun, not npm
justfile                             run recipe: bun only; header and install comments
AGENTS.md                            bun run lines, lockfile note
README.md                            Maintaining section uses bun
plugins/minecraft-codex-skills/README.md   bun run sync:skills
spec/1-git-install-docs.md           CI and lockfile notes point to this spec
docs/adr/0001-bun-is-the-only-package-manager.md   new (written with this spec)
```

Out of this list: the other `spec/1-*.md` files and `docs/ideas/` describe past
work and keep their text.

## Code Style

See `AGENTS.md`. The workflow after the change:

```yaml
      - name: Checkout
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

      - name: Setup Node
        uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: "22"

      - name: Setup Bun
        uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0
        with:
          bun-version-file: package.json

      - name: Install dependencies
        run: bun install --frozen-lockfile

      # The "Ensure jq" step stays as it is.

      - name: Run full repository check
        run: bun run check
```

The `check` script keeps its order and replaces each `npm run` with `bun run`.

The justfile `run` recipe keeps its `require`-style error when bun is missing,
and drops the npm branch.

## Testing Strategy

- Static: `bun run check` passes. It includes `check:workflow-pins`, which fails
  on any action that is not pinned to a full SHA, and `check:plugin-bundle`.
- Lockfile: `bun install --frozen-lockfile` exits 0 on a clean clone.
- Search: `rg -n 'package-lock|npm (ci|run|install)'` over the files in Project
  Structure prints no line. Hits in older `spec/1-*.md` files and `docs/ideas/`
  are allowed.
- CI: the `Skills Audit` run on the pull request passes.

No new fixture tests. The change removes code paths and does not add one.

## Boundaries

- Always: pin every action to a full commit SHA with a version comment. Keep the
  Node 22 setup. Run `bun run check` before each commit.
- Ask first: changing a dependency version, adding a workflow, running the
  scripts under bun instead of node.
- Never: keep `package-lock.json` or add another lockfile. Add an npm fallback in
  a doc, script or recipe. Change `bun.lock` except through `bun install`.

## Success Criteria

1. The workflow installs with `bun install --frozen-lockfile` and runs
   `bun run check`. It has no `npm` command and no `cache: npm`.
2. Every `uses:` line in the workflow is pinned to a 40-character SHA, and
   `bun run check:workflow-pins` exits 0.
3. `package.json` has `"packageManager": "bun@1.4.4"`, and setup-bun reads it
   with `bun-version-file: package.json`.
4. The `check` script chains `bun run` only.
5. `package-lock.json` is gone. `scripts/validate-plugin-bundle.mjs` does not
   read it, and the version check covers `package.json` and the two plugin
   manifests.
6. The search in Testing Strategy prints no line.
7. `scripts/setup-dev-tools.sh` requires node and bun, and its messages name
   bun, not npm.
8. `bun install --frozen-lockfile` and `bun run check` exit 0 locally, and the CI
   run on the pull request passes.
9. ADR-0001 records the decision to drop the npm fallback (issue criterion 4).

## Out of Scope (Deferred)

- Running the scripts under bun and removing node: larger change, see ADR-0001.
- A CI cache for bun: the install is small, and caching adds another action.
- Rewriting historical specs and `docs/ideas/` to drop npm: they describe past
  work.

## Open Questions

None.
