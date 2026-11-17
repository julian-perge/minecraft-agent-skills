---
name: minecraft-fabric
description: "Create, modify, or debug Fabric mods for current Minecraft 26.x and legacy 1.21.x. Use for Fabric gameplay code, registries, events, mixins, assets and data generation; not for NeoForge or Forge projects. Use minecraft-multiloader when one codebase must target NeoForge and Fabric."
---

# Minecraft Fabric Skill

## Overview

Supported platform:

| Platform | MC Version | Java | Build System |
|---|---|---|---|
| **Fabric** | 26.x current; 1.21.11 examples retained | Java 25 current; Java 21 on 1.21.x | Gradle + Fabric Loom |

Always confirm the Minecraft version and the mappings from `gradle.properties`
or `build.gradle` before you write mod code.

Minecraft 26.1 introduced Java 25 and unobfuscated game executables. For 26.x
projects, start from the current Fabric generator or example mod and preserve
its build layout. Fabric 26.x uses the non-remapping Loom path and official
names. Do not copy the 1.21.11 Yarn mappings, Loom plugin, remapping task or
Java 21 snippets of this skill into a 26.x project. `references/fabric-api.md`
covers legacy 1.21.11 examples only.

### Routing Boundaries

- `Use when`: the task is Fabric Java/Kotlin mod code, registry or event work, mixins, networking, datagen wiring, or Fabric APIs.
- `Do not use when`: the project uses NeoForge (`minecraft-neoforge`) or Forge 1.20.1 (`minecraft-forge`).
- `Do not use when`: one codebase must target NeoForge and Fabric (`minecraft-multiloader`).
- `Do not use when`: the task is command-only vanilla logic (`minecraft-commands-scripting`) or pure datapacks (`minecraft-datapack`).
- `Do not use when`: the task targets Paper/Bukkit plugins (`minecraft-plugin-dev`).

---

## 1. Identifying the Platform

```bash
# Fabric project signature
grep -r "fabric" gradle.properties build.gradle settings.gradle 2>/dev/null | head -5

# Read mod ID and version
cat gradle.properties
```

Key files:

- `src/main/resources/fabric.mod.json`
- A class that implements `ModInitializer`, registered as the `main` entrypoint

`scripts/check-build.sh` checks the Fabric signature, the Java version for the
project's Minecraft version and the key files, then runs `./gradlew build`.

---

## 2. Build & Test Commands

```bash
# Build the mod jar
./gradlew build

# Run the Minecraft client to test
./gradlew runClient

# Run a dedicated server to test
./gradlew runServer

# Remove this project's generated build outputs before a fresh rebuild
./gradlew clean

# Only if the project applies a dependency-updates plugin
./gradlew dependencyUpdates
```

For data generation, use the task that the project configures.

`./gradlew build` runs the project's configured build tasks. Candidate mod jars
are usually under `build/libs/`, but task names and file names are
project-specific. Check the build result, then identify the intended
distributable before you publish it.

---

## 3. Project Layout (Fabric)

```
src/
  main/
    java/<groupId>/<modid>/
      MyMod.java               <- implements ModInitializer
      client/
        MyModClient.java       <- implements ClientModInitializer
      block/
      item/
      mixin/                   <- Mixin classes
    resources/
      fabric.mod.json
      <modid>.mixins.json      <- mixin configuration
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
- Keep rendering classes in a client-only initializer, the class that
  implements `ClientModInitializer` and is registered as the `client`
  entrypoint. A logical-side check alone does not prevent dedicated servers
  from loading client classes.

### Registries

Everything in Minecraft lives in a registry. Always register objects. Do not
construct them at field initializer time outside a registry call. Use the
registry constants for the project's mappings:

| Type | Fabric 26.x official names | Fabric / Yarn mappings (1.21.11) |
|------|----------------------------|----------------------------------|
| Blocks | `BuiltInRegistries.BLOCK` | `Registries.BLOCK` |
| Items | `BuiltInRegistries.ITEM` | `Registries.ITEM` |
| Entity types | `BuiltInRegistries.ENTITY_TYPE` | `Registries.ENTITY_TYPE` |
| Block entity types | `BuiltInRegistries.BLOCK_ENTITY_TYPE` | `Registries.BLOCK_ENTITY_TYPE` |
| Menu / screen-handler types | `BuiltInRegistries.MENU` | `Registries.SCREEN_HANDLER` |
| Sound events | `BuiltInRegistries.SOUND_EVENT` | `Registries.SOUND_EVENT` |
| Biomes | `Registries.BIOME` registry keys | `RegistryKeys.BIOME` registry keys |

Do not copy older `Registry.BLOCK` / `Registry.ITEM` constants into 1.21.x
code. Those names are stale for the examples in this skill.

### Identifier

Every registry entry needs a namespaced ID:

```java
// 26.x official names
Identifier id = Identifier.fromNamespaceAndPath("mymod", "my_block");

// Legacy Fabric with Yarn mappings
Identifier id = Identifier.of("mymod", "my_block");
```

---

## 5. Fabric Quick Patterns

Match the project's Minecraft version and mappings in the
[Fabric documentation](https://docs.fabricmc.net/develop/).
`references/fabric-api.md` contains legacy 1.21.x / Java 21 patterns only.

```java
// Main mod class
public class MyMod implements ModInitializer {
    public static final String MOD_ID = "mymod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        ModBlocks.initialize();
        ModItems.register();
    }
}
```

```java
// Fabric 26.x with official Mojang mappings. Create the key before the object
// so its properties receive the required id during construction.
public final class ModBlocks {
    public static final ResourceKey<Block> MY_BLOCK_KEY = ResourceKey.create(
        Registries.BLOCK,
        Identifier.fromNamespaceAndPath(MyMod.MOD_ID, "my_block")
    );

    public static final Block MY_BLOCK = register(
        MY_BLOCK_KEY,
        Block::new,
        BlockBehaviour.Properties.of()
            .mapColor(MapColor.STONE)
            .strength(1.5f, 6.0f)
            .sound(SoundType.STONE)
            .requiresCorrectToolForDrops()
    );

    private static Block register(ResourceKey<Block> key,
            Function<BlockBehaviour.Properties, Block> factory,
            BlockBehaviour.Properties properties) {
        Block block = factory.apply(properties.setId(key));
        return Registry.register(BuiltInRegistries.BLOCK, key, block);
    }

    public static void initialize() {}
}
```

Call `ModBlocks.initialize()` from the Fabric initializer. The Yarn-named
1.21.11 examples remain in `references/fabric-api.md`. Do not mix those names
with this 26.x pattern.

---

## 6. JSON Assets

Always provide matching JSON assets for every registered block and item.
Generate or update these files alongside the Java code. Use the paths in the
project layout and the checklist below. For the vanilla JSON formats, see the
[Minecraft Wiki data values](https://minecraft.wiki/w/Java_Edition_data_values).

---

## 7. Data Generation

Use the project's configured data providers. Keep Fabric projects on their own
datagen entrypoints and Gradle tasks, then inspect the generated files. Check
the [Fabric documentation](https://docs.fabricmc.net/develop/) for the
project's exact version before you wire providers.

---

## 8. Common Tasks Checklist

When adding a **new block**:

- [ ] `Block` subclass (or use vanilla Block with properties)
- [ ] Register the block in `BuiltInRegistries.BLOCK` (26.x) or `Registries.BLOCK` (Yarn)
- [ ] Register its `BlockItem` in `BuiltInRegistries.ITEM` (26.x) or `Registries.ITEM` (Yarn)
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
- [ ] Register in `ModItems` with `BuiltInRegistries.ITEM` (26.x) or `Registries.ITEM` (Yarn)
- [ ] Item model JSON
- [ ] 1.21.4+ item definition -> `assets/<modid>/items/<name>.json`
- [ ] Texture PNG
- [ ] Language entry
- [ ] Creative tab entry with `ItemGroupEvents`
- [ ] Recipe JSON if craftable (`data/<modid>/recipe/` for 26.x; check the
      exact version's data format before you edit a 1.21.x project)

When adding a **new entity**:

- [ ] Entity class (extends a base such as `Mob`, `Animal` or `TamableAnimal`)
- [ ] `EntityType` registration
- [ ] Renderer and model classes loaded only on the physical client
- [ ] Register the renderer with `EntityRendererRegistry`; register model
      layers separately
- [ ] Spawn egg item (optional)
- [ ] Natural spawns with Fabric API `BiomeModifications.addSpawn`
- [ ] Spawn placement on the `FabricEntityTypeBuilder.Mob` builder:
      `spawnPlacement` on 26.x, `spawnRestriction` on 1.21.11

---

## 9. References

- Fabric API patterns and mixin guide (1.21.11): `./references/fabric-api.md`
- Fabric developer docs: https://docs.fabricmc.net/develop/
- Minecraft Wiki (data formats): https://minecraft.wiki/w/Java_Edition_data_values
