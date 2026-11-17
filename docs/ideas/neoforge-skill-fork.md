# Per-loader skills and a versioned git install

## Problem Statement

How might Julian install one versioned NeoForge workflow skill, and the MCP it needs, from his own git repo on any machine?

## Recommended Direction

Split the loader skills and merge the personal NeoForge workflow into the NeoForge skill.

- `minecraft-neoforge` holds the `minecraft-modding` NeoForge patterns and the `neoforge-mod-workflow` rules in one file. No second skill can conflict with it.
- `minecraft-fabric` and `minecraft-forge-1.20.1` take over the Fabric and Forge reference files.
- `minecraft-modding` is retired.
- The only precedence rule left: the repo's `CLAUDE.md` and `AGENTS.md` beat the skill.

Fix the NeoForge jar-target problem in the skill, not in each mod repo.

- Evidence: a `workspace` target does not find NeoForge classes, because the patched jars in `build/moddev/artifacts` hold no `net/neoforged` classes. A `dependency` target with `versionFromProject` fails with "no binaryJarPath". FML classes are in the separate `fancymodloader` loader jar. This was checked on 2026-11-17 against the MCP connected in the ModularPlanters session. MCP 8.2.0 has no NeoForge fix in its changelog.
- Fix: `scripts/neoforge-jars.init.gradle` prints the exact NeoForge universal jar and loader jar from the project's resolved classpath. `scripts/neoforge-jars.sh` is a fast fallback that reads `neo_version` or `neoforge_version` and searches `~/.gradle/caches`. The skill tells the agent to run one script, then pass `{kind: jar}` targets.
- Also draft an upstream issue for `adhi-jp/minecraft-modding-mcp`. Julian decides whether to post it.

Rewrite the README with install steps from the git repo (no npm publish):

- `npx skills add julian-perge/minecraft-agent-skills --skill minecraft-neoforge`, with the `bunx` form.
- A Claude Code plugin marketplace (needs a new `.claude-plugin/marketplace.json`).
- Manual clone and copy.
- The Codex plugin.
- An MCP section for `adhi-jp/minecraft-modding-mcp`: `claude mcp add` and `.mcp.json` for `npx`, `bunx` and a global install. It states that the skills work without the MCP, with weaker lookups.

Keep the plugin name `minecraft-codex-skills`. Set author, homepage and repository to the fork. Start an own version line.

## Key Assumptions to Validate

- [ ] The init script returns the right jars in all five mod repos (landons_mod, macos_fixes, metalforge, MinecraftStructureInjector, ModularPlanters). Test: run it in ModularPlanters first and compare with the `jar` targets that work today.
- [ ] `npx skills add ... --skill minecraft-neoforge` finds skills under `.agents/skills/`. Test: run it from an empty temp directory.
- [ ] `npm run check` passes after the rename and after the Forge checks leave `check-version-drift.mjs`.
- [ ] The Claude marketplace file installs with `/plugin marketplace add`.

## MVP Scope

In:

- Create `minecraft-neoforge`: merge the workflow rules, the MCP target table and `new-mod-prompt.md`.
- Create `minecraft-fabric` and `minecraft-forge-1.20.1` from the existing reference files.
- Update the 9 routing lines in sibling skills that name `minecraft-modding`.
- Update `check-version-drift.mjs` and `audit-skills.mjs`.
- Add the two jar scripts.
- Rewrite the README.
- Add the marketplace file and the plugin metadata.
- Edit `.agents/skills/` only, then run `npm run sync:skills` and `npm run check`.

Out, until the fork is committed:

- The global `skillOverrides` rename in `~/.claude/settings.json`.
- The `settings.local.json` rename in the five mod repos.

## Not Doing (and Why)

- Syncing from Jahrome907 or opening upstream PRs: Julian maintains the fork alone.
- Publishing to npm: install is from git only.
- A plugin `.mcp.json`: it would start a Node server for every plugin user.
- Slash-command sub commands: the skill trigger already covers loader choice.
- Per-repo Gradle tasks for the jar fix: five repos would need edits.
- A fix inside the MCP itself: the issue draft is the most this work does upstream.

## Open Questions

- What should the Fabric and Forge skills say about the workflow? The NeoForge checkpoint rules may not fit them.
- Should `minecraft-multiloader` link to `minecraft-neoforge` and `minecraft-fabric`, or stay self-contained? The fork rule says no cross-skill dependencies.
