# {{MOD_NAME}}: master build prompt

<!--
How to use this template:
1. Copy it into an empty folder as PROMPT.md.
2. Fill every {{PLACEHOLDER}}. Delete any block marked OPTIONAL that does not apply.
3. Start the agent in that folder and say: "Read PROMPT.md and start at the first checkpoint."
Delete this comment before starting.
-->

## 0. Your role

You are a lead game designer, systems architect and senior Minecraft mod engineer rolled into one. You have full creative ownership and a full production budget. Your job is to design and then **actually build** a finished, polished Minecraft Java mod from an empty folder to a working `.jar`.

The mod: {{ONE_PARAGRAPH_PITCH: what it is, who it is for, and the feeling a player should have after an hour with it}}.

Work in checkpoints, following the `minecraft-neoforge` skill. Record every decision in `DECISIONS.md` (one line each: what, why, alternatives rejected). Stop for my approval at these points:

1. After `DESIGN_BIBLE.md` is written, before any gameplay code.
2. After the project skeleton builds (empty mod loads, `./gradlew build` passes).
3. After each MVP slice from the build order, with its verification results.
4. Before starting any stretch goal.

Between checkpoints, make small decisions yourself and record them. Ask me whenever a requirement is unclear instead of filling in the blank.

---

## 1. Target platform

| Setting | Value |
|---|---|
| Loader | NeoForge |
| Minecraft version | {{MC_VERSION: 26.3 (default), 26.1.2, 1.21.11 or 1.21.1}} |
| Mod id | {{MOD_ID: lowercase, a-z0-9_}} |
| Java package | {{PACKAGE: e.g. `io.github.<username>.<modid>`}} |
| License | {{LICENSE: e.g. MIT, or "All Rights Reserved"}} |
| Required dependencies | {{DEPENDENCIES: e.g. none, or GeckoLib, Curios}} |
| Optional integrations | {{INTEGRATIONS: e.g. JEI/EMI, Jade, AE2, Create, or none}} |

Version-specific rules. Apply only the row for the version above:

| Version | Java | Mappings | Notes |
|---|---|---|---|
| 26.3 / 26.1.2 | 25 | Mojang names, no obfuscation. The MDK has no Parchment block. | NeoForge `26.3.0.x` or `26.1.2.x` line. Start from the ModDevGradle MDK for that exact version. Do not copy 1.21.1 or 1.21.11 buildscript snippets. |
| 1.21.11 | 21 | Mojang names with Parchment for parameter names. | NeoForge `21.11.x` line. Start from the 1.21.11 ModDevGradle MDK. |
| 1.21.1 | 21 | Mojang names with Parchment for parameter names. | NeoForge `21.1.x` line. Start from the 1.21.1 ModDevGradle MDK. |

**Look up every version number** (NeoForge, ModDevGradle, Gradle wrapper, Parchment, every dependency) from the official sources at build time: `https://projects.neoforged.net`, the NeoForge MDK repositories, `https://docs.neoforged.net` with the matching version selected, and each dependency's Maven or Modrinth page. **Verify all APIs, registry names, event names and method signatures against the real docs and the decompiled game sources for this version. Do not rely on memory.** NeoForge APIs change between releases. If something you remember does not compile, read the source instead of guessing again. If the network is unavailable, stop and tell me; never invent a version number.

---

## 2. Source material and the baseline you must beat

<!-- OPTIONAL: keep this section if the mod is inspired by, or competing with, an existing mod, video, or game mechanic. Otherwise replace it with "No baseline; this is an original concept." -->

**The inspiration.** {{INSPIRATION: where the idea comes from, e.g. a video, another mod, a real-world system}}.

**What existing versions do.** {{EXISTING_FEATURES: bullet list of the features commonly listed for existing mods or adaptations}}

**Treat the following as likely weaknesses to fix.** Verify each against the documentation for the target version and your own design judgment, and do not assume the list is complete:

- {{WEAKNESS_1}}
- {{WEAKNESS_2}}
- {{WEAKNESS_3}}

### Originality

- **Clean-room build.** Do not decompile, port or paraphrase another mod's code, and do not copy its textures, models, sounds or text. Everything must be written and made by you. Reading Minecraft's and NeoForge's own sources to learn the API is expected and fine.

---

## 3. The quality mandate: where you must go far beyond the baseline

Make a measurable, visible leap on each axis below. In `DESIGN_BIBLE.md`, state for each one what the baseline is (or "none" for an original concept), what you are doing instead, and how you will verify it.

1. **{{AXIS_1_NAME}}.** {{AXIS_1_DETAIL}}
2. **{{AXIS_2_NAME}}.** {{AXIS_2_DETAIL}}
3. **{{AXIS_3_NAME}}.** {{AXIS_3_DETAIL}}
4. **It plays, it does not just exist.** Every block, item, entity and system must have a reason to be used in normal survival play, and must interact with vanilla mechanics (redstone, hoppers, tags, loot, enchantments, villagers, or whatever fits) rather than living in a sealed box.
5. **Presence and feedback.** Custom textures and models that match vanilla's pixel density and palette, animations, particles, sounds and subtitles for every meaningful action. A player must always be able to tell what just happened and why.
6. **Systems, not scripts.** Prefer rules that combine into emergent outcomes over one-off scripted events, so that a second playthrough differs from the first.
7. **Multiplayer and server mode.** It works on a dedicated server with several players. State is server-authoritative, per-player where it should be, and shared where it should be. Document which is which.
8. **Zero-friction onboarding.** A new player understands the first step without a wiki: an in-game guide, advancements that teach, or tooltips. Recipes show up in the recipe book{{INTEGRATIONS_NOTE: and in JEI/EMI if present}}.
9. **Polish and extensibility.** A complete config (server and client split correctly), sensible defaults, accessibility options where relevant, data-driven content that pack makers can override with datapacks, and a small public API or events if other mods would plausibly extend it.
10. **Performance.** No per-tick scans of large areas, no unbounded lists, no work on the render thread that belongs elsewhere. State a budget (for example "under 0.5 ms per server tick with 10 players") and measure it.

---

## 4. Design phase: write `DESIGN_BIBLE.md` first

Before writing gameplay code, write `DESIGN_BIBLE.md` covering:

1. **Pitch and pillars**: the one-paragraph pitch, and three to five design pillars every feature must serve.
2. **Core loop**: what the player does minute to minute, session to session, and over a whole playthrough.
3. **Progression**: tiers, gates, unlock order, and how it slots into vanilla progression (what vanilla milestone each tier requires).
4. **Content list**: every block, item, entity, structure, dimension, biome, enchantment, effect and recipe, each with its purpose.
5. **Systems**: each system's inputs, outputs, rules and failure modes.
6. {{EXTRA_BIBLE_SECTION_1: e.g. "Story arc and endings", "Boss encounters with attack patterns", "Machine tiers and energy model"}}
7. {{EXTRA_BIBLE_SECTION_2}}
8. **Balance**: resource costs, durations, rates and drop chances, with the reasoning behind each number.
9. **Visual style guide** (palette with hex values, shape language, UI style, animation principles) and **audio style guide**.
10. **Mod compatibility**: tags used and provided, optional integrations, and known conflicts to avoid.
11. **The quality mandate table** from section 3.
12. **Scope and build order**: MVP versus stretch, with reasons. The MVP must be playable end to end on its own.

---

## 5. Required pillars (all must be implemented and playable)

1. {{PILLAR_1}}
2. {{PILLAR_2}}
3. {{PILLAR_3}}
4. {{PILLAR_4}}
5. All textures, models, sounds and language entries present: no missing-texture checkerboards, no raw translation keys, no silent actions.
6. Recipes and loot tables for everything obtainable, and a creative tab containing everything.
7. Advancements that guide the player through the progression.
8. {{GUIDE: an in-game guide book or GuideME/Patchouli documentation, or "tooltips only"}}.
9. Server and client config with sensible defaults and comments on every option.
10. Multiplayer-safe, dedicated-server-safe operation.
11. `README.md` for players (what it does, how to start, config, compatibility) and `docs/` for developers (architecture, how to add content, public API).

---

## 6. Technical requirements

### Project and build

- Gradle wrapper, ModDevGradle, proper `neoforge.mods.toml` metadata, license, README, `.gitignore`. Copy the wrapper from the official MDK; never hand-write `gradle-wrapper.jar`.
- Clean package structure grouped by feature or by layer, documented in `docs/architecture.md`. Suggested starting point: `block`, `item`, `entity`, `blockentity`, `menu`, `client`, `network`, `world`, `data`, `datagen`, `config`, `api`, `util`, plus one package per major system.
- Registration through `DeferredRegister`. No static initialisation order surprises.
- **Data generation** for models, blockstates, item models, language, recipes, loot tables, tags and advancements. Hand-written JSON only where datagen cannot express it, and say why in a comment.
- Data-driven wherever practical, so pack makers can change balance and content with a datapack.

### Correctness

- **Server-authoritative logic.** The client renders and predicts; the server decides. Never trust a client packet without validation (range checks, permission checks, rate limits).
- **Sided code.** Client-only classes (renderers, screens, key mappings) live in a client package and are never loaded on a dedicated server. Verify by actually starting `runServer`.
- **Networking** through the payload API of the target version, with a registered codec per payload.
- **Persistence** of world and player state through the saved-data and data-attachment APIs of the target version. Item state uses data components, not raw NBT.
- **No blocking work on the game thread.** Anything slow (file IO, network, heavy computation) is async with a timeout and is joined back on the main thread.
- **Bounded side effects.** Nothing the mod does can destroy large areas, corrupt a world, or soft-lock a player with no way out. Explosions, block replacement and entity spawning have caps and respect game rules and claim/protection mods where an API exists.

### Rendering, entities and audio

- Custom renderers and models where vanilla ones do not fit, procedural or keyframed animation, emissive layers, particles. Any shader is cheap and can be disabled in config.
- Every new sound has a `sounds.json` entry, a subtitle and a sensible category (blocks, hostile, ambient, and so on).
- Assets you generate (textures, models, sounds) are produced by scripts checked into `tools/`, so they can be regenerated instead of hand-edited. Outputs are deterministic.

### {{OPTIONAL_TECH_SECTION_TITLE}}

<!-- OPTIONAL: add a block here for anything system-specific, e.g. "Energy and item transfer", "World generation", "AI layer", "Combat". Delete if unused. -->

- {{OPTIONAL_TECH_REQUIREMENT}}

---

## 7. Player safety and trust

- Everything the mod does stays inside the game. No reading or writing files outside the game directory, no opening URLs or external programs, no network traffic that is not declared in the README and switchable off in config.
- Effects that mess with the player's screen, controls or HUD (if any) must be dismissable, must never persist after the game closes, and must have an accessibility toggle (for example flashing effects).
- An admin command to undo or calm any disruptive system, for servers.

---

## 8. Verification and definition of done

Run each of these and fix every failure before calling the mod done. Ask me before starting `runServer` or `runClient`. Report results honestly, including anything you could not verify.

1. `./gradlew build` succeeds with no warnings you introduced.
2. Datagen runs cleanly and the generated resources are committed.
3. **GameTests** (`runGameTestServer`) cover the core rules of every system: recipes produce the right output, machines process correctly, entities spawn and behave, persistence survives a save and reload.
4. `runServer` starts a dedicated server with the mod and no client classes load. Join it with a client if you can.
5. `runClient` loads to the title screen and into a world with no errors or missing-asset warnings in the log.
6. A playthrough checklist in `docs/playtest.md`: the steps a human should follow to experience every pillar, with what they should see at each step. Walk through it yourself as far as tooling allows (for example a scripted client that takes screenshots) and record what you could and could not check.
7. The final `.jar` in `build/libs/`, with the expected mod id and version, and a list of required dependency jars.

Done means: every pillar in section 5 is implemented and playable, every check above passes, and `DESIGN_BIBLE.md`, `DECISIONS.md`, `README.md` and `docs/` describe the mod as built, not as planned.
