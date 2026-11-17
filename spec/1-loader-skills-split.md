Source issue: https://github.com/julian-perge/minecraft-agent-skills/issues/1

# Spec: loader-skills-split (module of `spec/1-capability-map.md`) - V1

Commands, structure and code style: see `AGENTS.md`. This spec lists only what differs.

## Objective

Replace the `minecraft-modding` skill with three loader skills. This is the first module of the map, and the other two modules depend on it.

- `minecraft-neoforge`: the NeoForge patterns of `minecraft-modding` plus the workflow rules of the personal `neoforge-mod-workflow` skill, in one skill. It supports Minecraft 1.21.1, 1.21.11, 26.1.2 and 26.3. New mods default to 26.3.
- `minecraft-fabric`: the Fabric reference files, as reference only, at its current versions.
- `minecraft-forge`: the Forge 1.20.1 reference files, as reference only. Pinned to Forge 1.20.1, Java 17, ForgeGradle 6. The name has no dots, because `scripts/audit-skills.mjs:197` accepts only `[a-z0-9-]`.
- `minecraft-modding` is deleted. No second skill can conflict with the NeoForge rules.

Users: Julian, on any machine, through the git install. Success: an agent in a NeoForge repo loads one skill and gets the versions, lookup order, checkpoints and verification rules, with no second skill to reconcile.

## Tech Stack

Markdown skills, Node 22 scripts (`scripts/*.mjs`), Bash helper scripts. Run commands with `bun` first and `npm` as the fallback. No Gradle, Minecraft or Paper command runs in this repo (`AGENTS.md`).

## Commands

```bash
bun run sync:skills          # refresh .codex/, .claude/ and plugins/ mirrors (npm run sync:skills as fallback)
bun run check                # the full gate (npm run check as fallback)
bun run check:version-drift  # after editing scripts/check-version-drift.mjs
bun run audit:skills         # after editing scripts/audit-skills.mjs
bun run lint:md
bash -n .agents/skills/<skill>/scripts/check-build.sh
```

## Project Structure

Edit `.agents/skills/` only. Never hand-edit the mirrors.

```text
.agents/skills/minecraft-neoforge/
  SKILL.md                     workflow, scope, lookup order, checkpoints, verification, quick patterns
  references/neoforge-api.md   moved as is (1.21.11)
  references/common-patterns.md  moved as is (NeoForge syntax)
  references/versions.md       NEW: version table and verified deltas, with sources
  references/new-mod-prompt.md moved from ~/.agents/skills/neoforge-mod-workflow, neutralised
  scripts/check-build.sh       NeoForge-only copy of the old script
.agents/skills/minecraft-fabric/
  SKILL.md, references/fabric-api.md, scripts/check-build.sh (Fabric-only copy)
.agents/skills/minecraft-forge/
  SKILL.md, references/forge-1.20.1-api.md, scripts/check-build.sh (Forge-only copy)
.agents/skills/minecraft-modding/   DELETED
scripts/check-version-drift.mjs     paths and checks updated
scripts/audit-skills.mjs            legacy-Forge path rule updated
```

Also edited: the routing lines in 10 sibling skills (12 lines, not the 9 in the idea note; see Success Criteria 4), the skills table row and the skill counts in `README.md` and `AGENTS.md`, and the count in `plugins/minecraft-codex-skills/.codex-plugin/plugin.json`.

Decisions on placement:

- The old SKILL.md sections that every loader needs (platform signature, build and test commands, layout, sides, registries, `ResourceLocation`/`Identifier`, JSON asset templates, datagen, task checklist) are copied into each of the three skills and trimmed to that loader. Skills may not depend on each other, and repetition beats an abstraction here.
- Each skill gets its own `check-build.sh`, trimmed to its loader, because helper scripts stay inside the skill that uses them.
- `common-patterns.md` moves to `minecraft-neoforge` only. It uses NeoForge syntax.
- The workflow text drops every cross-skill reference: the line `Call the Skill tool with "minecraft-modding"`, the rule "where they disagree, this one wins", and the pointer to the `referencing-local-repos` skill. The only precedence rule is: the repo's `AGENTS.md` and `CLAUDE.md` beat the skill.
- The text "Julian's rules" and personal paths are rewritten as neutral wording. Local clones under `~/git/<owner>/<repo>` become "a local clone of the upstream repo, if one exists".
- The MCP lookup step reads "if the `minecraft-modding` MCP server is connected". Without it, the agent uses the docs and the changelog and says what it could not verify.

## Code Style

Skill frontmatter, as in the existing skills. `name` equals the directory name.

```markdown
---
name: minecraft-neoforge
description: "Create, modify, debug, or migrate NeoForge mods for Minecraft 1.21.1, 1.21.11, 26.1.2 and 26.3. Use for NeoForge gameplay code, assets, lookups and checkpoints; use minecraft-multiloader when one codebase must target NeoForge and Fabric."
---
```

Plain ASCII punctuation, short sentences, one idea per sentence. Keep JSON valid with 2-space indentation.

## Testing Strategy

Static checks only. This repo does not compile mods or run Minecraft.

- `bun run check` is the gate. It covers sync, plugin bundle, audit, version drift, doc snippets, validators, repo policy, workflow pins and markdown lint. `npm run check` must also pass.
- `scripts/check-version-drift.mjs` gets new required patterns for every new file, so a later edit cannot drop a version row, the Forge pin or the checkpoint rules without failing.
- `bash -n` on each new `check-build.sh`. This proves syntax only.
- Compilation and in-game behaviour are not validated here. The `neoforge-jar-scripts` module validates the jar lookup in the five mod repos.

## Boundaries

- Always: edit `.agents/skills/` then run `sync:skills`; verify every API or version claim against primary documentation for the exact version and write the source and date next to it; mark a cell `unverified` instead of guessing.
- Ask first: adding a dependency; changing a version pin outside the four NeoForge versions, Fabric's current versions and Forge 1.20.1; moving content between `references/` files after approval.
- Never: hand-edit mirrors; run Gradle, Minecraft or Paper here; add cross-skill dependencies; add unstable features or version guidance; change Fabric's versions in this module.

## Success Criteria

1. `.agents/skills/` contains `minecraft-neoforge`, `minecraft-fabric` and `minecraft-forge`, and no `minecraft-modding`. The skill count is 15.
2. Every remaining `minecraft-modding` hit under `.agents/`, `README.md` and `scripts/` is on a line that names the MCP server (the line contains `MCP`). Check with `rg -n 'minecraft-modding'`.
3. `bun run check` and `npm run check` exit 0 after `sync:skills`. `check:sync` shows no stale `minecraft-modding` mirror.
4. All 12 routing lines now name the correct new skill, in these files: ci-release, world-generation (2), datapack, server-admin, commands-scripting, plugin-dev, testing, resource-pack, multiloader (2). Each line names the loader skill that fits, not all three by default.
5. `minecraft-neoforge/references/versions.md` has one row per version (1.21.1, 1.21.11, 26.1.2, 26.3) with Java version, mappings, NeoForge version line and the MDK or generator source. Every cell carries a source URL and date, or the word `unverified`. Verified deltas appear only for what a primary source shows.
6. `minecraft-neoforge/SKILL.md` states 26.3 as the default for new mods, holds scope, lookup order, the MCP target table (unchanged until the jar-scripts module), checkpoints, the always-ask list, the verification table and the new-mod instructions, and links `references/new-mod-prompt.md`.
7. `minecraft-fabric` and `minecraft-forge` contain no checkpoint workflow. `minecraft-forge` states only Forge 1.20.1, Java 17, ForgeGradle 6.
8. The `forbidden` entries for `neo_version=21.1.172` and `minecraft_version=1.21.1` in `check-version-drift.mjs` still pass, because 1.21.1 content lives in `versions.md` and not in `neoforge-api.md`. The Forge 1.20.1 required patterns now point at `minecraft-forge`. The `moddingSkill` rule in `audit-skills.mjs` is replaced by a rule for the `minecraft-forge` directory.
9. `minecraft-neoforge/SKILL.md` is at most 350 lines. Longer material is in `references/`.
10. No personal text remains: no "Julian", no `~/.agents`, no reference to a skill outside this repo.
11. `README.md` and `AGENTS.md` say 15 skills, and the plugin description says 15. The README skills table lists the three new skills.

## Out of Scope (Deferred)

- The jar scripts, the jar-target table rewrite and the upstream issue draft: module `neoforge-jar-scripts`.
- The README install rewrite, `.claude-plugin/marketplace.json`, plugin author, homepage, repository, the 3.0.0 version and the `AGENTS.md` bun change: module `git-install-docs`.
- Newer Fabric versions, newer Forge versions, and the 1.21.1 or 26.x example sets: not in V1 (verified deltas only).
- The global `skillOverrides` rename in `~/.claude/settings.json` and the `settings.local.json` rename in the five mod repos: after the fork is committed.

## Open Questions

- The 350-line budget in criterion 9 is a guess. The old `minecraft-modding` SKILL.md has 450 lines with all three loaders. Confirm or change the number.
- The map said 9 routing lines. The repo has 12 lines in 10 files. Confirm that all 12 are in scope.
- Which source gives the NeoForge version line and MDK or generator for 26.1.2 and 26.3 (the NeoForge docs, the NeoForge changelog, or the MDK repo)? I will name the source per cell in `versions.md`, and mark gaps `unverified`.
