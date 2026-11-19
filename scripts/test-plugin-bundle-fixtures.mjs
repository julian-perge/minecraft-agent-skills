#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const validateScript = path.resolve("scripts/validate-plugin-bundle.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "minecraft-plugin-bundle-"));
const claudeMarketplace = ".claude-plugin/marketplace.json";
const copiedFiles = [
  "package.json",
  ".agents/plugins/marketplace.json",
  claudeMarketplace,
  "plugins/minecraft-codex-skills/.codex-plugin/plugin.json",
  "plugins/minecraft-codex-skills/.claude-plugin/plugin.json"
];

function writeRepoCopy(editClaudeMarketplace) {
  fs.rmSync(tempRoot, { recursive: true, force: true });
  for (const file of copiedFiles) {
    fs.mkdirSync(path.dirname(path.join(tempRoot, file)), { recursive: true });
    fs.copyFileSync(file, path.join(tempRoot, file));
  }
  fs.mkdirSync(path.join(tempRoot, "plugins/minecraft-codex-skills/skills"), { recursive: true });

  const marketplaceFile = path.join(tempRoot, claudeMarketplace);
  const marketplace = JSON.parse(fs.readFileSync(marketplaceFile, "utf8"));
  const edited = editClaudeMarketplace(marketplace);
  if (edited === null) fs.rmSync(marketplaceFile);
  else fs.writeFileSync(marketplaceFile, `${JSON.stringify(edited, null, 2)}\n`);
}

try {
  const cases = [
    { name: "valid", edit: (marketplace) => marketplace, status: 0 },
    { name: "missing file", edit: () => null, status: 1, error: "missing required JSON file" },
    {
      name: "wrong entry name",
      edit: (marketplace) => {
        marketplace.plugins[0].name = "wrong-name";
        return marketplace;
      },
      status: 1,
      error: "missing plugin entry for `minecraft-codex-skills`"
    },
    {
      name: "wrong source",
      edit: (marketplace) => {
        marketplace.plugins[0].source = "./plugins/wrong-source";
        return marketplace;
      },
      status: 1,
      error: "expected plugin source `./plugins/minecraft-codex-skills`"
    }
  ];
  for (const fixture of cases) {
    writeRepoCopy(fixture.edit);
    const result = spawnSync(process.execPath, [validateScript], { cwd: tempRoot, encoding: "utf8" });
    assert.equal(result.status, fixture.status, `${fixture.name}\n${result.error ?? result.stderr}`);
    if (fixture.error) {
      assert.ok(result.stderr.includes(`${claudeMarketplace}: ${fixture.error}`), `${fixture.name}\n${result.stderr}`);
    }
  }
  console.log("Plugin bundle fixtures passed");
} finally {
  const relative = path.relative(os.tmpdir(), tempRoot);
  if (relative.startsWith("minecraft-plugin-bundle-") && !relative.includes(path.sep)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}
