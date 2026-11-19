# Minecraft 1.21.11 Worldgen JSON

These examples target Minecraft 1.21.11 on Java 21. They follow the vanilla
1.21.11 data (`data/minecraft/` from the 1.21.11 data generator). Do not use
them for 26.1.2 or 26.3: those releases change the biome, dimension type and
feature registries again. For a 1.21.11 project, compare each file with the
vanilla 1.21.11 data or datagen output before you change its shape.

## Biome and feature chain

Biome `features` has 11 arrays, one for each `GenerationStep.Decoration` index.
Ores belong at index 6, `underground_ores`. Each entry is a placed-feature id.

At `data/<namespace>/worldgen/biome/my_biome.json`:

```json
{
  "has_precipitation": true,
  "temperature": 0.7,
  "downfall": 0.8,
  "attributes": {
    "minecraft:visual/sky_color": "#78a7ff",
    "minecraft:visual/water_fog_color": "#050533"
  },
  "effects": {
    "water_color": "#3f76e4"
  },
  "spawners": {},
  "spawn_costs": {},
  "carvers": [],
  "features": [
    [], [], [], [], [], [],
    ["<namespace>:my_ore_placed"],
    [], [], [], []
  ]
}
```

In 1.21.11, biome `effects` keeps only `water_color`, `foliage_color`,
`dry_foliage_color`, `grass_color` and `grass_color_modifier`. The fog, sky,
water fog, particle, sound and music fields moved to environment attributes in
`attributes`. For example, `sky_color` is now `minecraft:visual/sky_color`,
`water_fog_color` is `minecraft:visual/water_fog_color`, and `music` is
`minecraft:audio/background_music`. Vanilla 1.21.11 writes colors as hex strings
such as `"#3f76e4"`. Copy the attribute shape for any other field from a vanilla
1.21.11 biome that uses it, for example `swamp.json` or `warm_ocean.json`.

At `data/<namespace>/worldgen/configured_feature/my_ore.json`:

```json
{
  "type": "minecraft:ore",
  "config": {
    "targets": [
      {
        "target": {
          "predicate_type": "minecraft:tag_match",
          "tag": "minecraft:stone_ore_replaceables"
        },
        "state": { "Name": "minecraft:emerald_ore" }
      }
    ],
    "size": 4,
    "discard_chance_on_air_exposure": 0.0
  }
}
```

At `data/<namespace>/worldgen/placed_feature/my_ore_placed.json`:

```json
{
  "feature": "<namespace>:my_ore",
  "placement": [
    { "type": "minecraft:count", "count": 8 },
    { "type": "minecraft:in_square" },
    {
      "type": "minecraft:height_range",
      "height": {
        "type": "minecraft:trapezoid",
        "min_inclusive": { "above_bottom": 0 },
        "max_inclusive": { "absolute": 64 }
      }
    },
    { "type": "minecraft:biome" }
  ]
}
```

## Dimension and dimension type

At `data/<namespace>/dimension_type/my_type.json`:

```json
{
  "coordinate_scale": 1.0,
  "has_skylight": true,
  "has_ceiling": false,
  "ambient_light": 0.0,
  "monster_spawn_light_level": {
    "type": "minecraft:uniform",
    "min_inclusive": 0,
    "max_inclusive": 7
  },
  "monster_spawn_block_light_limit": 0,
  "logical_height": 384,
  "height": 384,
  "min_y": -64,
  "infiniburn": "#minecraft:infiniburn_overworld",
  "timelines": "#minecraft:in_overworld",
  "attributes": {
    "minecraft:gameplay/bed_rule": {
      "can_set_spawn": "always",
      "can_sleep": "when_dark",
      "error_message": { "translate": "block.minecraft.bed.no_sleep" }
    },
    "minecraft:gameplay/nether_portal_spawns_piglin": true,
    "minecraft:gameplay/respawn_anchor_works": false,
    "minecraft:visual/cloud_height": 192.33,
    "minecraft:visual/fog_color": "#c0d8ff",
    "minecraft:visual/sky_color": "#78a7ff"
  }
}
```

This example takes its fields from the vanilla 1.21.11 `overworld.json`, but it
leaves out the `minecraft:audio/ambient_sounds`, `minecraft:audio/background_music`
and `minecraft:visual/cloud_color` attributes. Without them, the dimension has no
cave sounds or music and uses the default cloud color. Copy them from
`overworld.json` when the dimension needs them. The overworld omits `skybox`,
`cardinal_light` and `has_fixed_time`, so it uses their defaults.
The vanilla `the_nether.json` sets `"skybox": "none"`, `"cardinal_light":
"nether"` and `"has_fixed_time": true`. The vanilla `the_end.json` sets
`"skybox": "end"` and `"has_fixed_time": true`.

A dimension type written for 1.21.5 needs these changes for 1.21.11:

| 1.21.5 field | 1.21.11 replacement |
| --- | --- |
| `ultrawarm` | `minecraft:gameplay/water_evaporates`, `minecraft:gameplay/fast_lava` and `minecraft:visual/default_dripstone_particle` attributes |
| `natural` | `minecraft:gameplay/nether_portal_spawns_piglin` attribute, and `minecraft:gameplay/eyeblossom_open` and `minecraft:gameplay/creaking_active` (the vanilla `minecraft:day` timeline sets these two) |
| `piglin_safe` | `minecraft:gameplay/piglins_zombify` attribute (`false` in the Nether) |
| `bed_works` | `minecraft:gameplay/bed_rule` attribute |
| `respawn_anchor_works` | `minecraft:gameplay/respawn_anchor_works` attribute |
| `has_raids` | `minecraft:gameplay/can_start_raid` attribute |
| `cloud_height` (added in 1.21.6) | `minecraft:visual/cloud_height` attribute |
| `effects` | `skybox` and `cardinal_light` |
| `fixed_time` | `has_fixed_time` (boolean), with `timelines` for time-based values |

At `data/<namespace>/dimension/my_dimension.json`:

```json
{
  "type": "<namespace>:my_type",
  "generator": {
    "type": "minecraft:noise",
    "biome_source": { "type": "minecraft:fixed", "biome": "<namespace>:my_biome" },
    "settings": "minecraft:overworld"
  }
}
```

Use `minecraft:multi_noise` only with a complete set of climate parameters from
a known-good 1.21.11 source. Keep the dimension type, noise settings, and every
referenced biome on 1.21.11.

## NeoForge biome modifier

At `data/<namespace>/neoforge/biome_modifier/add_ores.json`:

```json
{
  "type": "neoforge:add_features",
  "biomes": "#minecraft:is_overworld",
  "features": "<namespace>:my_ore_placed",
  "step": "underground_ores"
}
```

`add_features` needs the singular `step`. `remove_features` takes an optional
`steps`: one step or a list of steps. When `steps` is absent, it removes the
features from every step. Read the NeoForge 1.21.11 documentation before you
write other modifier types by hand.

## Jigsaw structures

At `data/<namespace>/worldgen/structure/my_structure.json`:

```json
{
  "type": "minecraft:jigsaw",
  "biomes": "#<namespace>:my_biome_tag",
  "step": "surface_structures",
  "terrain_adaptation": "beard_thin",
  "start_pool": "<namespace>:my_pool/start",
  "start_height": { "absolute": 0 },
  "project_start_to_heightmap": "WORLD_SURFACE_WG",
  "size": 6,
  "max_distance_from_center": 80,
  "use_expansion_hack": false,
  "spawn_overrides": {}
}
```

Every vanilla 1.21.11 jigsaw structure sets `start_height`. Remove
`project_start_to_heightmap` for a structure that must start at a fixed height,
such as an underground structure.

At `data/<namespace>/worldgen/template_pool/my_pool/start.json`:

```json
{
  "fallback": "minecraft:empty",
  "elements": [
    {
      "weight": 1,
      "element": {
        "element_type": "minecraft:single_pool_element",
        "location": "<namespace>:my_structure/start",
        "projection": "rigid",
        "processors": "minecraft:empty"
      }
    }
  ]
}
```

At `data/<namespace>/worldgen/structure_set/my_structures.json`:

```json
{
  "structures": [
    { "structure": "<namespace>:my_structure", "weight": 1 }
  ],
  "placement": {
    "type": "minecraft:random_spread",
    "spacing": 32,
    "separation": 8,
    "salt": 12345678
  }
}
```

The pool's `location` needs a matching
`data/<namespace>/structure/my_structure/start.nbt`; use a processor list other
than `minecraft:empty` only when its JSON exists and has been tested.
