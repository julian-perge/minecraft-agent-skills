---
name: minecraft-neoforge
description: "Create, modify, debug, or migrate NeoForge mods for Minecraft 1.21.1, 1.21.11, 26.1.2 and 26.3. Use for NeoForge gameplay code, assets, lookups and checkpoints; use minecraft-multiloader when one codebase must target NeoForge and Fabric."
---

# Minecraft NeoForge Skill

## Overview

Supported Minecraft versions: 1.21.1, 1.21.11, 26.1.2 and 26.3.

| Platform | MC Version | Java | Build System |
|---|---|---|---|
| **NeoForge** | 26.x current; 1.21.11 examples retained | Java 25 current; Java 21 on 1.21.x | Gradle + ModDevGradle |

`references/versions.md` lists the Java version, mappings, NeoForge version
line and MDK source for each supported version. Use a cell only when it has a
source. A cell marked `unverified` is not a fact.

Always confirm the Minecraft version and the NeoForge version from
`gradle.properties` or `build.gradle` before you write mod code.

Minecraft 26.1 introduced Java 25 and unobfuscated game executables. For 26.x
projects, start from the current NeoForge generator and preserve its build
layout. Do not copy the 1.21.11 dependency pins or Java 21 snippets of this
skill into a 26.x project. `references/neoforge-api.md` covers legacy 1.21.11
examples only.

### Routing Boundaries

- `Use when`: the task is NeoForge Java/Kotlin mod code, registry or event work, networking, datagen wiring, or NeoForge APIs.
- `Do not use when`: the project uses Fabric (`minecraft-fabric`) or Forge 1.20.1 (`minecraft-forge`).
- `Do not use when`: one codebase must target NeoForge and Fabric (`minecraft-multiloader`).
- `Do not use when`: the task is command-only vanilla logic (`minecraft-commands-scripting`) or pure datapacks (`minecraft-datapack`).
- `Do not use when`: the task targets Paper/Bukkit plugins (`minecraft-plugin-dev`).

## Scope

- NeoForge only. If a request needs Fabric, Forge or a multiloader setup, say
  so and stop.
- 26.3 is the default for new mods.
- In an existing repo, the version is whatever `gradle.properties` says. Never
  change it, or any dependency version, unless asked.
- The repo's `AGENTS.md` and `CLAUDE.md` take precedence over this skill.

## Looking Things Up

Never write an API name, method signature, registry name, event name or
version number from memory. Check it first, in this order:

1. If the `minecraft-modding` MCP server (adhi-jp) is connected, check against
   the project's exact Minecraft version: `check-symbol-exists` or
   `batch-symbol-exists` before using a class or method, `get-class-source` and
   `get-class-members` to read vanilla code, `get-registry-data` for registry
   ids, `validate-access-transformer` after editing an access transformer, and
   `analyze-mod-jar` or `search-mod-source` for a dependency's API.
   The `target` decides whether a class is found. NeoForge and FML classes are
   not in the vanilla artifact, and `workspace` targets did not find them
   either, because the patched jars in `build/moddev/artifacts` do not contain
   them. Before a NeoForge or FML read, run one of this skill's scripts from
   the mod repo root to get the two jar paths:

   ```bash
   ./gradlew -q --init-script <skill dir>/scripts/neoforge-jars.init.gradle printNeoForgeJars
   bash <skill dir>/scripts/neoforge-jars.sh [--neo-version <version>]
   ```

   The init script asks Gradle. When several projects apply NeoForge, run
   `:<project>:printNeoForgeJars`. The `.sh` script needs no Gradle, but the
   jars must already be in the Gradle cache. Use only the
   `neoforge_universal_jar=` and `fml_loader_jar=` lines, because a build
   script can print its own lines. If both scripts fail, say which NeoForge or
   FML lookup could not be verified. Both were checked on 1.21.1, 1.21.11,
   26.1.2 and 26.3.

   | To read | Target |
   |---|---|
   | Vanilla | `{kind: version, value: <mc version>}` |
   | NeoForge classes, members and source | `{kind: jar, value: <neoforge_universal_jar>}` |
   | FML, such as `ModList` | `{kind: jar, value: <fml_loader_jar>}` |
   | AE2 and other addons | `jar` target on the addon's jar under `~/.gradle/caches/modules-2` |

   Pass explicit versions. `versionFromProject` fails with
   `ERR_DEPENDENCY_VERSION_UNRESOLVED` when several versions of the artifact
   are cached, and it reads only keys like `neoforge_version`, never
   `neo_version`. A repo can carry both keys for that reason.
2. The NeoForge docs at `https://docs.neoforged.net` with the matching version
   selected, and the NeoForge changelog for that version.
3. A local clone of the upstream repo, if one exists, especially for addon
   APIs such as AE2.
4. This skill's references. `references/neoforge-api.md` is for 1.21.x only.
   For 26.x, use the sections labelled 26.x in `references/common-patterns.md`.

Without the MCP server, use the docs and the changelog. If a lookup fails and
the answer still matters, say what could not be verified instead of guessing.

## Checkpoints

Work in small slices and stop at each checkpoint. Do not chain slices together
without approval.

1. **Orient.** Read `gradle.properties`, the build script,
   `neoforge.mods.toml`, and the repo's `AGENTS.md`, `DEVELOPMENT.md` and
   `justfile` if present. Follow the repo's own
   conventions over this skill's.
2. **Plan, then stop.** Before writing code, give a short plan: what changes,
   which files, which existing classes are reused, how it will be verified,
   and any open question. Wait for approval.
3. **Implement one slice.** One feature or one coherent part of a feature,
   never the whole backlog.
4. **Verify the slice** (see below), then **stop and report**: what changed,
   what was verified and how, and what was not verified. Propose the next
   slice instead of starting it.

Always ask before:

- adding, removing or upgrading a dependency, or editing `build.gradle`,
  `settings.gradle` or `gradle.properties`;
- deleting or renaming files, registry ids or config keys, because renames
  break existing worlds and configs;
- changing saved-data, attachment or data-component formats that existing
  worlds already contain;
- running `runClient` or `runServer`, which open long-running processes;
- anything the plan did not cover.

## Verification

Use the repo's `justfile` recipes when they exist. Otherwise call Gradle
directly.

| After | Run |
|---|---|
| Any Java change | `./gradlew build` (compiles and runs unit tests) |
| Gameplay logic: blocks, machines, recipes, entities, persistence | `./gradlew runGameTestServer`, plus each variant the repo's CI runs (for example optional-dependency flags) |
| Datagen providers changed | The repo's datagen task (`runData` or `runClientData`), then inspect the diff in the generated resources |
| Access transformer changed | `validate-access-transformer` through the MCP server, then a build |

Run these once at the end of a slice, not after every edit. If the repo's
`justfile` has `check` or `lint` recipes, use them for the build and GameTest
rows.

Report failures with the actual error output. A slice that adds gameplay logic
without a GameTest needs a stated reason.

Rules that apply to every slice:

- Server-authoritative logic. Validate every client packet.
- Client-only classes live in client packages and never load on a dedicated
  server.
- Every registered block or item gets its model, texture, language entry, loot
  table or recipe in the same slice. No missing textures or raw translation
  keys.
- Item state uses data components. World and entity state uses saved data or
  data attachments.

## Starting a New Mod

For a new mod from an empty folder, copy `references/new-mod-prompt.md` into
the new folder as `PROMPT.md`. Fill in its placeholders with the user. Do not
invent them. The checkpoints above still apply: the design bible is the first
checkpoint, then each MVP slice.

---

## 1. Identifying the Platform

```bash
# NeoForge project signature
grep -r "net.neoforged" gradle.properties build.gradle build.gradle.kts settings.gradle settings.gradle.kts 2>/dev/null | head -5

# Read mod ID and version
cat gradle.properties
```

Key files:

- `src/main/resources/META-INF/neoforge.mods.toml`
- A main class annotated with `@Mod`

`scripts/check-build.sh` checks the NeoForge signature, the Java version for
the project's Minecraft version and the key files, then runs `./gradlew build`.

---

## 2. Build & Test Commands

```bash
# Build the mod jar
./gradlew build

# Run the Minecraft client to test (ask first, see Checkpoints)
./gradlew runClient

# Run a dedicated server to test (ask first, see Checkpoints)
./gradlew runServer

# NeoForge Game Tests (when the project configures this run)
./gradlew runGameTestServer

# Current NeoForge MDK data generation
./gradlew runClientData

# Remove this project's generated build outputs before a fresh rebuild
./gradlew clean

# Only if the project applies a dependency-updates plugin
./gradlew dependencyUpdates
```

`./gradlew build` runs the project's configured build tasks. Candidate mod jars
are usually under `build/libs/`, but task names and file names are
project-specific. Check the build result, then identify the intended
distributable before you publish it.

---

## 3. Core Concepts Cheatsheet

### Sides

- **Physical client**: the game client JAR (has rendering code)
- **Physical server**: the dedicated server JAR (no rendering)
- **Logical client**: the client thread (handles rendering, input)
- **Logical server**: the server thread (handles world simulation)
- Keep rendering classes in a client-only listener or a class that loads only
  on the physical client. A logical-side check alone does not prevent
  dedicated servers from loading client classes. Follow the
  [physical-side guidance](https://docs.neoforged.net/docs/1.21.11/concepts/sides/)
  for the project's version.

### Registries

Everything in Minecraft lives in a registry. Always register objects. Do not
construct them at field initializer time outside a registry call. NeoForge uses
Mojang names for the registry constants:

| Type | NeoForge / Mojang mappings |
|------|-----------------------------|
| Blocks | `BuiltInRegistries.BLOCK` |
| Items | `BuiltInRegistries.ITEM` |
| Entity types | `BuiltInRegistries.ENTITY_TYPE` |
| Block entity types | `BuiltInRegistries.BLOCK_ENTITY_TYPE` |
| Menu types | `BuiltInRegistries.MENU` |
| Sound events | `BuiltInRegistries.SOUND_EVENT` |
| Biomes | `Registries.BIOME` registry keys |

Do not copy older `Registry.BLOCK` / `Registry.ITEM` constants into 1.21.x
code. Those names are stale for the examples in this skill.

### ResourceLocation / Identifier

Every registry entry needs a namespaced ID:

```java
// 1.21.11 and 26.x
Identifier id = Identifier.fromNamespaceAndPath("mymod", "my_block");
```

1.21.1 uses `ResourceLocation`. 1.21.11 renamed it to `Identifier`, and 26.x
keeps `Identifier`. Keep the class name that the project's version uses.

---

## 4. NeoForge Quick Patterns

For 26.x, use the explicitly labelled 26.x sections in
`references/common-patterns.md` and select the project's exact version in the
[NeoForge documentation](https://docs.neoforged.net/docs/gettingstarted/).
`references/neoforge-api.md` contains legacy 1.21.x / Java 21 patterns only.
Do not copy its dependency pins into a 26.x project.

```java
// Main mod class
@Mod(MyMod.MOD_ID)
public class MyMod {
    public static final String MOD_ID = "mymod";

    public MyMod(IEventBus modEventBus) {
        ModBlocks.BLOCKS.register(modEventBus);
        ModItems.ITEMS.register(modEventBus);
        modEventBus.addListener(this::commonSetup);
    }

    private void commonSetup(FMLCommonSetupEvent event) {
        // runs after all mods are registered
    }
}
```

```java
// Block registration
public class ModBlocks {
    public static final DeferredRegister.Blocks BLOCKS =
        DeferredRegister.createBlocks(MyMod.MOD_ID);

    public static final DeferredBlock<Block> MY_BLOCK =
        BLOCKS.registerSimpleBlock("my_block", () ->
            BlockBehaviour.Properties.of()
                .mapColor(MapColor.STONE)
                .strength(1.5f, 6.0f)
                .sound(SoundType.STONE)
                .requiresCorrectToolForDrops());
}
```

---

## 5. JSON Asset Templates

Always provide matching JSON assets for every registered block and item.
Generate or update these files alongside the Java code.

See `references/common-patterns.md` for full JSON templates for:

- Blockstate JSON
- Block model JSON (cube, slab, stairs, fence, door, trapdoor, etc.)
- Item model JSON
- Loot table JSON
- Recipe JSON (crafting_shaped, crafting_shapeless, smelting, blasting, stonecutting)
- Language file (`en_us.json`) entries
- Tag JSON

---

## 6. Data Generation

Use the project's configured data providers. Current NeoForge uses
`GatherDataEvent.Client` / `.Server` and `event.createProvider(...)`. The MDK
normally generates both asset and data providers with `runClientData`. See the
[version-matched resource guide](https://docs.neoforged.net/docs/resources/)
before you wire providers. Keep older projects on their own datagen tasks, then
inspect the generated files.

---

## 7. References

- NeoForge API patterns and event system (1.21.11): `./references/neoforge-api.md`
- Blocks, items, recipes, commands, datagen: `./references/common-patterns.md`
- Version table with sources: `./references/versions.md`
- Project layout and checklists for new blocks, items and entities: `./references/project-layout.md`
- Build prompt for a new mod: `./references/new-mod-prompt.md`
- NeoForge official docs: https://docs.neoforged.net/
- Minecraft Wiki (data formats): https://minecraft.wiki/w/Java_Edition_data_values
