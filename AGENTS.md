# minecraft-agent-skills

This repository contains 15 Minecraft skills and a plugin for Codex and Claude Code.

## Editing

- Treat `.agents/skills/` as canonical.
- After canonical changes, run `bun run sync:skills` to refresh
  `.codex/skills/`, `.claude/skills/`, and
  `plugins/minecraft-codex-skills/skills/`.
- Do not hand-edit mirrored skill trees.
- Run `bun run check` before publishing changes.
- The root `justfile` has one recipe for each `package.json` script, plus
  `bash-n`, `lint`, `fmt`, `install` and `clean`. Run `just` to list them. The
  recipes use bun.
- `just lint` runs the prek hooks in `prek.toml`: whitespace, final newlines,
  line endings, JSON and YAML syntax, and shebangs. `just fmt` keeps their
  fixes. Fix a finding in `.agents/skills/`, then run `bun run sync:skills`.
- `bun.lock` is the only lockfile. CI installs from it with
  `bun install --frozen-lockfile` and runs `bun run check`.

## Skill standards

- Keep skill instructions focused on when to use them and which versions they
  support. Put longer examples in reference files.
- Preserve the user's project, version pins, and authorized scope. A sample
  workflow is not a requirement to migrate, publish, or add extra deliverables.
- Verify changing APIs against primary documentation for the exact version.
  Distinguish static helper checks from compilation and in-game validation.

- Target current stable Minecraft 26.x and Java 25 for new work. Preserve
  support for Minecraft 1.21.x on Java 21 and Forge 1.20.1 on
  Java 17 with ForgeGradle 6.
- Keep platform-specific patterns clear and examples runnable.
- Keep JSON valid and formatted with 2-space indentation.
- Do not create cross-skill dependencies.

## Repository boundaries

- Do not run Minecraft, Gradle, or Paper server commands here.
- Keep helper scripts self-contained inside the skill that uses them.
- Do not add unstable Minecraft features or version guidance.

## Every task

- Run `bun run check` before each commit.

## Workflow

- Tasks are tracked in GitHub Issues for julian-perge/minecraft-agent-skills, with the `gh` CLI. `/agent-skills:plan` creates one sub-issue per task. `tasks/` is git-ignored scratch.
- Specs are files at `spec/<issue>-<slug>.md`, not `SPEC.md`.
- ADRs go in `docs/adr/`. Read `GLOSSARY.md` and `docs/adr/` (those that exist) before design work.
- Start each `/agent-skills` stage with `agent-skills brief <stage> <n>`. It prints every rule of `docs/agents/workflow.md` that the stage needs, so do not read that file in a stage. Before other work in this repo, read all of `docs/agents/workflow.md`.
