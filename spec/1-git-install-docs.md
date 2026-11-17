Source issue: https://github.com/julian-perge/minecraft-agent-skills/issues/1

# Spec: git-install-docs (module of `spec/1-capability-map.md`) - V1

Depends on `loader-skills-split`: the skills must exist, and the README skills table and skill counts are already updated by it. This module must not revert those edits. Commands, structure and code style: see `AGENTS.md`.

## Objective

Let Julian install one versioned skill, or the whole bundle, from this git repo on any machine, with no npm publish. Document five install paths and the optional MCP server. Give the fork its own plugin identity and version line.

## Tech Stack

Markdown, JSON, SVG text. Node 22 scripts for validation. Package manager: `bun` first and `npm` as the fallback in docs and in `AGENTS.md`. CI stays on `npm ci` and `npm run check` (see Boundaries).

## Commands

```bash
bun run check                                   # npm run check as fallback
bun run lint:md
claude plugin validate .                        # checks .claude-plugin/marketplace.json (verified in the Claude Code docs)
claude plugin validate ./plugins/minecraft-codex-skills
```

Install tests (run from an empty directory under `~/tmp/{YYYY-MM-DD}-install-test`):

```bash
bunx skills add <repo path or julian-perge/minecraft-agent-skills> --skill minecraft-neoforge
npx skills add <repo path or julian-perge/minecraft-agent-skills> --skill minecraft-neoforge
claude plugin marketplace add julian-perge/minecraft-agent-skills
claude plugin install minecraft-codex-skills@minecraft-agent-skills
```

## Project Structure

```text
README.md                                   rewritten install section, MCP section, bun-first maintain section
AGENTS.md                                   bun run check first, npm run check fallback (two lines)
docs/assets/how-it-works.svg                text updated: "13" counts and "modding" label (lines 50, 113, 119, 145)
.claude-plugin/marketplace.json             NEW, at the repo root
plugins/minecraft-codex-skills/.claude-plugin/plugin.json   author, homepage, repository, version
plugins/minecraft-codex-skills/.codex-plugin/plugin.json    version (it has no author fields)
plugins/minecraft-codex-skills/README.md    skill count, bun-first maintain line
package.json, package-lock.json             version 3.0.0 (lock has 2 fields)
scripts/validate-plugin-bundle.mjs          also validates .claude-plugin/marketplace.json
```

The plugin keeps the name `minecraft-codex-skills`. The marketplace is named `minecraft-agent-skills`.

## Verified facts (Claude Code docs, plugin-marketplaces page, fetched 2026-11-17)

- A marketplace is `.claude-plugin/marketplace.json` with required `name`, `owner` and `plugins[]`. Each plugin entry needs `name` and `source`.
- A relative `source` is written from the marketplace root (the folder that holds `.claude-plugin/`), for example `./plugins/minecraft-codex-skills`. It may not contain `..`.
- The entry `name` must equal the `name` in the plugin's own `plugin.json`. Both are `minecraft-codex-skills`.
- Install: `claude plugin marketplace add <owner>/<repo>`, then `claude plugin install <plugin>@<marketplace>`.
- `skills add` (vercel-labs/skills README and `docs/creating-skills.md`, fetched the same day) searches `skills/`, `.agents/skills/`, `.claude/skills/`, plugin manifests (`.claude-plugin/marketplace.json` and `plugin.json`) and about 50 other container directories, each up to 3 levels deep. Its README documents `npx` only, `--skill <name>`, `-a <agent>` and `-g`. Its docs do not state whether it removes duplicates.
- The MCP package is `@adhisang/minecraft-modding-mcp` (repo `adhi-jp/minecraft-modding-mcp`, README at 8.2.0). It needs Node.js 22.13+. Its documented install is `claude mcp add minecraft-modding -- npx -y @adhisang/minecraft-modding-mcp` and the `codex mcp add` equivalent.

## README content

1. Install, five paths: (a) `bunx skills add julian-perge/minecraft-agent-skills --skill minecraft-neoforge`, with `npx` as the fallback; (b) Claude Code marketplace; (c) manual clone and copy; (d) the Codex plugin; (e) `claude --plugin-dir ./plugins/minecraft-codex-skills`. Keep the existing warning that raw folders and the plugin must not both be loaded.
2. MCP section for `adhi-jp/minecraft-modding-mcp`: `claude mcp add` and a `.mcp.json` snippet, each for `npx`, `bunx` and a global install. It states that the skills work without the MCP, with weaker lookups. The `bunx` forms are marked `unverified` until tested.
3. Skills table, usage, maintaining: kept, with the maintain commands bun first.

## Code Style

JSON with 2-space indentation. Prose in plain ASCII, short sentences. Example of the marketplace file:

```json
{
  "name": "minecraft-agent-skills",
  "description": "Minecraft skills for Codex and Claude Code.",
  "owner": {
    "name": "Julian Perge"
  },
  "plugins": [
    {
      "name": "minecraft-codex-skills",
      "source": "./plugins/minecraft-codex-skills",
      "description": "15 Minecraft development and operations skills."
    }
  ]
}
```

## Testing Strategy

| Level | What | How |
|---|---|---|
| Static | JSON validity, bundle rules, markdown lint, versions equal across the five files | `bun run check` and `npm run check` |
| Static | Marketplace schema | `claude plugin validate .` |
| Install, local | `skills add` from this repo's path into an empty directory, `bunx` and `npx` forms | by hand, in `~/tmp` |
| Install, remote | The same two forms with `julian-perge/minecraft-agent-skills`, and `claude plugin marketplace add` | after the branch is pushed. Ask first. |

`validate-plugin-bundle.mjs` gets checks for the new marketplace: it has the plugin entry, `source` is `./plugins/minecraft-codex-skills`, and the entry name equals the manifest name.

## Boundaries

- Always: keep the plugin name `minecraft-codex-skills`; keep all version fields equal; mark any install form that was not run as `unverified`.
- Ask first: pushing a branch for the remote install test; `claude plugin marketplace add` (it writes user settings, so remove it after with `claude plugin marketplace remove minecraft-agent-skills`); changing `.github/workflows/skills-audit.yml`.
- Never: publish to npm; add a plugin `.mcp.json` (it would start a Node server for every plugin user); open an upstream PR; touch `~/.claude/settings.json`.
- CI stays on npm: `package-lock.json` is the only lockfile and the workflow caches npm. The bun-first rule covers docs and `AGENTS.md` only.

## Success Criteria

1. `.claude-plugin/marketplace.json` exists, and `claude plugin validate .` ends with `Validation passed`.
2. From an empty directory, `skills add <repo path> --skill minecraft-neoforge` installs exactly one `minecraft-neoforge` skill, with both `bunx` and `npx`. If the CLI finds the same skill under `.agents/skills/`, `.claude/skills/` and the plugin folder and installs it more than once or asks which copy, the README states the exact working command and this is recorded as a finding.
3. After the push, the same test passes with `julian-perge/minecraft-agent-skills`. Until then the README marks the remote form `unverified`.
4. `claude plugin marketplace add` and `claude plugin install minecraft-codex-skills@minecraft-agent-skills` succeed, and `claude plugin list` shows the plugin enabled. The marketplace is removed afterwards.
5. The Claude manifest has author `Julian Perge` with url `https://github.com/julian-perge`, and homepage and repository `https://github.com/julian-perge/minecraft-agent-skills`. No email appears.
6. `package.json`, both `package-lock.json` version fields, and both plugin manifests say `3.0.0`.
7. `AGENTS.md` says `bun run check` with `npm run check` as the fallback, in the Editing and Every task lines. `bun run check` and `npm run check` both exit 0.
8. The README has the five install paths and the MCP section described above. It has no mention of `minecraft-modding` as a skill. `docs/assets/how-it-works.svg` and `plugins/minecraft-codex-skills/README.md` show 15 skills and no stale name.
9. `scripts/validate-plugin-bundle.mjs` fails on a marketplace whose entry name or source is wrong. Show this with one temporary bad copy that is not committed.

## Out of Scope (Deferred)

- An npm publish, a plugin `.mcp.json`, syncing from Jahrome907, and upstream PRs.
- Moving CI to bun.
- A Windows install guide.
- A tagged release or changelog for 3.0.0. This module sets the version only.
- Codex plugin author fields. The Codex manifest has none today.

## Open Questions

- Does `skills add` install duplicates, because the repo holds each skill in `.agents/skills/`, `.claude/skills/` and the plugin folder? The docs do not say. Criterion 2 decides it. If it does, the fix needs your decision (for example, document `-a claude-code` or move the plugin copy), and it is not part of V1.
- Do the `bunx` forms work? `bunx` normally runs a package's `node` shebang, but the MCP needs Node 22.13+ features and the skills CLI needs Node 22.20+. If Node is absent, `bunx` may fall back to Bun. The test decides it.
