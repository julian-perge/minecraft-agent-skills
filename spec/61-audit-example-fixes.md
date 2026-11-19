Source issue: [#61](https://github.com/julian-perge/minecraft-agent-skills/issues/61)

# Spec: Fix the broken examples found in the skill audit of 2026-11-19 (V1)

Commands, structure and code style: see `AGENTS.md`. Supported versions: [ADR-0002](../docs/adr/0002-supported-minecraft-versions.md).

## Objective

An agent that copies an example from a skill gets a build, a file or a command that works on the version the example names. Each finding listed in #61 is checked against a primary source for the exact version and then fixed, or kept with a note when the source shows that it is right.

## Sources

`curl` to Mojang and Maven is blocked by the permission classifier in this environment, so use these raw sources:

- Vanilla data and assets: misode/mcmeta tags `<version>-data` and `<version>-assets` through `gh api 'repos/misode/mcmeta/contents/<path>?ref=<tag>' -H 'Accept: application/vnd.github.raw'`. They hold the output of Mojang's data generator for that version.
- Vanilla code facts (for example the NBT keys a selector reads): the decompiled names in a mapping-aware source such as the NeoForge branch for that version, or the minecraft.wiki history, marked as [WF] when read through WebFetch.
- Loader and library APIs: the project's GitHub branch for the exact version through `gh api` (NeoForge `<version>.x` branches, PaperMC/Paper, FabricMC repos, Architectury).
- Gradle plugin facts: the plugin's GitHub source at the release tag.

Record every source in the build decision comment. A finding that no raw source can settle stays as is, and the decision comment says so.

## Tasks

| Task | Skills | Findings |
| --- | --- | --- |
| T1 | ci-release | changelog read at configuration time; two `plugins {}` blocks; `chmod +x gradlew` in test jobs; the `*-fabric.jar` glob |
| T2 | neoforge | 26.3 loot table form; payload registration and the client send API; the 26.1.2 and 26.3 tool and armor calls |
| T3 | plugin-dev | `folia-supported: true`; `setCustomModelData` on 1.21.4+; `broadcastMessage`; the target of `runtime-patterns.md`; the leading-zero message |
| T4 | testing | the MockBukkit test against the plugin-dev listener; the gametest `fabric.mod.json`; the structure name |
| T5 | world-generation, datapack, commands, multiloader | 26.3 berry-bush placement; the partial biome override; the forceload comment; `SelectedItem` selectors; the multiloader property keys and fixture pins |

## Testing Strategy

- `bun run check` passes after each task.
- A validator change gets a fixture case. A fixed pin or key that a drift pattern can guard gets one.
- No Minecraft, Gradle or Paper command runs.

## Boundaries

- Always: fix in `.agents/skills/`, then `bun run sync:skills`; keep each example on a supported version; keep the 500-line audit limit of a SKILL.md (move text to a reference file when needed).
- Never: drop a supported version; add a cross-skill dependency; guess an API that no source shows.

## Success Criteria

1. Each finding of #61 is fixed, or kept with a source that shows it is right.
2. Each task's decision comment lists its sources.
3. `bun run check` exits 0.

## Open Questions

None.
