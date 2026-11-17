#!/usr/bin/env bash
# Prints the NeoForge universal jar and the FML loader jar from the Gradle cache, without Gradle.
# Run from the root of a NeoForge mod project:
#   bash neoforge-jars.sh [--neo-version <version>]
# Output on stdout is four key=value lines and nothing else. Errors go to stderr with exit code 1.

set -euo pipefail

fail() {
    echo "neoforge-jars: $*" >&2
    exit 1
}

# Gradle accepts spaces around "=" and CRLF line endings in gradle.properties, so both are removed from the value.
read_gradle_property() {
    local key="$1"
    if [[ -f gradle.properties ]]; then
        tr -d '\r' < gradle.properties |
            sed -n "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*\(.*[^[:space:]]\)[[:space:]]*$/\1/p" |
            head -1
    fi
}

# Only a quoted literal inside the neoForge block counts. A value such as
# "version = neo_version" names a property, so the gradle.properties lookup covers it.
read_build_script_version() {
    local file
    for file in build.gradle build.gradle.kts; do
        [[ -f "$file" ]] || continue
        awk '
            !inside && /neoForge[[:space:]]*\{/ { inside = 1; depth = 0 }
            inside {
                if (match($0, /version[[:space:]]*=[[:space:]]*["\047][^"\047]+["\047]/)) {
                    value = substr($0, RSTART, RLENGTH)
                    sub(/^version[[:space:]]*=[[:space:]]*["\047]/, "", value)
                    sub(/["\047]$/, "", value)
                    print value
                    exit
                }
                depth += gsub(/\{/, "{")
                depth -= gsub(/\}/, "}")
                if (depth <= 0) inside = 0
            }
        ' "$file"
        return 0
    done
}

# Prints the version of the dependency with the given groupId and artifactId in a pom file.
# The groupId and artifactId lines inside <exclusions> belong to excluded modules, so they are skipped.
read_pom_dependency_version() {
    local pom="$1"
    local group="$2"
    local artifact="$3"
    awk -v group="$group" -v artifact="$artifact" '
        /<dependency>/ { g = ""; a = ""; v = "" }
        /<exclusions>/ { excluded = 1 }
        /<\/exclusions>/ { excluded = 0; next }
        excluded { next }
        /<groupId>/ { g = $0; gsub(/.*<groupId>|<\/groupId>.*/, "", g) }
        /<artifactId>/ { a = $0; gsub(/.*<artifactId>|<\/artifactId>.*/, "", a) }
        /<version>/ { v = $0; gsub(/.*<version>|<\/version>.*/, "", v) }
        /<\/dependency>/ && g == group && a == artifact { print v; exit }
    ' "$pom"
}

# Prints the one file named <name> in a hash folder of <dir>, or fails when none or several match.
find_one() {
    local description="$1"
    local dir="$2"
    local name="$3"
    local matches=()
    shopt -s nullglob
    matches=("$dir"/*/"$name")
    shopt -u nullglob
    if [[ ${#matches[@]} -eq 0 ]]; then
        fail "$description is not in the Gradle cache ($dir/*/$name). Run a Gradle build of the project first, or use neoforge-jars.init.gradle."
    fi
    if [[ ${#matches[@]} -gt 1 ]]; then
        fail "$description matches several files: ${matches[*]}"
    fi
    echo "${matches[0]}"
}

neo_version=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --neo-version)
            [[ $# -ge 2 ]] || fail "--neo-version needs a value"
            neo_version="$2"
            shift 2
            ;;
        -h | --help)
            echo "Usage: bash neoforge-jars.sh [--neo-version <version>]"
            exit 0
            ;;
        *)
            fail "unknown argument: $1"
            ;;
    esac
done

cache="${GRADLE_USER_HOME:-$HOME/.gradle}/caches/modules-2/files-2.1"

if [[ -z "$neo_version" ]]; then
    neo_version="$(read_gradle_property neo_version)"
fi
if [[ -z "$neo_version" ]]; then
    neo_version="$(read_gradle_property neoforge_version)"
fi
if [[ -z "$neo_version" ]]; then
    neo_version="$(read_build_script_version)"
fi
if [[ -z "$neo_version" ]]; then
    cached=""
    if [[ -d "$cache/net.neoforged/neoforge" ]]; then
        cached="$(find "$cache/net.neoforged/neoforge" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort | paste -sd ' ' -)"
    fi
    fail "cannot find the NeoForge version in gradle.properties (neo_version, neoforge_version) or in the neoForge block of build.gradle or build.gradle.kts. Pass --neo-version <version>. cached versions: ${cached:-none}"
fi

neoforge_dir="$cache/net.neoforged/neoforge/$neo_version"
universal_jar="$(find_one "NeoForge $neo_version universal jar" "$neoforge_dir" "neoforge-$neo_version-universal.jar")"
pom="$(find_one "NeoForge $neo_version pom" "$neoforge_dir" "neoforge-$neo_version.pom")"

loader_version="$(read_pom_dependency_version "$pom" net.neoforged.fancymodloader loader)"
[[ -n "$loader_version" ]] || fail "$pom has no net.neoforged.fancymodloader:loader dependency"
neoform_version="$(read_pom_dependency_version "$pom" net.neoforged neoform)"
[[ -n "$neoform_version" ]] || fail "$pom has no net.neoforged:neoform dependency"

loader_jar="$(find_one "FML loader $loader_version jar" "$cache/net.neoforged.fancymodloader/loader/$loader_version" "loader-$loader_version.jar")"

# The NeoForm version is the Minecraft version, a hyphen and a NeoForm build,
# such as 26.1.2-1 or 1.21.1-20240808.144430.
echo "minecraft_version=${neoform_version%-*}"
echo "neoforge_version=$neo_version"
echo "neoforge_universal_jar=$universal_jar"
echo "fml_loader_jar=$loader_jar"
