# Local shortcuts for checking and syncing the skills. `just` lists them, and `just <recipe>` runs one.
#
# CI does not call just. The workflows in .github/workflows run `npm run check` directly.

set shell := ["bash", "-euo", "pipefail", "-c"]

# Recipe arguments arrive as $1, $2 and so on, so variadic recipes forward them with "$@" and keep each argument intact.
set positional-arguments

[private]
default:
    @just --list --unsorted

# Each recipe that wraps a package.json script runs it through this. It uses bun when bun is on PATH and npm otherwise.
[private]
run script:
    #!/usr/bin/env bash
    set -euo pipefail
    if command -v bun >/dev/null; then
        bun run "$1"
    elif command -v npm >/dev/null; then
        npm run "$1"
    else
        echo "error: missing bun and npm. Install bun, or Node 22 or later with npm." >&2
        exit 1
    fi

[doc('Run the full gate that CI runs: sync, bundle, audit, drift, docs, validators, policy, pins and markdown lint')]
[group('check')]
check: (run "check")

[doc('Check that the .codex, .claude and plugin mirrors match .agents/skills')]
[group('check')]
check-sync: (run "check:sync")

[doc('Validate the Codex plugin bundle')]
[group('check')]
plugin-bundle: (run "check:plugin-bundle")

[doc('Audit every SKILL.md for frontmatter, routing sections and banned path words')]
[group('check')]
audit: (run "audit:skills")

[doc('Check the required and forbidden version patterns in the skills')]
[group('check')]
drift: (run "check:version-drift")

[doc('Validate the code snippets in the docs')]
[group('check')]
test-docs: (run "test:docs")

[doc('Run the skill validator scripts against their fixtures')]
[group('check')]
test-validators: (run "test:validators")

[doc('Run the repo policy fixture checks')]
[group('check')]
test-repo-policy: (run "test:repo-policy")

[doc('Check that every GitHub Actions step is pinned to a commit SHA')]
[group('check')]
workflow-pins: (run "check:workflow-pins")

[doc('Lint the Markdown files')]
[group('check')]
lint-md: (run "lint:md")

[doc('Parse-check every shell script under .agents/skills and scripts')]
[group('check')]
bash-n:
    find .agents/skills scripts -name '*.sh' -print0 | xargs -0 -n1 bash -n

[doc('Copy .agents/skills into the .codex, .claude and plugin mirrors')]
[group('edit')]
sync: (run "sync:skills")

# bun.lock is the lockfile for local work. CI still runs npm ci against package-lock.json, so a dependency change must update both files.
[doc('Install the dev dependencies from bun.lock')]
[group('setup')]
install: (require "bun")
    bun install

# check-sync compares every file in the mirrors, so the .DS_Store files that Finder writes make it fail.
[doc('Delete the Finder .DS_Store files in the skill trees')]
[group('setup')]
clean:
    find .agents .codex .claude plugins -name .DS_Store -print -delete

# Recipes that call a tool depend on this, so a missing tool stops the recipe before it starts.
[private]
require +tools:
    #!/usr/bin/env bash
    set -euo pipefail
    missing=()
    for tool in "$@"; do
        command -v "$tool" >/dev/null || missing+=("$tool")
    done
    if [ ${#missing[@]} -gt 0 ]; then
        echo "error: missing ${missing[*]}. Install it, then run the recipe again." >&2
        exit 1
    fi
