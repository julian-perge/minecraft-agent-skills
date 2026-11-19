#!/usr/bin/env bash
# Verifies the NeoForge mod build environment and runs the project's build task.
# Run from the root of a NeoForge mod project.
# Pass --check-only to run the checks and stop before ./gradlew build.

set -euo pipefail

CHECK_ONLY=false
for arg in "$@"; do
    case "$arg" in
        --check-only) CHECK_ONLY=true ;;
        *)
            echo "Usage: check-build.sh [--check-only]" >&2
            exit 2
            ;;
    esac
done

PASS="[PASS]"
FAIL="[FAIL]"
WARN="[WARN]"

read_gradle_property() {
    local key="$1"
    if [[ -f "gradle.properties" ]]; then
        sed -n "s/^${key}=//p" gradle.properties | head -1
    fi
}

parse_java_major() {
    local version="$1"
    if [[ "$version" =~ ^1\.([0-9]+) ]]; then
        echo "${BASH_REMATCH[1]}"
        return 0
    fi
    if [[ "$version" =~ ^([0-9]+) ]]; then
        echo "${BASH_REMATCH[1]}"
        return 0
    fi
    return 1
}

version_at_least() {
    local found="$1"
    local required="$2"
    [[ "$found" =~ ^[0-9]+$ ]] || return 1
    [[ "$found" -ge "$required" ]]
}

echo "=== NeoForge Mod Build Environment Check ==="
echo ""

BUILD_FILES=(build.gradle build.gradle.kts settings.gradle settings.gradle.kts gradle.properties)
MINECRAFT_VERSION=$(read_gradle_property "minecraft_version")

echo "Detecting mod platform..."
PLATFORM="unknown"
if grep -qr "net.neoforged" "${BUILD_FILES[@]}" 2>/dev/null; then
    PLATFORM="neoforge"
fi

if [[ "$PLATFORM" != "neoforge" ]]; then
    echo "$FAIL No net.neoforged plugin or dependency found. This script checks NeoForge projects only."
    exit 1
fi

if [[ -n "$MINECRAFT_VERSION" ]]; then
    echo "$PASS Platform: $PLATFORM (Minecraft $MINECRAFT_VERSION)"
    case "$MINECRAFT_VERSION" in
        1.21.1|1.21.11|26.1.2|26.3) ;;
        *) echo "$WARN Minecraft $MINECRAFT_VERSION is not a version this skill supports (1.21.1, 1.21.11, 26.1.2 and 26.3). Check its pins and Java version yourself." ;;
    esac
else
    echo "$PASS Platform: $PLATFORM"
fi

REQUIRED_JAVA=21
JAVA_REASON="Minecraft 1.21.1 and 1.21.11 require Java 21"
if [[ "$MINECRAFT_VERSION" =~ ^([0-9]+)\.([0-9]+) ]] && (( BASH_REMATCH[1] >= 26 )); then
    REQUIRED_JAVA=25
    JAVA_REASON="Minecraft 26.1.2 and 26.3 require Java 25"
fi

# Java version

echo ""
echo "Checking Java version..."
if ! command -v java &>/dev/null; then
    echo "$FAIL java not found. Install JDK $REQUIRED_JAVA from https://adoptium.net/"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -1 | sed -n 's/.*version "\([^"]*\)".*/\1/p')
JAVA_MAJOR=$(parse_java_major "$JAVA_VERSION" || true)

if [[ -z "$JAVA_MAJOR" ]]; then
    echo "$FAIL Could not parse Java version from: $JAVA_VERSION"
    exit 1
fi

if version_at_least "$JAVA_MAJOR" "$REQUIRED_JAVA"; then
    echo "$PASS Java $JAVA_VERSION (JDK $REQUIRED_JAVA+ available)"
else
    echo "$FAIL Java $JAVA_VERSION - $JAVA_REASON"
    echo "       Install from: https://adoptium.net/temurin/releases/?version=$REQUIRED_JAVA"
    exit 1
fi

# Gradle wrapper

echo ""
echo "Checking Gradle wrapper..."
if [[ ! -f "gradlew" ]]; then
    echo "$FAIL gradlew not found. Are you in the root of a NeoForge mod project?"
    exit 1
fi
echo "$PASS gradlew found"

# Key files

echo ""
echo "Checking key mod files..."
for f in "src/main/resources/META-INF/neoforge.mods.toml" "gradle.properties"; do
    [[ -f "$f" ]] && echo "$PASS $f" || echo "$WARN $f not found"
done
[[ -f "build.gradle" || -f "build.gradle.kts" ]] && echo "$PASS build script found" || echo "$WARN build script not found"

# Run Gradle build

if [[ "$CHECK_ONLY" == true ]]; then
    echo ""
    echo "$PASS Checks done. --check-only skips ./gradlew build."
    exit 0
fi

echo ""
echo "Running ./gradlew build..."
./gradlew build --console=plain

JAR_COUNT=$(find . -type f -path "*/build/libs/*.jar" ! -name "*-sources.jar" ! -name "*-dev.jar" 2>/dev/null | wc -l)
if [[ "$JAR_COUNT" -gt 0 ]]; then
    echo ""
    echo "$PASS Gradle build completed. Candidate output jar(s):"
    find . -type f -path "*/build/libs/*.jar" ! -name "*-sources.jar" ! -name "*-dev.jar" | while read -r jar; do
        echo "  -> $jar"
    done
else
    echo ""
    echo "$FAIL Build did not produce a jar. Check Gradle output above."
    exit 1
fi

echo ""
echo "$WARN Candidate jars may predate this incremental build. Identify the intended distributable from Gradle output and run project-specific release validation before publishing."
echo "=== Build environment check complete ==="
