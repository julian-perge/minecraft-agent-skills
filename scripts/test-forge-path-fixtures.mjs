#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const auditScript = path.resolve("scripts/audit-skills.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "minecraft-forge-paths-"));
const surfaces = [".agents/skills", ".codex/skills", ".claude/skills", "plugins/minecraft-codex-skills/skills"];

function skillText(name) {
  return [
    "---",
    `name: ${name}`,
    "description: Check the Forge 1.20.1 data path rule.",
    "---",
    `# ${name}`,
    "## Routing Boundaries",
    "- `Use when`: checking data paths.",
    "- `Do not use when`: running a game.",
    "Loot table JSON goes in `data/<modid>/loot_tables/blocks/<name>.json`."
  ].join("\n");
}

try {
  const cases = [
    { skill: "minecraft-forge", status: 0 },
    { skill: "path-fixture", status: 1, error: "use `loot_table` for 1.21.x conventions" }
  ];
  for (const fixture of cases) {
    for (const surface of surfaces) {
      fs.rmSync(path.join(tempRoot, surface), { recursive: true, force: true });
      const skillDir = path.join(tempRoot, surface, fixture.skill);
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, "SKILL.md"), `${skillText(fixture.skill)}\n`);
    }
    const result = spawnSync(process.execPath, [auditScript], { cwd: tempRoot, encoding: "utf8" });
    assert.equal(result.status, fixture.status, `${fixture.skill}\n${result.error ?? result.stderr}`);
    if (fixture.error) assert.ok(result.stderr.includes(fixture.error), result.stderr);
  }
  console.log("Forge path fixtures passed");
} finally {
  const relative = path.relative(os.tmpdir(), tempRoot);
  if (relative.startsWith("minecraft-forge-paths-") && !relative.includes(path.sep)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}
