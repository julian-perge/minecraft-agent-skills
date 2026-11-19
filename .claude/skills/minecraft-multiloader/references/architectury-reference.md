# Architectury Version And Layout Reference

Use this file together with `SKILL.md` when you need the quick alignment rules.

## Shared Code Boundaries

- `common/` may use vanilla Minecraft classes and Architectury APIs only
- `fabric/` owns Fabric loader APIs, Fabric entrypoints, and Fabric-only hooks
- `neoforge/` owns NeoForge loader APIs, `@Mod` entrypoints, NeoForge events, and datagen runs
- A loader-neutral Mixin may be packaged from `common/` when both generated
  platform resource/configuration paths include it. Keep Mixins with loader API
  imports, platform-only targets, or platform-only side rules in that platform.

## Version Alignment Rules

### Minecraft 1.21.11

- Keep `minecraft_version=1.21.11` across the whole repo
- Keep `neoforge_version` in the `21.11.x` family
- Keep Fabric API on the `+1.21.11` suffix
- The upstream `1.21.11` branch builds Architectury API 19.0.1 with the
  `dev.architectury.loom` plugin `1.13-SNAPSHOT` and Mojang mappings

### Minecraft 26.1.2 and 26.3

- Keep `neoforge_version` in the `26.1.` family for 26.1.2 and the `26.3.`
  family for 26.3, and keep Fabric API on the `+26.1.2` or `+26.3` suffix
- The upstream `26.1` branch builds Architectury API 20.1.18 for 26.1.2. The
  upstream `26.3` branch builds Architectury API 22.0.6 for 26.3. Both apply the
  `dev.architectury.loom-no-remap` plugin `1.17-SNAPSHOT` and have no mappings line

- Use the official [Architectury Template Generator](https://generate.architectury.dev/)
  only when it offers the exact target release with Fabric and NeoForge. Preserve
  its Minecraft, Java 25, Loom, Fabric API, NeoForge, and Architectury pins as
  one set.
- If the generator lacks that target, use a known-working project on the exact
  line as the starting point. Inspect its Gradle files and resolve its build
  before changing pins; do not manufacture a current matrix from a 1.21.11
  example or an older template download.

For 1.21.11, 26.1.2 and 26.3, keep `enabled_platforms=fabric,neoforge`, avoid snapshot-only
pins unless intentionally testing a prerelease, and use the split Architectury
artifacts (`architectury`, `architectury-fabric`, and `architectury-neoforge`).
The upstream branches pin the Architectury Loom plugin as a `-SNAPSHOT`
version. The sanity checker warns on that pin, so `--strict` fails on a
project that keeps it.

## Sanity Check Workflow

```bash
./scripts/check-version-sanity.sh --root .
./scripts/check-version-sanity.sh --root . --strict
```

The checker performs a static preflight and validates:

- required keys exist in `gradle.properties`
- `enabled_platforms` contains both `fabric` and `neoforge`
- snapshot versions are flagged
- `minecraft_version` is 1.21.11, 26.1.2 or 26.3. Any other version, 26.2
  included, gives a warning
- NeoForge version family matches the Minecraft release line

It does not download or resolve dependencies, compile the project, or establish
that a specific Architectury, Fabric API, NeoForge, and Loom combination is
compatible. Use the project build and both loader smoke tests for that evidence.

## Release Checklist

- build both jars with `./gradlew build`
- smoke test both `:fabric:runClient` and `:neoforge:runClient`
- inspect the actual Fabric and NeoForge JAR names under each `build/libs/`
  directory; archive-name conventions come from the selected project template
- keep one changelog entry for shared logic and call out loader-specific fixes only when behavior differs
