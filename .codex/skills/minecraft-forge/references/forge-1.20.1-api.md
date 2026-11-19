# Forge 1.20.1 API Patterns

Use this reference only for Minecraft `1.20.1` projects using MinecraftForge
`47.4.x` and Java 17. Do not apply these snippets to NeoForge 1.21.x projects.
Forge 1.20.1 and NeoForge 1.21.x share some concepts, but the package names,
metadata file, event bus access, helper classes, and several data paths differ.
Sources: [Forge 1.20.1 downloads](https://files.minecraftforge.net/net/minecraftforge/forge/index_1.20.1.html)
and [Forge 1.20.x documentation](https://docs.minecraftforge.net/en/1.20.x/).

## Project Detection

A Forge 1.20.1 project on the ForgeGradle 7 MDK usually has these signatures:

```text
build.gradle: id 'net.minecraftforge.gradle' version '[7.0,8)'
build.gradle: id 'net.minecraftforge.renamer' version '1.1.8+'
gradle.properties: minecraft_version=1.20.1
gradle.properties: forge_version=47.4.29
src/main/resources/META-INF/mods.toml
```

A project that uses `id 'net.minecraftforge.gradle' version '[6.0,6.2)'` is on
ForgeGradle 6. Read [ForgeGradle 6 projects](#forgegradle-6-projects) before
you change its build.

Use Java 17 for Forge 1.20.1. The official MDK template sets:

```gradle
java.toolchain.languageVersion = JavaLanguageVersion.of(17)
```

## Gradle Properties

```properties
org.gradle.caching=true
org.gradle.parallel=true
org.gradle.configureondemand=true

org.gradle.configuration-cache=true
org.gradle.configuration-cache.parallel=true
org.gradle.configuration-cache.problems=warn

net.minecraftforge.gradle.merge-source-sets=true

minecraft_version=1.20.1
minecraft_version_range=[1.20.1,1.20.2)
forge_version=47.4.29
forge_version_range=[47,)
loader_version_range=[47,)
mapping_channel=official
mapping_version=1.20.1

mod_id=mymod
mod_name=My Mod
mod_license=MIT
mod_version=1.0.0
mod_group_id=com.example.mymod
mod_authors=YourName
mod_description=A Forge 1.20.1 mod.
```

Use the current Forge 1.20.1 `47.4.x` patch from the Forge files page when
scaffolding a new project. Keep `minecraft_version` and the left side of the
Forge artifact coordinate paired as `1.20.1-${forge_version}`. On 2026-11-19
the files page lists `47.4.29` as the latest 1.20.1 build and `47.4.28` as
the recommended one.

The MDK download for Forge `47.4.29` and later uses ForgeGradle 7 and the
`net.minecraftforge.renamer` plugin. This reference covers that build. The
patterns come from the `mdk/` folder of the `1.20.1` branch of
[MinecraftForge](https://github.com/MinecraftForge/MinecraftForge/tree/1.20.1/mdk).

## settings.gradle and the Gradle Wrapper

```gradle
plugins {
    id 'org.gradle.toolchains.foojay-resolver-convention' version '1.0.0'
}

rootProject.name = 'mymod'
```

ForgeGradle 7 is on the Gradle Plugin Portal, so `settings.gradle` needs no
`pluginManagement` block for the Forge maven. The MDK ships the Gradle 9.8.2
wrapper:

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-9.8.2-bin.zip
```

## build.gradle Essentials

```gradle
plugins {
    id 'eclipse'
    id 'idea'
    id 'java'
    id 'maven-publish'
    id 'net.minecraftforge.gradle' version '[7.0,8)'
    id 'net.minecraftforge.renamer' version '1.1.8+'
}

version = mod_version
group = mod_group_id

base {
    archivesName = mod_id
}

java.toolchain.languageVersion = JavaLanguageVersion.of(17)

minecraft {
    mappings channel: mapping_channel, version: mapping_version

    runs {
        configureEach {
            workingDir.convention layout.projectDirectory.dir('run')
        }

        register('client') {
            systemProperty 'forge.enabledGameTestNamespaces', mod_id
        }

        register('server') {
            systemProperty 'forge.enabledGameTestNamespaces', mod_id
            args '--nogui'
        }

        register('gameTestServer') {
            systemProperty 'forge.enabledGameTestNamespaces', mod_id
        }

        register('data') {
            workingDir = layout.projectDirectory.dir('run-data')
            args '--mod', mod_id, '--all',
                '--output', layout.projectDirectory.dir('src/generated/resources'),
                '--existing', layout.projectDirectory.dir('src/main/resources')
        }
    }
}

sourceSets.main.resources { srcDir 'src/generated/resources' }

repositories {
    minecraft.mavenizer(it)
    maven fg.forgeMaven
    maven fg.minecraftLibsMaven
}

dependencies {
    implementation minecraft.dependency("net.minecraftforge:forge:${minecraft_version}-${forge_version}")
}

tasks.named('processResources', ProcessResources) {
    var replaceProperties = [
            minecraft_version: minecraft_version, minecraft_version_range: minecraft_version_range,
            forge_version: forge_version, forge_version_range: forge_version_range,
            loader_version_range: loader_version_range,
            mod_id: mod_id, mod_name: mod_name, mod_license: mod_license, mod_version: mod_version,
            mod_authors: mod_authors, mod_description: mod_description,
    ]
    inputs.property('replaceProperties', replaceProperties)

    filesMatching(['META-INF/mods.toml', 'pack.mcmeta']) {
        expand replaceProperties
    }
}

tasks.named('jar', Jar) {
    archiveClassifier = 'unobfuscated'
}

renamer.mappings.from minecraft.dependency.toSrgFile

renamer.classes(tasks.named('jar', Jar)) {
    archiveClassifier = ''
}
```

Each `register('<name>')` run adds a `run<Name>` task: `runClient`,
`runServer`, `runGameTestServer` and `runData`. Without the
`configureEach` block, a run works in `runs/main/<name>`.

The ForgeGradle 7 MDK has no `srcDir 'src/generated/resources'` line. Add it,
or the jar does not include the files that `runData` writes.

The `processResources` block comes from the Forge `47.4.29` MDK. It replaces
the `${...}` placeholders in `mods.toml` with the `gradle.properties` values.
Without it, the placeholders ship as literal text and Forge rejects the mod.
Keep the property map in step with the placeholders that `mods.toml` uses.
Do not add `[project: project]` to the `expand` map. The MDK turns on the
Gradle configuration cache, and the cache cannot store a `project` reference.

The MDK does not ship a `pack.mcmeta`. The `filesMatching` list names it so
that a `pack.mcmeta` you add also gets the expanded values.

`renamer.classes(tasks.named('jar', Jar))` registers the `renameJar` task. It
remaps the `jar` output from Mojang names to SRG names, and `assemble` depends
on it, so `./gradlew build` runs it. The game loads the renamed jar outside
the development environment. With these classifiers, `jar` writes
`build/libs/<archivesName>-<version>-unobfuscated.jar` and `renameJar` writes
`build/libs/<archivesName>-<version>.jar`. Ship the renamed jar.

`renamer.mappings.from minecraft.dependency.toSrgFile` must come after the
`minecraft.dependency(...)` call, because it reads the mappings of that
dependency.

A mod dependency that needs remapping to the project's names uses
`implementation renamer.dependency('<group>:<name>:<version>')`. A mod with
mixins also needs `renamer.enableMixinRefmaps`. The MDK comments and
[MDKExamples](https://github.com/MinecraftForge/MDKExamples) show both.

## ForgeGradle 6 projects

A project on Forge `47.4.28` or earlier usually uses ForgeGradle 6:
`id 'net.minecraftforge.gradle' version '[6.0,6.2)'`, a
`minecraft "net.minecraftforge:forge:..."` dependency, `fg.deobf(...)` for
mod dependencies, and `finalizedBy 'reobfJar'` on the `jar` task. Keep that
build when you change mod code in such a project. The mod code patterns in
this reference apply to both builds. Move the build to ForgeGradle 7 only when
the user asks. To move it, copy the build files from the Forge `47.4.29` or
later MDK and port the project's own changes to them.

## mods.toml

Forge 1.20.1 uses `src/main/resources/META-INF/mods.toml`, not
`neoforge.mods.toml`.

```toml
modLoader="javafml"
loaderVersion="${loader_version_range}"
license="${mod_license}"

[[mods]]
modId="${mod_id}"
version="${mod_version}"
displayName="${mod_name}"
authors="${mod_authors}"
description='''${mod_description}'''

[[dependencies.${mod_id}]]
modId="forge"
mandatory=true
versionRange="${forge_version_range}"
ordering="NONE"
side="BOTH"

[[dependencies.${mod_id}]]
modId="minecraft"
mandatory=true
versionRange="${minecraft_version_range}"
ordering="NONE"
side="BOTH"
```

## Entry Point And Event Buses

Forge 1.20.1 uses `net.minecraftforge.*` imports. The mod event bus comes from
`FMLJavaModLoadingContext`, and gameplay events use `MinecraftForge.EVENT_BUS`.

```java
@Mod(MyMod.MOD_ID)
public class MyMod {
    public static final String MOD_ID = "mymod";
    private static final Logger LOGGER = LogUtils.getLogger();

    public MyMod(FMLJavaModLoadingContext context) {
        IEventBus modEventBus = context.getModEventBus();

        ModBlocks.BLOCKS.register(modEventBus);
        ModItems.ITEMS.register(modEventBus);
        ModCreativeTabs.CREATIVE_MODE_TABS.register(modEventBus);

        modEventBus.addListener(this::commonSetup);
        modEventBus.addListener(this::addCreative);
        MinecraftForge.EVENT_BUS.register(this);
    }

    private void commonSetup(FMLCommonSetupEvent event) {
        LOGGER.info("Common setup for {}", MOD_ID);
    }

    private void addCreative(BuildCreativeModeTabContentsEvent event) {
        if (event.getTabKey() == CreativeModeTabs.BUILDING_BLOCKS) {
            event.accept(ModItems.MY_BLOCK_ITEM);
        }
    }

    @SubscribeEvent
    public void onServerStarting(ServerStartingEvent event) {
        LOGGER.info("Server starting");
    }
}
```

## DeferredRegister

Forge 1.20.1 uses `ForgeRegistries` and `RegistryObject`.

```java
public final class ModBlocks {
    public static final DeferredRegister<Block> BLOCKS =
        DeferredRegister.create(ForgeRegistries.BLOCKS, MyMod.MOD_ID);

    public static final RegistryObject<Block> MY_BLOCK = BLOCKS.register(
        "my_block",
        () -> new Block(BlockBehaviour.Properties.of()
            .mapColor(MapColor.STONE)
            .strength(1.5f, 6.0f)
            .sound(SoundType.STONE)
            .requiresCorrectToolForDrops())
    );

    private ModBlocks() {
    }
}
```

```java
public final class ModItems {
    public static final DeferredRegister<Item> ITEMS =
        DeferredRegister.create(ForgeRegistries.ITEMS, MyMod.MOD_ID);

    public static final RegistryObject<Item> MY_BLOCK_ITEM = ITEMS.register(
        "my_block",
        () -> new BlockItem(ModBlocks.MY_BLOCK.get(), new Item.Properties())
    );

    public static final RegistryObject<Item> MY_ITEM = ITEMS.register(
        "my_item",
        () -> new Item(new Item.Properties())
    );

    private ModItems() {
    }
}
```

For vanilla registries not wrapped by `ForgeRegistries`, use the matching
`net.minecraft.core.registries.Registries` key with `DeferredRegister.create`.
Creative mode tabs in the official MDK use this pattern.

```java
public static final DeferredRegister<CreativeModeTab> CREATIVE_MODE_TABS =
    DeferredRegister.create(Registries.CREATIVE_MODE_TAB, MyMod.MOD_ID);
```

## ResourceLocation

Forge 1.20.1 uses the public constructors available in Minecraft 1.20.1.
Do not use NeoForge 1.21.x helpers such as `ResourceLocation.fromNamespaceAndPath`.

```java
ResourceLocation id = new ResourceLocation(MyMod.MOD_ID, "my_block");
```

## Networking

Forge 1.20.1 uses `SimpleChannel` with `NetworkRegistry.newSimpleChannel`.
Register packets with stable integer discriminators and always mark packets as
handled after scheduling work.

```java
public final class ModNetworking {
    private static final String PROTOCOL_VERSION = "1";

    public static final SimpleChannel CHANNEL = NetworkRegistry.newSimpleChannel(
        new ResourceLocation(MyMod.MOD_ID, "main"),
        () -> PROTOCOL_VERSION,
        PROTOCOL_VERSION::equals,
        PROTOCOL_VERSION::equals
    );

    public static void register() {
        int id = 0;
        CHANNEL.registerMessage(
            id++,
            SyncEnergyPacket.class,
            SyncEnergyPacket::encode,
            SyncEnergyPacket::decode,
            SyncEnergyPacket::handle
        );
    }

    private ModNetworking() {
    }
}
```

```java
public record SyncEnergyPacket(BlockPos pos, int energy) {
    public static void encode(SyncEnergyPacket packet, FriendlyByteBuf buffer) {
        buffer.writeBlockPos(packet.pos());
        buffer.writeInt(packet.energy());
    }

    public static SyncEnergyPacket decode(FriendlyByteBuf buffer) {
        return new SyncEnergyPacket(buffer.readBlockPos(), buffer.readInt());
    }

    public static void handle(SyncEnergyPacket packet, Supplier<NetworkEvent.Context> context) {
        NetworkEvent.Context ctx = context.get();
        ctx.enqueueWork(() -> {
            ServerPlayer sender = ctx.getSender();
            if (sender == null || !sender.level().hasChunkAt(packet.pos())) {
                return;
            }
            // Handle trusted server-side work here.
        });
        ctx.setPacketHandled(true);
    }
}
```

Send packets through the channel and Forge `PacketDistributor` helpers. In Forge
`47.4.29`, `PacketDistributor<T>.with` takes a `Supplier<T>`. For `PLAYER`,
pass `() -> serverPlayer`, not the `ServerPlayer` itself.

```java
ModNetworking.CHANNEL.send(PacketDistributor.PLAYER.with(() -> serverPlayer), packet);
ModNetworking.CHANNEL.sendToServer(packet);
```

## Data Generation And Paths

Run Forge 1.20.1 data generation with `./gradlew runData`. The generated output
is normally wired from `src/generated/resources` into `sourceSets.main.resources`.
Register data providers on the mod event bus; Forge fires `GatherDataEvent` there
when the data generator starts.

```java
public MyMod(FMLJavaModLoadingContext context) {
    IEventBus modEventBus = context.getModEventBus();
    modEventBus.addListener(ModDataGen::gatherData);
}
```

Use Forge 1.20.1 provider classes and constructors rather than NeoForge 1.21.x
examples. `ExistingFileHelper` comes from the event and validates referenced
assets such as textures and parent models.

```java
public final class ModDataGen {
    public static void gatherData(GatherDataEvent event) {
        DataGenerator generator = event.getGenerator();
        PackOutput output = generator.getPackOutput();
        ExistingFileHelper existingFileHelper = event.getExistingFileHelper();
        CompletableFuture<HolderLookup.Provider> lookupProvider = event.getLookupProvider();

        generator.addProvider(event.includeClient(), new ModBlockStateProvider(output, existingFileHelper));
        generator.addProvider(event.includeClient(), new ModItemModelProvider(output, existingFileHelper));
        generator.addProvider(event.includeServer(), new ModRecipeProvider(output));

        ModBlockTagsProvider blockTags = new ModBlockTagsProvider(output, lookupProvider, existingFileHelper);
        generator.addProvider(event.includeServer(), blockTags);
        generator.addProvider(event.includeServer(), new ModItemTagsProvider(
            output,
            lookupProvider,
            blockTags.contentsGetter(),
            existingFileHelper
        ));
    }

    private ModDataGen() {
    }
}
```

Common Forge 1.20.1 provider constructors look like this:

```java
public final class ModBlockStateProvider extends BlockStateProvider {
    public ModBlockStateProvider(PackOutput output, ExistingFileHelper existingFileHelper) {
        super(output, MyMod.MOD_ID, existingFileHelper);
    }

    @Override
    protected void registerStatesAndModels() {
        // Generate blockstates, block models, and simple block item models here.
    }
}
```

```java
public final class ModItemModelProvider extends ItemModelProvider {
    public ModItemModelProvider(PackOutput output, ExistingFileHelper existingFileHelper) {
        super(output, MyMod.MOD_ID, existingFileHelper);
    }

    @Override
    protected void registerModels() {
        // Generate standalone item models here.
    }
}
```

```java
public final class ModRecipeProvider extends RecipeProvider {
    public ModRecipeProvider(PackOutput output) {
        super(output);
    }

    @Override
    protected void buildRecipes(Consumer<FinishedRecipe> consumer) {
        // Generate recipes here.
    }
}
```

```java
public final class ModBlockTagsProvider extends BlockTagsProvider {
    public ModBlockTagsProvider(
        PackOutput output,
        CompletableFuture<HolderLookup.Provider> lookupProvider,
        ExistingFileHelper existingFileHelper
    ) {
        super(output, lookupProvider, MyMod.MOD_ID, existingFileHelper);
    }

    @Override
    protected void addTags(HolderLookup.Provider provider) {
        // Generate block tags here.
    }
}
```

```java
public final class ModItemTagsProvider extends ItemTagsProvider {
    public ModItemTagsProvider(
        PackOutput output,
        CompletableFuture<HolderLookup.Provider> lookupProvider,
        CompletableFuture<TagsProvider.TagLookup<Block>> blockTags,
        ExistingFileHelper existingFileHelper
    ) {
        super(output, lookupProvider, blockTags, MyMod.MOD_ID, existingFileHelper);
    }

    @Override
    protected void addTags(HolderLookup.Provider provider) {
        // Generate item tags here.
    }
}
```

Minecraft 1.20.1 uses the older server-data path names:

```text
data/<modid>/loot_tables/blocks/<block>.json
data/<modid>/tags/blocks/<tag>.json
data/<modid>/tags/items/<tag>.json
```

Do not rewrite these to the 1.21.x singular path names when editing a Forge
1.20.1 project. Conversely, do not copy these legacy paths into 1.21.x projects.

## Common Porting Mistakes

| Mistake | Forge 1.20.1 fix |
|---|---|
| Using `net.neoforged.*` imports | Use `net.minecraftforge.*` imports |
| Creating `META-INF/neoforge.mods.toml` | Use `META-INF/mods.toml` |
| Injecting `IEventBus` into the mod constructor | Accept `FMLJavaModLoadingContext context` and call `context.getModEventBus()` |
| Using `DeferredBlock` / `DeferredItem` | Use `RegistryObject<T>` |
| Using `BuiltInRegistries.BLOCK` with Forge deferred registers | Use `ForgeRegistries.BLOCKS` |
| Using `ResourceLocation.fromNamespaceAndPath` | Use `new ResourceLocation(namespace, path)` |
| Assuming Java 21 | Use Java 17 for Minecraft 1.20.1 |
