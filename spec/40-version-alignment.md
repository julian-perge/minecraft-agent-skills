Source issue: [#40](https://github.com/julian-perge/minecraft-agent-skills/issues/40)

# Spec: Align version guidance with Minecraft 1.21.11, 26.1.2 and 26.3 (V1)

Decision record: [ADR-0002](../docs/adr/0002-supported-minecraft-versions.md). Commands, structure and code style: see `AGENTS.md`.

## Objective

Every skill, doc and validator names the supported versions exactly: Minecraft 1.21.11, 26.1.2 and 26.3. 26.2 is skipped. Forge 1.20.1 on Java 17 with ForgeGradle 6 stays as it is. `minecraft-neoforge` keeps 1.21.1 too (ADR-0002). Each example that targets a version outside this list moves to a listed version, and each changed API, format or dependency claim is checked against a primary source for the exact version. Agents that read the skills then pick a supported version and a dependency that exists for it.

## Wording rules

- Name versions newest first or oldest first, but name all of them: "Minecraft 1.21.11, 26.1.2 and 26.3". A sentence about only the 26 line says "26.1.2 and 26.3". A sentence about only the 1.21 line says "1.21.11".
- Java: "Java 25 for 26.1.2 and 26.3, Java 21 for 1.21.11, Java 17 for Forge 1.20.1".
- Keep history: pack format tables, "through 26.2" migration notes and feature boundaries such as "1.21.4+ item definitions" stay. They describe when a feature changed, not a target.
- "26.x" and "1.21.x" may stay only where the text means the whole line on purpose, for example a validator that accepts a project pin it does not know. Then the text says so.
- Frontmatter `description` lines name the exact versions (or the exact Forge version). They do not say "26.x", "1.21.x", "current" or "legacy".

## Verified facts (2026-11-19)

Sources: `~/tmp/2026-11-19-run/version-research.md` (copied into the #40 decision comment). Values marked [WF] came from a WebFetch summary, not the raw page. A build task that writes a [WF] value must confirm it from a raw source first (a GitHub file at a commit through `gh api`, a file inside the official jar, or the Maven metadata file), and record the source in its decision comment.

| Fact | Value | Source |
| --- | --- | --- |
| Java | 1.21.11: 21. 26.1.2 and 26.3: 25 | Mojang per-version JSON `javaVersion.majorVersion` [WF] |
| Data pack format | 1.21.11 `[94, 1]`, 26.1.2 `[101, 1]` (same as 26.1), 26.3 `[121, 0]` | minecraft.wiki Pack_format [WF] |
| Resource pack format | 1.21.11 `[75, 0]`, 26.1.2 `[84, 0]` (same as 26.1), 26.3 `[97, 1]` | minecraft.wiki Pack_format [WF] |
| MockBukkit | 26.3: `org.mockbukkit.mockbukkit:mockbukkit-v26.3:4.122.0` (tag v4.122.0, 564321e). 26.1.2: `mockbukkit-v26.1.2:4.115.0`. 1.21.11: `mockbukkit-v1.21:4.116.3`. JUnit Jupiter 6.1.3 | MockBukkit tags and `gradle.properties` through `gh api`; Maven Central [WF] |
| Paper API | 1.21.11: `1.21.11-R0.1-SNAPSHOT`. 26.1.2: `26.1.2.build.<n>-stable`. 26.3: `26.3.build.<n>-stable`. Do not resolve with `latest.release` (the metadata `<latest>` is `26.3-pre-2.build.0-alpha`) | repo.papermc.io metadata [WF] |
| Architectury | 1.21.11: API 19.0.1, branch `1.21.11`, `dev.architectury.loom` 1.13-SNAPSHOT. 26.1.2: API 20.1.18, branch `26.1`, `dev.architectury.loom-no-remap` 1.17-SNAPSHOT. 26.3: API 22.0.6, branch `26.3`, `dev.architectury.loom-no-remap` 1.17-SNAPSHOT | architectury-api branches through `gh api`; Maven [WF] |
| Fabric | Loader 0.20.1. Fabric API 0.141.6+1.21.11, 0.155.3+26.1.2, 0.166.2+26.3. Loom 1.19: `net.fabricmc.fabric-loom-remap` on 1.21.11, `net.fabricmc.fabric-loom` on 26.x | fabric-example-mod branches through `gh api`; Fabric meta [WF] |
| NeoForge Game Tests | 1.21.5 and later, including 1.21.11 and 26.1: data-driven (`TEST_FUNCTION`, `TEST_ENVIRONMENT`, `test_instance` JSON, `RegisterGameTestsEvent`). The `@GameTest`/`@GameTestHolder` annotation API is documented for 1.21.2 to 1.21.4 | docs.neoforged.net 1.21.11 and 26.1 gametest pages [WF] |
| Worldgen 1.21.5 to 1.21.11 | `dimension_type`: `cloud_height` (1.21.6), then `attributes` and `timelines` (1.21.11); `ultrawarm`, `natural`, `piglin_safe`, `bed_works`, `respawn_anchor_works`, `has_raids` and `cloud_height` moved to environment attributes; `effects` became `skybox` and `cardinal_light`; `fixed_time` became `has_fixed_time`. Biome: `attributes` added, and the fog, sky, water fog, particle, sound and music fields left `effects` | minecraft.wiki history sections [WF]. The build confirms against `data/minecraft/` inside the official 1.21.11 jar |
| Velocity | 4.3.1 supports 26.3 and needs Java 25 | Velocity `build.gradle.kts:15`, docs.papermc.io |
| EssentialsX | 2.22.0 supports 26.1.2 and 1.21.11. No release supports 26.3 yet (only the `2.x` branch, PR #6624) | EssentialsX releases and README |

## Project Structure

Files that change, by task:

```text
T1 datapack, resource-pack     SKILL.md, references, validate-*.sh, drift patterns 98-127
T2 testing                     SKILL.md, references/test-layouts.md, validate-test-layout.sh, drift 146-150
T3 multiloader                 SKILL.md, references, check-version-sanity.sh, valid-26.2 fixture, drift 55-77 and 338-344
T4 world-generation            SKILL.md, references/legacy-1.21-worldgen-json.md (rewritten for 1.21.11), validate-worldgen-json.sh
T5 fabric                      SKILL.md, references/fabric-api.md, check-build.sh, drift 275-310
T6 plugin-dev, server-admin, essentials-ops, worldedit-ops, ci-release, commands-scripting
                               SKILL.md, references, validate-plugin-layout.sh, drift 81-95, 130-142, 167-170
T7 neoforge                    SKILL.md, references, check-build.sh, drift 175-260
T8 repo docs and guard         AGENTS.md, README.md, plugin README, plugin and marketplace descriptions, check-version-drift.mjs guard
```

Each task edits `.agents/skills/` only, then runs `bun run sync:skills`. Each task changes the drift patterns that pin the text it rewrites, in the same commit.

## Code Style

See `AGENTS.md`. Example description:

```yaml
description: Create, edit, and debug vanilla Minecraft 1.21.11, 26.1.2 and 26.3 datapacks, including functions, advancements, recipes, loot tables, predicates, tags, and pack metadata. Use when the deliverable is a datapack file tree without Java or loader APIs.
```

## Testing Strategy

- Static: `bun run check` passes after each task. It includes the version drift check, the validator fixtures and the audit.
- A validator that now warns on an unsupported version gets a fixture case for 26.2 (warn) and one listed version (pass) in `scripts/run-skill-validator-fixtures.sh`.
- Search, after T8: `rg -n '26\.x|1\.21\.x' .agents/skills/*/SKILL.md AGENTS.md README.md` prints only lines that the Wording rules allow, and the T8 guard fails on a description that says "26.x" or "1.21.x".
- Primary-source check: each task's decision comment lists every version, coordinate or format it wrote, with its raw source.
- No Minecraft, Gradle or Paper command runs. Reading files inside a downloaded official jar is allowed; running it is not.

## Boundaries

- Always: keep NeoForge 1.21.1; keep Forge 1.20.1 as it is; keep format history tables; verify each changed claim for the exact version.
- Ask first (defer to the run's decision list): dropping NeoForge 1.21.1; dropping any other version the skills now name as supported; a version bump of this repo.
- Never: add 26.2 as a target; add an unstable or snapshot Minecraft version as a target; hand-edit mirrors; run Minecraft, Gradle or Paper.

## Success Criteria

1. No SKILL.md `description` says "26.x", "1.21.x", "current" or "legacy". Each names its exact versions.
2. `AGENTS.md` Skill standards names 1.21.11, 26.1.2 and 26.3, Java 25 and Java 21, and keeps Forge 1.20.1 on Java 17 with ForgeGradle 6.
3. No example targets 26.2 or a 1.21 patch other than 1.21.11 (and 1.21.1 in NeoForge). History rows and migration notes stay.
4. `minecraft-datapack` and `minecraft-resource-pack` have a 26.1.2 pack metadata example.
5. The MockBukkit, Architectury and Fabric coordinates match the Verified facts table, each confirmed from a raw source.
6. The legacy worldgen reference targets 1.21.11 and matches the vanilla 1.21.11 data.
7. Validators warn on 26.2 and on a 1.21 patch outside the list, with fixture cases.
8. `bun run check` exits 0, and the drift check has a guard against loose descriptions.

## Out of Scope (Deferred)

- Dropping NeoForge 1.21.1 (ADR-0002 keeps it; the user decides).
- Adding Minecraft 26.4 or any version after 26.3.
- Rewriting `docs/skill-audit-*.md` (dated records).

## Open Questions

None. The NeoForge 1.21.1 question is deferred to the user.
