# ADR-0002: The supported Minecraft versions are 1.21.11, 26.1.2 and 26.3

## Status

Accepted

## Date

2026-11-19

## Context

The skills said "Minecraft 26.x" and "legacy 1.21.x". Agents read that as "any 26 or 1.21 release", and some examples targeted 26.2, 1.21.3, 1.21.5 or 1.21.8. A loose range lets an agent pick a version that the skills never checked, so a coordinate or format can be wrong for it.

The user set the supported list for this repo on 2026-11-19 (issue #40).

## Decision

- The skills support Minecraft 1.21.11 (Java 21), 26.1.2 and 26.3 (Java 25).
- 26.2 is skipped. It is not a target in any example.
- `minecraft-forge` stays on Forge 1.20.1, Java 17 and ForgeGradle 6.
- `minecraft-neoforge` keeps 1.21.1 until the user decides otherwise, because dropping a supported version needs the user's decision.
- Skills, docs and validators name these versions exactly. Format tables and migration notes keep their history.

## Alternatives Considered

### Keep "26.x" and "1.21.x"

- Pros: no edits when a new release ships.
- Cons: agents treat unchecked versions as supported.
- Rejected: the skills must name only versions whose facts were checked.

### Drop NeoForge 1.21.1 now

- Pros: one 1.21 version everywhere.
- Cons: removes a version that the NeoForge skill, its scripts and its drift patterns support today.
- Rejected for now: deferred to the user.

## Consequences

- Each new Minecraft release needs an explicit change to this list, the skills and the drift patterns.
- Validators warn on a version outside the list.
