# NeoForge Project Layout and Task Checklists

## Project Layout

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
        recipe/                <- crafting recipe JSON (1.21+ folder name)
        loot_table/
          blocks/              <- per-block loot table JSON
        tags/
          block/
          item/
```

## Common Tasks Checklist

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
- [ ] Recipe JSON if craftable (`data/<modid>/recipe/`; 1.21.1 writes keys and
      ingredients as `{ "item": ... }` objects, see `common-patterns.md`)

When adding a **new entity**:

- [ ] Entity class (extends a base such as `Mob`, `Animal` or `TamableAnimal`)
- [ ] `EntityType` registration
- [ ] Renderer and model classes loaded only on the physical client
- [ ] Register the renderer with `EntityRenderersEvent.RegisterRenderers`;
      register model layers separately
- [ ] Spawn egg item (optional)
- [ ] Spawn rules / biome modifier
