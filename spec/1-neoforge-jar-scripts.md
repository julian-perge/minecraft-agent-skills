Source issue: https://github.com/julian-perge/minecraft-agent-skills/issues/1

# Spec: neoforge-jar-scripts (module of `spec/1-capability-map.md`) - V1

Depends on `loader-skills-split` (the `minecraft-neoforge` skill must exist). Commands, structure and code style: see `AGENTS.md`.

## Objective

Make the `minecraft-modding` MCP find NeoForge and FML classes in any NeoForge mod repo, with one script run by the agent and no edit to the mod repo.

Problem (evidence, checked 2026-11-17 in the ModularPlanters session, MCP 8.2.0): a `workspace` target does not find NeoForge classes, because the patched jars in `build/moddev/artifacts` hold no `net/neoforged` classes. A `dependency` target with `versionFromProject` fails with "no binaryJarPath". FML classes are in the separate `fancymodloader` loader jar. The MCP changelog has no fix.

Fix: two scripts in `minecraft-neoforge/scripts/` print the exact NeoForge universal jar and the FML loader jar. The skill tells the agent to run one script and then pass `{kind: jar, value: <path>}` targets. The module also drafts an upstream issue for `adhi-jp/minecraft-modding-mcp`. Julian decides whether to post it.

## Tech Stack

- `neoforge-jars.init.gradle`: a Gradle init script (Groovy). Exact result, needs Gradle and a configured project.
- `neoforge-jars.sh`: Bash, no Gradle. Fast fallback that searches the Gradle cache. macOS and Linux only.

## Commands

For the agent, run in a mod repo (not in this repo):

```bash
./gradlew -q --init-script <skill dir>/scripts/neoforge-jars.init.gradle printNeoForgeJars
bash <skill dir>/scripts/neoforge-jars.sh [--neo-version <version>]
```

For this repo:

```bash
bun run check                                  # npm run check as fallback
bash -n .agents/skills/minecraft-neoforge/scripts/neoforge-jars.sh
```

No Gradle command runs in this repo (`AGENTS.md`). The init script is validated in the mod repos only.

## Project Structure

```text
.agents/skills/minecraft-neoforge/
  SKILL.md                            lookup step rewritten to use the scripts
  scripts/neoforge-jars.init.gradle   NEW
  scripts/neoforge-jars.sh            NEW
scripts/run-skill-validator-fixtures.sh   fixture cases for the .sh fallback (guess: confirm the case format when building)
tests/fixtures/validators/...             fake Gradle cache and gradle.properties trees
scripts/check-version-drift.mjs           required patterns: the script names appear in SKILL.md
~/tmp/2026-11-17-neoforge-jar-mcp-issue/issue-draft.md   NEW: the issue draft, outside this repo for now
```

The skill refers to the scripts by a path relative to its own folder, because `audit-skills.mjs` rejects `.agents/skills/<skill>/scripts/...` paths in skill text.

## Output contract

Both scripts print the same lines to stdout and nothing else. Errors go to stderr with a non-zero exit code.

```text
minecraft_version=26.3
neoforge_version=26.3.0.101
neoforge_universal_jar=/Users/me/.gradle/caches/modules-2/files-2.1/net.neoforged/neoforge/26.3.0.101/<hash>/neoforge-26.3.0.101-universal.jar
fml_loader_jar=/Users/me/.gradle/caches/modules-2/files-2.1/net.neoforged.fancymodloader/loader/<version>/<hash>/loader-<version>.jar
```

Rules for the `.sh` fallback:

- It reads the NeoForge version from `gradle.properties` (`neo_version`, then `neoforge_version`), then from a `version = '...'` line inside the `neoForge` block of `build.gradle` or `build.gradle.kts`. `--neo-version` overrides both.
- It searches `${GRADLE_USER_HOME:-~/.gradle}/caches/modules-2/files-2.1/net.neoforged/neoforge/<version>/*/neoforge-<version>-universal.jar`.
- It reads the FML loader version from the `fancymodloader:loader` dependency in `neoforge-<version>.pom` in the same cache folder.
- It fails with a clear message when the version is unknown, when several cached versions match and none is chosen, or when a jar is not in the cache.

## Code Style

Bash: `set -euo pipefail`, same helper style as the existing `check-build.sh`. Each comment is a full sentence that explains why. Plain ASCII punctuation.

```bash
read_gradle_property() {
    local key="$1"
    [[ -f gradle.properties ]] && sed -n "s/^${key}=//p" gradle.properties | head -1
}
```

## Testing Strategy

| Level | What | Where |
|---|---|---|
| Static, in this repo | `bash -n`, `bun run check`, drift patterns for the script names | `bun run check` |
| Fixture, in this repo | `.sh` fallback against a fake `GRADLE_USER_HOME` tree and fake `gradle.properties` | `scripts/run-skill-validator-fixtures.sh` |
| Runtime, in the mod repos | Both scripts against the five mod repos and against copies of the SophisticatedBackpacks branches `1.21.x`, `1.21.11` and `26.1`, compared to the `jar` targets that work today | by hand or by the build agent, outside this repo |

Fixture cases for the `.sh` script: version from `neo_version`; version from `neoforge_version`; version from `build.gradle`; two cached versions with no choice (non-zero); missing cache (non-zero, message names the version); `--neo-version` override.

The init script has no fixture: it needs Gradle. Its only test is the runtime level.

## Boundaries

- Always: print the contract lines only on stdout; fail loudly instead of guessing a jar; keep both scripts inside the skill folder.
- Ask first: any edit in a mod repo; running `./gradlew` in a mod repo for validation (it can download files and start a daemon); adding a dependency.
- Never run Gradle inside `~/git/P3pp3rF1y/SophisticatedBackpacks` or `~/git/adhi-jp/minecraft-modding-mcp`. They are read-only reference clones. Validate in a copy at `~/tmp/{YYYY-MM-DD}-sophisticated-backpacks-<branch>`.
- Never: post the upstream issue (Julian decides); add a Gradle task to a mod repo; run Gradle in this repo; edit the MCP; hand-edit mirrors.

## Success Criteria

1. Both scripts exist in `.agents/skills/minecraft-neoforge/scripts/` and in the three mirrors after `sync:skills`. The skill invokes the `.sh` with `bash`, so a lost executable bit does not matter.
2. In ModularPlanters (26.1.2), metalforge and landons_mod (26.3), the init script prints the contract lines, and its two jar paths equal the `jar` targets that work today.
3. In those three repos, the `.sh` output equals the init script output.
4. In MinecraftStructureInjector (the version sits in `build.gradle`) and macos_fixes (the version key is not in the first lines of `gradle.properties`), the `.sh` script finds the version or accepts `--neo-version`, and the init script prints the contract.
5. NeoForge 21.x and 26.1.2 on SophisticatedBackpacks copies: branch `1.21.x` (Minecraft 1.21.1, `neo_version=21.1.229`), branch `1.21.11` (`neo_version=21.11.24-beta`) and branch `26.1` (Minecraft 26.1.2, `neo_version=26.1.2.53-beta`). The init script prints the contract on each, and the `.sh` output equals it once Gradle has cached the jars. The `.sh` fixture case for 21.1.x passes. A version that was not validated is marked `unverified` in the skill. All three use the key `neo_version`.
6. The skill's lookup step says: run one script, then pass `{kind: jar, value: <path>}` for NeoForge and FML reads. When the script fails, the agent says which lookup it could not verify. The `jar` rows of the target table use the script output. The `dependency` row stays only if it is validated; otherwise it is removed.
7. The fixture cases above pass in `bun run check` and `npm run check`.
8. The issue draft is saved at `~/tmp/2026-11-17-neoforge-jar-mcp-issue/issue-draft.md`. It names the MCP version (8.2.0, commit `cab0169`), the date (2026-11-17), the three failures with their error text, the repro steps in a mod repo, the expected behavior and the workaround. Each claim about MCP behavior cites a file and line in `~/git/adhi-jp/minecraft-modding-mcp`. No command posts it.
9. `check-version-drift.mjs` requires both script names in `minecraft-neoforge/SKILL.md`.

## Out of Scope (Deferred)

- A fix inside the MCP, and posting the upstream issue.
- A Gradle task in each mod repo.
- Windows support for the `.sh` fallback. The init script is cross-platform.
- Equivalent scripts for Fabric and Forge. Their jars resolve through the existing `dependency` targets (unverified: no check was made for this module).
- The README MCP section: module `git-install-docs`.

## Open Questions

- Does the init script work? The mechanism is a guess: read the resolved `compileClasspath` and pick the NeoForge universal jar and the FML loader jar. ModDevGradle may expose only the patched jar there. If so, the init script reads the ModDevGradle artifact config (`neoforge-<version>-moddev-config.json` is in the cache) or the module metadata instead. Criterion 2 decides this at build time.
- The MCP source (`src/source/artifact-resolver.ts:305`) already names `build/moddev/artifacts/neoforge-21.11.38-beta-merged.jar` for 1.21.11. The build must read that code before it writes the draft, because it may show that the `workspace` failure differs per version.
- Settled: the first Gradle run on each SophisticatedBackpacks copy may download Minecraft and NeoForge files. The user approved this on 2026-11-17.
