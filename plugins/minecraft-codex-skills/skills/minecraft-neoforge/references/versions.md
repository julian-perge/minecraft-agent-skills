# NeoForge Versions

One row per supported Minecraft version. Each cell gives a value with its
source and the date the source was read, or the word `unverified`. Do not use
an `unverified` cell as a fact. Check the project's `gradle.properties` and the
primary source first.

| Minecraft | Java | Mappings | NeoForge version line | MDK or generator source |
|---|---|---|---|---|
| 1.21.1 | Java 21 ([build.gradle][mdk-1.21.1-build], 2026-11-17) | Mojang names with Parchment `2024.11.17` ([gradle.properties][mdk-1.21.1-props], 2026-11-17) | `21.1.x`, stable, MDK pins `21.1.266` ([gradle.properties][mdk-1.21.1-props], [Maven][neo-maven], 2026-11-17) | [MDK-1.21.1-ModDevGradle][mdk-1.21.1] (2026-11-17) |
| 1.21.11 | Java 21 ([build.gradle][mdk-1.21.11-build], 2026-11-17) | Mojang names with Parchment `2025.12.20` ([gradle.properties][mdk-1.21.11-props], [21.11 release post][post-21.11], 2026-11-17) | `21.11.x`, stable from `21.11.42`, MDK pins `21.11.48` ([gradle.properties][mdk-1.21.11-props], [Maven][neo-maven], 2026-11-17) | [MDK-1.21.11-ModDevGradle][mdk-1.21.11] (2026-11-17) |
| 26.1.2 | Java 25 ([build.gradle][mdk-26.1.2-build], [26.1 release post][post-26.1], 2026-11-17) | Mojang names, no obfuscation, Parchment optional, MDK has no Parchment block ([build.gradle][mdk-26.1.2-build], [26.1 release post][post-26.1], 2026-11-17) | `26.1.2.x`, stable from `26.1.2.71`, MDK pins `26.1.2.126` ([gradle.properties][mdk-26.1.2-props], [Maven][neo-maven], 2026-11-17) | [MDK-26.1.2-ModDevGradle][mdk-26.1.2] (2026-11-17) |
| 26.3 | Java 25 ([build.gradle][mdk-26.3-build], 2026-11-17) | Mojang names, no obfuscation, MDK has no Parchment block ([build.gradle][mdk-26.3-build], [Mojang][mojang-obf], 2026-11-17) | `26.3.0.x`, stable from `26.3.0.76`, MDK pins `26.3.0.103` ([gradle.properties][mdk-26.3-props], [Maven][neo-maven], 2026-11-17) | [MDK-26.3-ModDevGradle][mdk-26.3] (2026-11-17) |

All four MDKs use the ModDevGradle plugin `net.neoforged.moddev` version
`2.0.148`. Each MDK also has a NeoGradle variant in the
[NeoForgeMDKs][mdk-org] organization. The latest release on Maven was
`26.3.0.110` on 2026-11-17.

## Verified deltas

Each delta names the first NeoForge line that has it. A project on 1.21.11
has every 21.x delta.

- 21.2: `BlockBehaviour.Properties` and `Item.Properties` must have the ID set.
  `DeferredRegister.Blocks#registerBlock` and
  `DeferredRegister.Items#registerItem` set it. Block items call
  `useBlockDescriptionPrefix()` to keep the `block.namespace.path` key
  ([21.2 release post][post-21.2], 2026-11-17).
- 21.2: `BlockEntityType` has no builder. Construct it directly
  ([21.2 release post][post-21.2], 2026-11-17).
- 21.2: `RegistryAccess.registry` is renamed to `lookup`. `Registry.getHolder`
  is renamed to `get`, and `getValue` returns the object
  ([21.2 release post][post-21.2], 2026-11-17).
- 21.2: recipes are no longer synced to clients
  ([21.2 release post][post-21.2], 2026-11-17).
- 21.4: `GatherDataEvent` is split into `GatherDataEvent.Client` and
  `GatherDataEvent.Server`. `includeClient()` and `includeServer()` are
  removed. NeoForge recommends one `clientData` run for all assets and data
  ([21.4 release post][post-21.4], 2026-11-17).
- 21.5: `SwordItem`, `DiggerItem` and `ArmorItem` are replaced by the `WEAPON`,
  `TOOL`, `ARMOR` and `BLOCKS_ATTACKS` data components
  ([21.5 release post][post-21.5], 2026-11-17).
- 21.5: NBT getters return an `Optional`, unless the `get*Or` method with a
  default is used ([21.5 release post][post-21.5], 2026-11-17).
- 21.5: `@Mod` entrypoints are constructed before `Minecraft`. Code that needs
  the `Minecraft` instance moves to an event such as `FMLClientSetupEvent`
  ([21.5 release post][post-21.5], 2026-11-17).
- 21.6: `BlockEntity#saveAdditional` and `loadAdditional` take `ValueOutput`
  and `ValueInput` in place of `CompoundTag`. `ValueIOSerializable` replaces
  `INBTSerializable` ([21.6 release post][post-21.6], 2026-11-17).
- 21.6: a string drawn with `GuiGraphics` needs an alpha value, or the text is
  invisible ([21.6 release post][post-21.6], 2026-11-17).
- 21.9: FML state is read through `FMLLoader.getCurrent()`. `FMLEnvironment`
  has static getters for the dist and production flag
  ([21.9 release post][post-21.9], 2026-11-17).
- 21.9: ModDevGradle 2.0.111 and newer reject `additionalRuntimeClasspath`
  for Minecraft 1.21.9 and newer. FML loads all classpath libraries in
  development ([21.9 release post][post-21.9], 2026-11-17).
- 21.9: the transfer APIs (`IItemHandler`, `IFluidHandler`,
  `IFluidHandlerItem`, `IEnergyStorage`) are reworked from `21.9.1-beta`
  ([21.9 release post][post-21.9], [transfer rework post][post-21.9-transfer],
  2026-11-17).
- 21.9: `BlockEntityRenderer` has a render state type parameter. `render` is
  replaced by `createRenderState`, `extractRenderState` and `submit`
  ([21.9 release post][post-21.9], 2026-11-17).
- 21.9: key mapping categories are `KeyMapping.Category` records, registered
  with `RegisterKeyMappingsEvent.registerCategory`
  ([21.9 release post][post-21.9], 2026-11-17).
- 21.11: `ResourceLocation` is renamed to `Identifier`, for
  example `Identifier.fromNamespaceAndPath("mymod", "thing")`
  ([21.11 release post][post-21.11], 2026-11-17).
- 21.11: Minecraft and NeoForge use JSpecify nullability
  annotations (`org.jspecify.annotations.Nullable`) in place of
  `javax.annotation.Nullable` ([21.11 release post][post-21.11], 2026-11-17).
- 21.11: vanilla render types moved from `RenderType` to
  `RenderTypes` ([21.11 release post][post-21.11], 2026-11-17).
- 26.1: NeoForge versions have four parts. The first three give the
  Minecraft version and the last gives the NeoForge release, for example
  `26.1.0.10-beta` ([26.1 release post][post-26.1], 2026-11-17).
- 26.1: Java 25 and Gradle 9.1.0 or newer are required. Set
  `JavaLanguageVersion.of(25)` in the Gradle toolchain
  ([26.1 release post][post-26.1], 2026-11-17).
- 26.1: data files use `ItemStackTemplate`, because a new
  `ItemStack` needs loaded registries. `FluidStackTemplate` does the same for
  fluids ([26.1 release post][post-26.1], 2026-11-17).
- 26.1: `GuiGraphics` is renamed to `GuiGraphicsExtractor`, and
  `Screen#render` is renamed to `Screen#extractRenderState`
  ([26.1 release post][post-26.1], 2026-11-17).

[mdk-org]: https://github.com/NeoForgeMDKs
[neo-maven]: https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml
[post-21.2]: https://neoforged.net/news/21.2release/
[post-21.4]: https://neoforged.net/news/21.4release/
[post-21.5]: https://neoforged.net/news/21.5release/
[post-21.6]: https://neoforged.net/news/21.6release/
[post-21.9]: https://neoforged.net/news/21.9release/
[post-21.9-transfer]: https://neoforged.net/news/21.9-transfer-rework/
[post-21.11]: https://neoforged.net/news/21.11release/
[post-26.1]: https://neoforged.net/news/26.1release/
[mojang-obf]: https://www.minecraft.net/en-us/article/removing-obfuscation-in-java-edition
[mdk-1.21.1]: https://github.com/NeoForgeMDKs/MDK-1.21.1-ModDevGradle/tree/e0000cb81c6ca4bb218046cfd8ade771a42e9c32
[mdk-1.21.1-build]: https://github.com/NeoForgeMDKs/MDK-1.21.1-ModDevGradle/blob/e0000cb81c6ca4bb218046cfd8ade771a42e9c32/build.gradle
[mdk-1.21.1-props]: https://github.com/NeoForgeMDKs/MDK-1.21.1-ModDevGradle/blob/e0000cb81c6ca4bb218046cfd8ade771a42e9c32/gradle.properties
[mdk-1.21.11]: https://github.com/NeoForgeMDKs/MDK-1.21.11-ModDevGradle/tree/c3fd175261fd672799dca21ef03387bfdc4eba44
[mdk-1.21.11-build]: https://github.com/NeoForgeMDKs/MDK-1.21.11-ModDevGradle/blob/c3fd175261fd672799dca21ef03387bfdc4eba44/build.gradle
[mdk-1.21.11-props]: https://github.com/NeoForgeMDKs/MDK-1.21.11-ModDevGradle/blob/c3fd175261fd672799dca21ef03387bfdc4eba44/gradle.properties
[mdk-26.1.2]: https://github.com/NeoForgeMDKs/MDK-26.1.2-ModDevGradle/tree/b7040ef34422615a879cfb015feeeb04a6284ddb
[mdk-26.1.2-build]: https://github.com/NeoForgeMDKs/MDK-26.1.2-ModDevGradle/blob/b7040ef34422615a879cfb015feeeb04a6284ddb/build.gradle
[mdk-26.1.2-props]: https://github.com/NeoForgeMDKs/MDK-26.1.2-ModDevGradle/blob/b7040ef34422615a879cfb015feeeb04a6284ddb/gradle.properties
[mdk-26.3]: https://github.com/NeoForgeMDKs/MDK-26.3-ModDevGradle/tree/c4db43c62e013b60e7ea893850b4fa621c5a204a
[mdk-26.3-build]: https://github.com/NeoForgeMDKs/MDK-26.3-ModDevGradle/blob/c4db43c62e013b60e7ea893850b4fa621c5a204a/build.gradle
[mdk-26.3-props]: https://github.com/NeoForgeMDKs/MDK-26.3-ModDevGradle/blob/c4db43c62e013b60e7ea893850b4fa621c5a204a/gradle.properties
