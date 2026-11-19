# Gradle Publishing Reference

Use these snippets only for a project that has chosen the relevant publisher. Keep
its existing project IDs, artifact tasks, loader metadata, and release approval flow.
The examples target Minecraft 26.3 on Java 25. A 26.1.2 project uses the same
Java 25 setup.

The snippets are parts of one `build.gradle.kts` file, in the order shown. A
Kotlin build script allows only one `plugins {}` block, and it must come before
the other snippets.

## Plugins

Add each publisher that the project uses to its existing `plugins {}` block. Remove
the line of a publisher that the project does not use, and its section below.

```kotlin
import org.gradle.api.tasks.bundling.Jar

plugins {
    // Keep the project's existing plugins, such as its loader plugin, here.
    id("com.modrinth.minotaur") version "2.10.0"
    id("net.darkhax.curseforgegradle") version "1.3.33"
}
```

## Release Version and Changelog

Keep the mod version distinct from the computed project/artifact version. This makes
`v1.2.3` a reliable tag for an artifact such as `1.2.3+26.3`.

```kotlin
val modVersion = providers.gradleProperty("mod_version").orNull
    ?: throw GradleException("mod_version is required")
val minecraftVersion = providers.gradleProperty("minecraft_version").orNull
    ?: throw GradleException("minecraft_version is required")

version = "${modVersion}+${minecraftVersion}"

fun changelogFor(releaseVersion: String): String {
    val lines = rootProject.file("CHANGELOG.md").readLines()
    val heading = "## [$releaseVersion]"
    val start = lines.indexOfFirst { it == heading || it.startsWith("$heading ") }
    check(start >= 0) { "CHANGELOG.md is missing heading: $heading" }

    return lines.drop(start + 1)
        .takeWhile { !it.startsWith("## [") }
        .joinToString("\n")
        .trim()
        .also { check(it.isNotBlank()) { "CHANGELOG.md section is empty: $heading" } }
}

val releaseChangelog = provider { changelogFor(modVersion) }

tasks.register("verifyReleaseVersion") {
    group = "verification"
    doLast {
        val tagVersion = providers.gradleProperty("releaseModVersion").orNull
            ?: error("Pass -PreleaseModVersion=<version from v<version> tag>")
        check(tagVersion == modVersion) {
            "Tag version $tagVersion does not match mod_version=$modVersion"
        }
        changelogFor(tagVersion)
    }
}
```

Use a changelog heading such as `## [1.2.3] — 2026-09-04`. Do not look up a heading
from `project.version`, because it includes `+26.3`; `substringAfter` also must not
be used without an explicit missing-heading check because it can return the entire
file. Skip the heading line so a date alone cannot pass the empty-section check.

`releaseChangelog` is a provider, so Gradle reads `CHANGELOG.md` only when a
publish task runs. A missing heading then fails that task and not every build.
Minotaur 2.10.0 reads its `changelog` property, and CurseForgeGradle reads the
`changelog` field of an upload, when the publish task runs.

## Jar Classifier

Set the loader classifier once, for both publishers:

```kotlin
tasks.named<Jar>("jar") {
    archiveClassifier.set("fabric")
}
```

## Modrinth with Minotaur

The current Gradle Plugin Portal release is `com.modrinth.minotaur` `2.10.0`. For a
Minecraft 26.1.2 or 26.3 Fabric project, upload the primary `jar` task. Minecraft
26.1 and later is unobfuscated, so a 26.1.2 or 26.3 Fabric build should not assume
`remapJar` exists.
Give release artifacts loader-distinct classifiers when Fabric and NeoForge could
otherwise produce the same basename.

```kotlin
modrinth {
    token.set(providers.environmentVariable("MODRINTH_TOKEN"))
    projectId.set(providers.gradleProperty("modrinth_project_id"))
    versionNumber.set(version.toString())
    versionType.set("release")
    uploadFile.set(tasks.named<Jar>("jar"))
    gameVersions.add(minecraftVersion)
    loaders.add("fabric")
    changelog.set(releaseChangelog)
}

tasks.named("modrinth") {
    dependsOn(tasks.named("verifyReleaseVersion"))
}
```

For a 1.21.11 Fabric project on `net.fabricmc.fabric-loom-remap`, which produces
the distributable `remapJar`, select that task explicitly instead:

```kotlin
uploadFile.set(tasks.named("remapJar"))
```

Confirm the task name and the produced file in that 1.21.11 project before changing
the selection. NeoForge and multi-loader builds can have different platform tasks;
configure each output independently. For a named NeoForge output, use its actual
archive task and set `archiveClassifier` to `neoforge`; do not assume either loader
uses the other one's task.

In a project made from the Architectury multiloader template, `base.archivesName`
already holds the platform name, and the shipped jar has no classifier. That jar
comes from `shadowJar` on 26.1.2 and 26.3 and from `remapJar` on 1.21.11. Upload
that task from each platform project, and leave out the Jar Classifier snippet.

## CurseForge with CurseForgeGradle

The current Gradle Plugin Portal release is
`net.darkhax.curseforgegradle` `1.3.33`. Only add this task for a project that
publishes to CurseForge.

```kotlin
tasks.register<net.darkhax.curseforgegradle.TaskPublishCurseForge>("curseforge") {
    apiToken = providers.environmentVariable("CURSEFORGE_TOKEN").orNull ?: ""

    val mainFile = upload(
        providers.gradleProperty("curseforge_project_id").get(),
        tasks.named<Jar>("jar")
    )
    mainFile.changelogType = "markdown"
    mainFile.changelog = releaseChangelog
    mainFile.releaseType = "release"
    mainFile.addGameVersion(minecraftVersion)
    mainFile.addModLoader("Fabric")
    mainFile.addJavaVersion("Java 25")
    mainFile.addEnvironment("Client", "Server")
}

tasks.named("curseforge") {
    dependsOn(tasks.named("verifyReleaseVersion"))
}
```

Set the actual loader and supported environments for the artifact. CurseForgeGradle
can infer loader, game, and Java metadata when the relevant project configuration is
present; explicit metadata is useful only when it matches the released JAR.

## Optional Combined Task

Only create a combined task when both publishers and all named platform tasks are
already configured in the project:

```kotlin
tasks.register("publishSelectedDestinations") {
    group = "publishing"
    dependsOn("modrinth", "curseforge")
}
```

Do not add missing publisher plugins, task dependencies, project IDs, or secrets just
to make this aggregation example apply. Invoke any publisher task with
`-PreleaseModVersion=<tag version>`: each configured publish task depends on
`verifyReleaseVersion`, so a missing tag version or mismatched changelog blocks the
upload before it reaches a publisher.
