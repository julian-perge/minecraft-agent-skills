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

# Run the Minecraft client to test
./gradlew runClient

# Run a dedicated server to test
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

## 3. Project Layout (NeoForge)

```
src/
  main/
    java/<groupId>/<modid>/
      MyMod.java               <- @Mod entry point
      block/
        ModBlocks.java         <- DeferredRegister.Blocks
        MyCustomBlock.java
      item/
        ModItems.java          <- DeferredRegister.Items
      entity/
        ModEntities.java       <- DeferredRegister.Entities
      menu/                    <- custom GUI containers
      recipe/
      worldgen/
      datagen/
        ModDataGen.java        <- GatherDataEvent handler
        providers/
    resources/
      META-INF/
        neoforge.mods.toml     <- mod metadata (renamed from mods.toml in NeoForge 1.20.5+)
      assets/<modid>/
        blockstates/           <- JSON blockstate definitions
        models/
          block/               <- block model JSON
          item/                <- item model JSON
        items/                 <- 1.21.4+ item-definition JSON
        textures/
          block/               <- 16x16 PNG textures
          item/
        lang/
          en_us.json           <- translation strings
      data/<modid>/
        recipe/                <- crafting recipe JSON (26.x)
        loot_table/
          blocks/              <- per-block loot table JSON
        tags/
          block/
          item/
```

---

## 4. Core Concepts Cheatsheet

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
// 26.x official names
Identifier id = Identifier.fromNamespaceAndPath("mymod", "my_block");
```

Older Mojang mappings use `ResourceLocation`. Keep the class name that the
project's version uses.

---

## 5. NeoForge Quick Patterns

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

## 6. JSON Asset Templates

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

## 7. Data Generation

Use the project's configured data providers. Current NeoForge uses
`GatherDataEvent.Client` / `.Server` and `event.createProvider(...)`. The MDK
normally generates both asset and data providers with `runClientData`. See the
[version-matched resource guide](https://docs.neoforged.net/docs/resources/)
before you wire providers. Keep older projects on their own datagen tasks, then
inspect the generated files.

---

## 8. Common Tasks Checklist

When adding a **new block**:

- [ ] `Block` subclass (or use vanilla Block with properties)
- [ ] Register in `ModBlocks.BLOCKS`
- [ ] Register `BlockItem` in `ModItems.ITEMS`
- [ ] Blockstate JSON -> `assets/<modid>/blockstates/<name>.json`
- [ ] Block model JSON -> `assets/<modid>/models/block/<name>.json`
- [ ] Item model JSON -> `assets/<modid>/models/item/<name>.json` (or inherits from block)
- [ ] 1.21.4+ item definition -> `assets/<modid>/items/<name>.json`, pointing at the item or block model
- [ ] Texture PNG -> `assets/<modid>/textures/block/<name>.png`
- [ ] Loot table JSON -> `data/<modid>/loot_table/blocks/<name>.json`
- [ ] Tags -> `data/<modid>/tags/block/` and `tags/item/`
- [ ] Language entry in `en_us.json`
- [ ] Vanilla mining and tool-tier tags when `requiresCorrectToolForDrops` is set

When adding a **new item**:

- [ ] `Item` subclass (or use `new Item(properties)`)
- [ ] Register in `ModItems.ITEMS`
- [ ] Item model JSON
- [ ] 1.21.4+ item definition -> `assets/<modid>/items/<name>.json`
- [ ] Texture PNG
- [ ] Language entry
- [ ] Creative tab entry with `BuildCreativeModeTabContentsEvent`
- [ ] Recipe JSON if craftable (`data/<modid>/recipe/` for 26.x; see the
      version-specific recipe reference before you edit a 1.21.x project)

When adding a **new entity**:

- [ ] Entity class (extends a base such as `Mob`, `Animal` or `TamableAnimal`)
- [ ] `EntityType` registration
- [ ] Renderer and model classes loaded only on the physical client
- [ ] Register the renderer with `EntityRenderersEvent.RegisterRenderers`;
      register model layers separately
- [ ] Spawn egg item (optional)
- [ ] Spawn rules / biome modifier

---

## 9. References

- NeoForge API patterns and event system (1.21.11): `./references/neoforge-api.md`
- Blocks, items, recipes, commands, datagen: `./references/common-patterns.md`
- Version table with sources: `./references/versions.md`
- NeoForge official docs: https://docs.neoforged.net/
- Minecraft Wiki (data formats): https://minecraft.wiki/w/Java_Edition_data_values
