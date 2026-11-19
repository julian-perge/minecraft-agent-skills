---
name: minecraft-forge
description: "Create, modify, or debug MinecraftForge mods for Minecraft 1.20.1 on Java 17 with ForgeGradle 6. Use for Forge 1.20.1 gameplay code, registries, events, assets and data generation; not for NeoForge or Fabric projects."
---

# Minecraft Forge 1.20.1 Skill

## Overview

Supported platform:

| Platform | MC Version | Java | Build System |
|---|---|---|---|
| **Forge** | 1.20.1 legacy lane | Java 17 | Gradle + ForgeGradle 6 |

This skill covers MinecraftForge `47.4.x` for Minecraft 1.20.1 only. Confirm
`minecraft_version=1.20.1` and the `net.minecraftforge:forge` dependency in
`gradle.properties` and `build.gradle` before you write mod code. If the
project uses another Minecraft version, do not apply these patterns.

Forge 1.20.1 is not NeoForge. Keep `mods.toml`, `net.minecraftforge.*`
imports, Java 17 and ForgeGradle 6 patterns. Read
`references/forge-1.20.1-api.md` before you edit a Forge 1.20.1 project.

### Routing Boundaries

- `Use when`: the task is Forge 1.20.1 Java mod code, registry or event work, networking, datagen wiring, or Forge APIs.
- `Do not use when`: the project uses NeoForge (`minecraft-neoforge`) or Fabric (`minecraft-fabric`).
- `Do not use when`: the task is command-only vanilla logic (`minecraft-commands-scripting`) or pure datapacks (`minecraft-datapack`).
- `Do not use when`: the task targets Paper/Bukkit plugins (`minecraft-plugin-dev`).

---

## 1. Identifying the Platform

```bash
# Forge 1.20.1 project signature
grep -r "net.minecraftforge" gradle.properties build.gradle settings.gradle 2>/dev/null | head -5

# Read mod ID and version
cat gradle.properties
```

Key files:

- `src/main/resources/META-INF/mods.toml`
- `net.minecraftforge:forge` dependency in `build.gradle`
- `id 'net.minecraftforge.gradle' version '[6.0,6.2)'` plugin
- `@Mod` main class that accepts `FMLJavaModLoadingContext`

`scripts/check-build.sh` checks the Forge signature, Java 17 and the key files,
then runs `./gradlew build`.

---

## 2. Build & Test Commands

```bash
# Build the mod jar
./gradlew build

# Run the Minecraft client to test
./gradlew runClient

# Run a dedicated server to test
./gradlew runServer

# Forge 1.20.1 data generation
./gradlew runData

# Remove this project's generated build outputs before a fresh rebuild
./gradlew clean
```

`./gradlew build` runs the project's configured build tasks. Candidate mod jars
are usually under `build/libs/`, but task names and file names are
project-specific. Check the build result, then identify the intended
distributable before you publish it.

---

## 3. Project Layout (Forge 1.20.1)

```
src/
  main/
    java/<groupId>/<modid>/
      MyMod.java               <- @Mod entry point
      block/
        ModBlocks.java         <- DeferredRegister<Block>
      item/
        ModItems.java          <- DeferredRegister<Item>
      datagen/
        ModDataGen.java        <- GatherDataEvent handler
    resources/
      META-INF/
        mods.toml              <- Forge metadata
      assets/<modid>/          <- client assets
      data/<modid>/            <- server data using 1.20.1 paths
  generated/
    resources/                 <- runData output, added to main resources
```

---

## 4. Core Concepts Cheatsheet

### Sides

- **Physical client**: the game client JAR (has rendering code)
- **Physical server**: the dedicated server JAR (no rendering)
- **Logical client**: the client thread (handles rendering, input)
- **Logical server**: the server thread (handles world simulation)
- Keep rendering classes in a client-only listener. A logical-side check alone
  does not prevent dedicated servers from loading client classes. Follow the
  [Forge 1.20.x sides guide](https://docs.minecraftforge.net/en/1.20.x/concepts/sides/).

### Registries

Everything in Minecraft lives in a registry. Always register objects through a
`DeferredRegister`. Do not construct them at field initializer time outside a
registry call.

| Type | Forge 1.20.1 registry |
|------|-----------------------|
| Blocks | `ForgeRegistries.BLOCKS` |
| Items | `ForgeRegistries.ITEMS` |
| Entity types | `ForgeRegistries.ENTITY_TYPES` |
| Block entity types | `ForgeRegistries.BLOCK_ENTITY_TYPES` |
| Menu types | `ForgeRegistries.MENU_TYPES` |
| Sound events | `ForgeRegistries.SOUND_EVENTS` |
| Creative mode tabs | `Registries.CREATIVE_MODE_TAB` |
| Biomes | `Registries.BIOME` registry keys |

Hold registered objects as `RegistryObject<T>`. Do not use `DeferredBlock`,
`DeferredItem` or `BuiltInRegistries.BLOCK` with Forge deferred registers.

### ResourceLocation

Every registry entry needs a namespaced ID. Minecraft 1.20.1 uses the public
constructor:

```java
ResourceLocation id = new ResourceLocation("mymod", "my_block");
```

Do not use `ResourceLocation.fromNamespaceAndPath` or `Identifier`. They do not
exist in Minecraft 1.20.1.

---

## 5. Forge 1.20.1 Quick Patterns

See full patterns in `references/forge-1.20.1-api.md`.

```java
// Main mod class
@Mod(MyMod.MOD_ID)
public class MyMod {
    public static final String MOD_ID = "mymod";

    public MyMod(FMLJavaModLoadingContext context) {
        IEventBus modEventBus = context.getModEventBus();
        ModBlocks.BLOCKS.register(modEventBus);
        ModItems.ITEMS.register(modEventBus);
        modEventBus.addListener(this::commonSetup);
        MinecraftForge.EVENT_BUS.register(this);
    }

    private void commonSetup(FMLCommonSetupEvent event) {
        // runs after registries are prepared
    }
}
```

```java
// Block registration
public class ModBlocks {
    public static final DeferredRegister<Block> BLOCKS =
        DeferredRegister.create(ForgeRegistries.BLOCKS, MyMod.MOD_ID);

    public static final RegistryObject<Block> MY_BLOCK =
        BLOCKS.register("my_block", () -> new Block(
            BlockBehaviour.Properties.of()
                .mapColor(MapColor.STONE)
                .strength(1.5f, 6.0f)
                .sound(SoundType.STONE)
                .requiresCorrectToolForDrops()));
}
```

---

## 6. JSON Assets

Always provide matching JSON assets for every registered block and item.
Generate or update these files alongside the Java code. Before you create loot
tables or tags, check the Forge 1.20.1 server-data directory names in
`references/forge-1.20.1-api.md`.

Prefer data generation for blockstates, models, recipes and tags. The provider
classes are in the "Data Generation And Paths" section of
`references/forge-1.20.1-api.md`. For the vanilla JSON formats, see the
[Minecraft Wiki data values](https://minecraft.wiki/w/Java_Edition_data_values).

---

## 7. Data Generation

Run Forge 1.20.1 data generation with `./gradlew runData`. Register
`GatherDataEvent` on the mod event bus with
`modEventBus.addListener(ModDataGen::gatherData)`. Use the provider classes,
constructors and output paths in `references/forge-1.20.1-api.md`. Then inspect
the generated files under `src/generated/resources`.

---

## 8. Common Tasks Checklist

When adding a **new block**:

- [ ] `Block` subclass (or use vanilla Block with properties)
- [ ] Register in `ModBlocks.BLOCKS` with `ForgeRegistries.BLOCKS`
- [ ] Register `BlockItem` in `ModItems.ITEMS` with `ForgeRegistries.ITEMS`
- [ ] Blockstate JSON -> `assets/<modid>/blockstates/<name>.json`
- [ ] Block model JSON -> `assets/<modid>/models/block/<name>.json`
- [ ] Item model JSON -> `assets/<modid>/models/item/<name>.json` (or inherits from block)
- [ ] Texture PNG -> `assets/<modid>/textures/block/<name>.png`
- [ ] Loot table JSON -> Minecraft 1.21 and later: `data/<modid>/loot_table/blocks/<name>.json`; Forge 1.20.1: `data/<modid>/loot_tables/blocks/<name>.json`
- [ ] Tags -> Forge 1.20.1: `data/<modid>/tags/blocks/` and `tags/items/`
- [ ] Language entry in `assets/<modid>/lang/en_us.json`
- [ ] Vanilla mining and tool-tier tags when `requiresCorrectToolForDrops` is set
- [ ] Do not rewrite Forge 1.20.1 plural server-data paths to the singular paths of Minecraft 1.21 and later

When adding a **new item**:

- [ ] `Item` subclass (or use `new Item(properties)`)
- [ ] Register in `ModItems.ITEMS` with `ForgeRegistries.ITEMS`
- [ ] Item model JSON -> `assets/<modid>/models/item/<name>.json`
- [ ] Texture PNG -> `assets/<modid>/textures/item/<name>.png`
- [ ] Language entry
- [ ] Creative tab entry with `BuildCreativeModeTabContentsEvent`
- [ ] Recipe JSON if craftable -> `data/<modid>/recipes/<name>.json`

When adding a **new entity**:

- [ ] Entity class (extends a base such as `Mob`, `Animal` or `TamableAnimal`)
- [ ] `EntityType` registration with `ForgeRegistries.ENTITY_TYPES`
- [ ] Renderer and model classes loaded only on the physical client
- [ ] Register the renderer with `EntityRenderersEvent.RegisterRenderers`;
      register model layers separately
- [ ] Spawn egg item (optional)
- [ ] Spawn rules

---

## 9. References

- Forge 1.20.1 API patterns and MDK workflow: `./references/forge-1.20.1-api.md`
- Forge 1.20.1 downloads: https://files.minecraftforge.net/net/minecraftforge/forge/index_1.20.1.html
- Forge 1.20.x documentation: https://docs.minecraftforge.net/en/1.20.x/
- Minecraft Wiki (data formats): https://minecraft.wiki/w/Java_Edition_data_values
