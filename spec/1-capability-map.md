Source issue: https://github.com/julian-perge/minecraft-agent-skills/issues/1

# Capability Map: Per-loader skills and a versioned git install

Source idea: `docs/ideas/neoforge-skill-fork.md`. Commands, structure and code style: see `AGENTS.md`.

| Module id | Responsibility | Depends on | Done when |
|---|---|---|---|
| loader-skills-split | Create `minecraft-neoforge` (the `minecraft-modding` NeoForge patterns, the `neoforge-mod-workflow` rules, the MCP target table, `new-mod-prompt.md`). The NeoForge skill supports Minecraft 1.21.1, 1.21.11, 26.1.2 and 26.3. Create `minecraft-fabric` and `minecraft-forge` from the existing reference files, as reference only. Forge stays pinned at 1.20.1. Retire `minecraft-modding`. Update the 9 routing lines in sibling skills. Update `check-version-drift.mjs` and `audit-skills.mjs`, and refactor the Forge 1.20.1 checks to match the new paths. | none | `bun run check` passes after `bun run sync:skills` (`npm run` is the fallback). Every remaining `minecraft-modding` hit under `.agents/skills/` names the MCP server, not a skill. Each of the four NeoForge versions has its Java version, mappings and a pinned API note in the skill. |
| neoforge-jar-scripts | Add `scripts/neoforge-jars.init.gradle` and `scripts/neoforge-jars.sh` inside `minecraft-neoforge`. Make the skill tell the agent to run one script and then pass `{kind: jar}` targets. Draft the upstream issue for `adhi-jp/minecraft-modding-mcp`. | loader-skills-split | The init script returns the right jars in all five mod repos. The `.sh` fallback returns the same jars. Both scripts handle the `neo_version` and `neoforge_version` keys on each supported version family (21.1.x, 21.11.x, 26.x). The issue draft is saved as a file. Julian decides whether to post it. |
| git-install-docs | Rewrite the README for install from git (`bunx skills add` first, with the `npx` form as the fallback, a Claude Code marketplace, manual copy, the Codex plugin, an MCP section). Add `.claude-plugin/marketplace.json`. Set plugin author, homepage and repository to the fork. Start the version line at 3.0.0. Switch `AGENTS.md` to `bun run check` with the `npm` fallback. | loader-skills-split | `bunx skills add ... --skill minecraft-neoforge` finds the skill from an empty directory, and so does the `npx` form. `/plugin marketplace add` installs the plugin. `bun run check` passes, and `npm run check` passes as the fallback. |

Build order: loader-skills-split, then neoforge-jar-scripts and git-install-docs (independent of each other).

## Decisions already made

- Tasks and specs follow `docs/agents/workflow.md`: one spec per module, at `spec/1-<module-id>.md`.
- `minecraft-fabric` and `minecraft-forge` take reference files only. The NeoForge checkpoint rules stay in `minecraft-neoforge`.
- Version line starts at 3.0.0, because the rename breaks existing installs.
- `minecraft-neoforge` supports Minecraft 1.21.1, 1.21.11, 26.1.2 and 26.3. This is a larger scope than the idea note, because these are the most used versions.
- Forge stays pinned at 1.20.1. The check script is refactored for the new skill paths, not for new Forge versions.
- Install docs, MCP examples and `AGENTS.md` show `bun` first and `npm` as the fallback. In `AGENTS.md` this changes the "Editing" and "Every task" check lines to `bun run check`, with `npm run check` as the fallback. The `git-install-docs` module owns this edit.
- `minecraft-fabric` keeps its current versions (26.x, with 1.21.11 examples) for now.
- Edit `.agents/skills/` only, then run `npm run sync:skills` and `npm run check`.
- Out until the fork is committed: the global `skillOverrides` rename in `~/.claude/settings.json`, and the `settings.local.json` rename in the five mod repos.

## Assumptions (guesses, not confirmed)

1. `minecraft-multiloader` gets a plain-text routing line to the loader skills and no dependency on them.
2. The jar scripts live inside `minecraft-neoforge/scripts/`.
3. The scripts are validated in the five mod repos, never in this repo.
4. The skill count goes from 13 to 15 (13 minus 1 retired plus 3 new), so every count in the README and the plugin description changes.

## Open questions for the module specs

- AGENTS.md says "Verify changing APIs against primary documentation for the exact version". Four NeoForge versions means the `loader-skills-split` spec needs a primary-source check for each. In `minecraft-modding` today, 1.21.11 appears many times, 26.3 appears once (`common-patterns.md`), and 1.21.1 and 26.1.2 do not appear. The spec must say how the 1.21.1, 26.1.2 and 26.3 notes are sourced.
- The merged `minecraft-neoforge` SKILL.md would exceed the 450 lines of today's `minecraft-modding`. AGENTS.md says to put longer material in reference files. The spec must say which parts go to `references/`.
