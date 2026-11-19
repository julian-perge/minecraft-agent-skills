#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

const args = process.argv.slice(2);
const rootIndex = args.indexOf("--root");
const repoRoot = rootIndex >= 0 ? path.resolve(args[rootIndex + 1]) : process.cwd();
const descriptionsOnly = args.includes("--descriptions-only");

// ADR-0002: a SKILL.md description names its exact Minecraft versions, so an agent never reads a loose range or a skipped version as supported.
const LOOSE_DESCRIPTION_PATTERNS = [/\b26\.x\b/i, /\b1\.21\.x\b/i, /\bcurrent\b/i, /\blegacy\b/i, /\b26\.2\b/];

const checks = [
  {
    file: ".agents/skills/minecraft-forge/SKILL.md",
    required: [
      /Forge 1\.20\.1/,
      /Forge 1\.20\.1 project signature/,
      /references\/forge-1\.20\.1-api\.md/,
      /ForgeRegistries\.BLOCKS/,
      /FMLJavaModLoadingContext/,
      /Forge\*\* \| 1\.20\.1 legacy lane/,
      /Loot table JSON -> Minecraft 1\.21 and later: `data\/<modid>\/loot_table\/blocks\/<name>\.json`; Forge 1\.20\.1: `data\/<modid>\/loot_tables\/blocks\/<name>\.json`/
    ]
  },
  {
    file: ".agents/skills/minecraft-forge/references/forge-1.20.1-api.md",
    required: [
      /minecraft_version=1\.20\.1/,
      /forge_version=47\.4\.28/,
      /java\.toolchain\.languageVersion = JavaLanguageVersion\.of\(17\)/,
      /src\/main\/resources\/META-INF\/mods\.toml/,
      /FMLJavaModLoadingContext context/,
      /MinecraftForge\.EVENT_BUS/,
      /ForgeRegistries\.BLOCKS/,
      /RegistryObject<Block>/,
      /NetworkRegistry\.newSimpleChannel/,
      /PacketDistributor\.PLAYER\.with\(\(\) -> serverPlayer\)/,
      /tasks\.named\('processResources', ProcessResources\)/,
      /filesMatching\(\['META-INF\/mods\.toml', 'pack\.mcmeta'\]\) \{\r?\n\s+expand replaceProperties \+ \[project: project\]/,
      /finalizedBy 'reobfJar'/,
      /modEventBus\.addListener\(ModDataGen::gatherData\)/,
      /class ModBlockStateProvider extends BlockStateProvider/,
      /class ModRecipeProvider extends RecipeProvider/,
      /class ModItemTagsProvider extends ItemTagsProvider/,
      /data\/<modid>\/loot_tables\/blocks\/<block>\.json/
    ],
    forbidden: [
      /PacketDistributor\.PLAYER\.with\(serverPlayer\)/
    ]
  },
  {
    file: ".agents/skills/minecraft-forge/scripts/check-build.sh",
    required: [
      /PLATFORM="forge"/,
      /parse_java_major/,
      /MINECRAFT_VERSION" == "1\.20\.1"/,
      /REQUIRED_JAVA=17/,
      /src\/main\/resources\/META-INF\/mods\.toml/
    ],
    forbidden: [
      /neoforge/i,
      /fabric/i,
      /architectury/i
    ]
  },
  {
    file: ".agents/skills/minecraft-multiloader/SKILL.md",
    references: [
      ".agents/skills/minecraft-multiloader/references/legacy-1.21.11-template.md",
      ".agents/skills/minecraft-multiloader/references/architectury-reference.md"
    ],
    required: [
      /mod_version=1\.0\.0/,
      /minecraft_version=1\.21\.11/,
      /architectury_api_version=<project pin, only with the Architectury API>/,
      /fabric_loader_version=<project pin>/,
      /fabric_api_version=<project pin ending in \+1\.21\.11>/,
      /neoforge_version=<project pin in the 21\.11\.x family>/,
      /"fabric-api": ">=0\.139\.4\+1\.21\.11"/,
      /"minecraft": "~1\.21\.11"/,
      /loaderVersion = "\[1,\)"/,
      /dev\.architectury:architectury:19\.0\.1/,
      /dev\.architectury:architectury:20\.1\.18/,
      /dev\.architectury:architectury:22\.0\.6/,
      /architectury-api\/tree\/26\.3/
    ],
    forbidden: [
      /1\.9-SNAPSHOT/,
      /21\.1\.172/,
      /0\.114\.0\+1\.21\.1/,
      /0\.116\.10\+1\.21\.1/,
      /loom_version=1\.7/,
      /architectury_version=<project pin>/,
      /loom_version=<project pin>/,
      /dev\.architectury:architectury-api:/,
      /"fabric-api": "\*"/,
      /"minecraft": "1\.21\.11"/,
      /architectury-api\/tree\/26\.2/
    ]
  },
  {
    file: ".agents/skills/minecraft-ci-release/SKILL.md",
    references: [".agents/skills/minecraft-ci-release/references/publishing-gradle.md"],
    required: [
      /1\.0\.0\+26\.3/,
      /gameVersions\.add\(minecraftVersion\)/,
      /mainFile\.addGameVersion\(minecraftVersion\)/,
      /providers\.gradleProperty\("minecraft_version"\)/,
      /minecraft_version=26\.3/,
      /java-version: "25"/
    ],
    forbidden: [
      /1\.0\.0\+1\.21\.1\s+← mod 1\.0\.0 for MC 1\.21\.1/,
      /gameVersions\.addAll\("1\.21\.1"\)/,
      /cf\.addGameVersion\("1\.21\.1"\)/
    ]
  },
  {
    file: ".agents/skills/minecraft-datapack/SKILL.md",
    required: [
      /1\.21\.11\s+\| `min_format: \[94, 1\]`, `max_format: \[94, 1\]`/,
      /1\.21\.9 \/ 1\.21\.10\s+\| `min_format: \[88, 0\]`, `max_format: \[88, 0\]`/,
      /26\.1 \/ 26\.1\.2\s+\| `min_format: \[101, 1\]`, `max_format: \[101, 1\]`/,
      /26\.3\s+\| `min_format: \[121, 0\]`, `max_format: \[121, 0\]`/,
      /"min_format": \[94, 1\]/,
      /"min_format": \[101, 1\]/,
      /"max_format": \[101, 1\]/,
      /"max_format": \[94, 1\]/,
      /"min_format": \[121, 0\]/,
      /"max_format": \[121, 0\]/
    ],
    forbidden: [
      /"min_format": 94\.1/,
      /"max_format": 94\.1/,
      /"pack_format": 81/,
      /"supported_formats": \[81, 88\]/,
      /### 1\.21\.8 and earlier/,
      /### 1\.21\.9 \/ 1\.21\.10/
    ]
  },
  {
    file: ".agents/skills/minecraft-resource-pack/SKILL.md",
    required: [
      /1\.21\.9 \/ 1\.21\.10\s+\| `min_format: \[69, 0\]`, `max_format: \[69, 0\]`/,
      /1\.21\.11\s+\| `min_format: \[75, 0\]`, `max_format: \[75, 0\]`/,
      /26\.1 \/ 26\.1\.2\s+\| `min_format: \[84, 0\]`, `max_format: \[84, 0\]`/,
      /26\.3\s+\| `min_format: \[97, 1\]`, `max_format: \[97, 1\]`/,
      /"min_format": \[75, 0\]/,
      /"min_format": \[84, 0\]/,
      /"max_format": \[84, 0\]/,
      /"max_format": \[75, 0\]/,
      /"min_format": \[97, 1\]/,
      /"max_format": \[97, 1\]/
    ],
    forbidden: [
      /"min_format": 75\.0/,
      /"max_format": 75\.0/,
      /"pack_format": 64/,
      /### 1\.21\.8 and earlier/,
      /### 1\.21\.9 \/ 1\.21\.10/
    ]
  },
  {
    file: ".agents/skills/minecraft-plugin-dev/SKILL.md",
    required: [
      /paper-api:26\.3\.build\.\+/,
      /JavaLanguageVersion\.of\(25\)/,
      /api-version: '26\.3'/
    ]
  },
  {
    file: ".agents/skills/minecraft-plugin-dev/scripts/validate-plugin-layout.sh",
    required: [
      /1\.21\|1\.21\.11\|26\.1\|26\.1\.2\|26\.3\)/,
      /\^26\\\.\(\[1-9\]\[0-9\]\*\)\(\\\.\[1-9\]\[0-9\]\*\)\?\$/,
      /1\.21\.x or 26\.x release line/,
      /26\.2 is skipped/,
      /api-version \$zero_part must be a positive integer without leading zeroes/
    ],
    forbidden: [
      /CURRENT_API_RELEASE/,
      /skill scope/,
      /api-version release must be a positive integer/
    ]
  },
  {
    file: ".agents/skills/minecraft-plugin-dev/references/runtime-patterns.md",
    required: [
      /Paper API 1\.21\.11 \(Java 21\), 26\.1\.2 and 26\.3 \(Java 25\)/,
      /folia-supported: true/,
      /CustomModelData\.customModelData\(\)\.addString\(/,
      /Bukkit\.broadcast\(Component\.text\(/
    ],
    forbidden: [
      /setCustomModelData\(\d/,
      /broadcastMessage\(/
    ]
  },
  {
    file: ".agents/skills/minecraft-testing/SKILL.md",
    required: [
      /paper-api:26\.3\.build\.\+/,
      /mockbukkit-v26\.3:4\.122\.0/,
      /mockbukkit-v26\.1\.2:4\.115\.0/,
      /mockbukkit-v1\.21:4\.116\.3/,
      /junit-jupiter:6\.1\.3/,
      /NeoForge 1\.21\.1 Game Tests \(annotation API\)/,
      /data\/<namespace>\/structure\/<path>\.nbt/,
      /25 for 26\.1\.2 and 26\.3, 21 for\s+1\.21\.11 and NeoForge 1\.21\.1/
    ],
    forbidden: [
      /data\/mymod\/structures\/empty\.nbt/,
      /mockbukkit-v26\.2/,
      /paper-api:26\.2/,
      /1\.21\.3 only/
    ]
  },
  {
    file: ".agents/skills/minecraft-testing/scripts/validate-test-layout.sh",
    required: [
      /data\/\$namespace\/structure\/\$path\.nbt/
    ],
    forbidden: [
      /data\/\$namespace\/structures\/\$path\.nbt/,
      /data\/\*\/structures\/\*\.nbt/
    ]
  },
  {
    file: ".agents/skills/minecraft-server-admin/SKILL.md",
    required: [
      /minecraft-server:java25/,
      /VERSION: "26\.3"/,
      /java -Xms4G -Xmx4G -jar server\.jar --nogui/
    ]
  },
  {
    file: ".agents/skills/minecraft-neoforge/references/neoforge-api.md",
    required: [
      /minecraft_version=1\.21\.11/,
      /neo_version=21\.11\.42/,
      /minecraft_version_range=\[1\.21\.11,1\.22\)/
    ],
    forbidden: [
      /neo_version=21\.1\.172/,
      /(^|\r?\n)minecraft_version=1\.21\.1(\r?\n|$)/,
      /\b26\.x\b/,
      /\b1\.21\.x\b/
    ]
  },
  {
    file: ".agents/skills/minecraft-neoforge/references/versions.md",
    required: [
      /^\| 1\.21\.1 \|/m,
      /^\| 1\.21\.11 \|/m,
      /^\| 26\.1\.2 \|/m,
      /^\| 26\.3 \|/m,
      /^\| 1\.21\.1 \| Java 21 .*\| Mojang names with Parchment .*\| `21\.1\.x`.*\| \[MDK-1\.21\.1-ModDevGradle\]/m,
      /^\| 1\.21\.11 \| Java 21 .*\| Mojang names with Parchment .*\| `21\.11\.x`.*\| \[MDK-1\.21\.11-ModDevGradle\]/m,
      /^\| 26\.1\.2 \| Java 25 .*\| Mojang names, no obfuscation.*\| `26\.1\.2\.x`.*\| \[MDK-26\.1\.2-ModDevGradle\]/m,
      /^\| 26\.3 \| Java 25 .*\| Mojang names, no obfuscation.*\| `26\.3\.0\.x`.*\| \[MDK-26\.3-ModDevGradle\]/m
    ],
    forbidden: [
      /^\| [0-9.]+ \|.*\bunverified\b/m
    ]
  },
  {
    file: ".agents/skills/minecraft-neoforge/SKILL.md",
    required: [
      /1\.21\.1, 1\.21\.11, 26\.1\.2 and 26\.3/,
      /^\| \*\*NeoForge\*\* \| 1\.21\.1, 1\.21\.11, 26\.1\.2 and 26\.3 \| Java 25 for 26\.1\.2 and 26\.3, Java 21 for 1\.21\.1 and 1\.21\.11 \|/m,
      /\.\/gradlew runData/,
      /NeoForge project signature/,
      /references\/neoforge-api\.md/,
      /references\/common-patterns\.md/,
      /references\/versions\.md/,
      /scripts\/neoforge-jars\.init\.gradle printNeoForgeJars/,
      /bash <skill dir>\/scripts\/neoforge-jars\.sh/,
      /Identifier\.fromNamespaceAndPath/,
      /DeferredRegister\.createBlocks/,
      /GatherDataEvent\.Client/,
      /minecraft-multiloader/,
      /26\.3 is the default for new mods/,
      /## Checkpoints/,
      /\*\*Plan, then stop\.\*\*/,
      /Do not chain slices together\s+without approval/,
      /Always ask before:/,
      /adding, removing or upgrading a dependency/,
      /deleting or renaming files, registry ids or config keys/,
      /changing saved-data, attachment or data-component formats/,
      /running `runClient` or `runServer`/,
      /anything the plan did not cover/,
      /references\/new-mod-prompt\.md/,
      /references\/project-layout\.md/
    ],
    forbidden: [
      /fabric-api\.md/,
      /forge-1\.20\.1-api\.md/,
      /Registries\.SCREEN_HANDLER/,
      /ModInitializer/,
      /Julian/,
      /~\/\.agents/,
      /neoforge-mod-workflow/,
      /referencing-local-repos/,
      /^(?!.*MCP).*minecraft-modding/m,
      /\b26\.x\b/,
      /\b1\.21\.x\b/,
      /[Cc]urrent NeoForge/
    ]
  },
  {
    file: ".agents/skills/minecraft-neoforge/references/new-mod-prompt.md",
    required: [
      /`minecraft-neoforge` skill/,
      /26\.3 \(default\)/,
      /^\| 26\.3 \/ 26\.1\.2 \| 25 \|/m,
      /^\| 1\.21\.11 \| 21 \|.*`21\.11\.x`/m,
      /^\| 1\.21\.1 \| 21 \|.*`21\.1\.x`/m
    ],
    forbidden: [
      /Julian/,
      /~\/\.agents/,
      /neoforge-mod-workflow/,
      /referencing-local-repos/,
      /^(?!.*MCP).*minecraft-modding/m,
      /\b26\.1 \(default\)/
    ]
  },
  {
    file: ".agents/skills/minecraft-neoforge/scripts/check-build.sh",
    required: [
      /PLATFORM="neoforge"/,
      /parse_java_major/,
      /REQUIRED_JAVA=21/,
      /REQUIRED_JAVA=25/,
      /src\/main\/resources\/META-INF\/neoforge\.mods\.toml/
    ],
    forbidden: [
      /(?<!neo)forge/i,
      /fabric/i,
      /architectury/i,
      /\b26\.x\b/,
      /\b1\.21\.x\b/
    ]
  },
  {
    file: ".agents/skills/minecraft-fabric/references/fabric-api.md",
    required: [
      /minecraft_version=1\.21\.11/,
      /loader_version=0\.20\.1/,
      /loom_version=1\.19-SNAPSHOT/,
      /net\.fabricmc\.fabric-loom-remap/,
      /fabric_version=0\.141\.6\+1\.21\.11/,
      /yarn_mappings=1\.21\.11\+build\.6/,
      /"fabricloader": ">=0\.20\.1"/,
      /"fabric-api": ">=0\.141\.6\+1\.21\.11"/
    ],
    forbidden: [
      /0\.114\.0\+1\.21\.1/,
      /0\.116\.10\+1\.21\.1/,
      /loader_version=0\.17\.3/,
      /yarn_mappings=1\.21\.1\+build\.3/,
      /"fabric-api": "\*"/,
      /0\.19\.3/,
      /0\.141\.4/,
      /26\.x|1\.21\.x/
    ]
  },
  {
    file: ".agents/skills/minecraft-fabric/SKILL.md",
    required: [
      /Fabric\*\* \| 1\.21\.11, 26\.1\.2 and 26\.3 \| Java 25 for 26\.1\.2 and 26\.3, Java 21 for 1\.21\.11 \| Gradle \+ Fabric Loom 1\.19/,
      /\| 1\.21\.11 \| 0\.20\.1 \| 0\.141\.6\+1\.21\.11 \| `net\.fabricmc\.fabric-loom-remap` 1\.19-SNAPSHOT \|/,
      /\| 26\.1\.2 \| 0\.20\.1 \| 0\.155\.3\+26\.1\.2 \| `net\.fabricmc\.fabric-loom` 1\.19-SNAPSHOT \|/,
      /\| 26\.3 \| 0\.20\.1 \| 0\.166\.2\+26\.3 \| `net\.fabricmc\.fabric-loom` 1\.19-SNAPSHOT \|/,
      /Fabric project signature/,
      /references\/fabric-api\.md/,
      /Identifier\.fromNamespaceAndPath/,
      /Registries\.SCREEN_HANDLER/,
      /implements ModInitializer/,
      /spawnPlacement/,
      /CreativeModeTabEvents/
    ],
    forbidden: [
      /common-patterns\.md/,
      /neoforge-api\.md/,
      /forge-1\.20\.1-api\.md/,
      /0\.19\.3/,
      /0\.141\.4/,
      /26\.x|1\.21\.x/
    ]
  },
  {
    file: ".agents/skills/minecraft-fabric/scripts/check-build.sh",
    required: [
      /PLATFORM="fabric"/,
      /parse_java_major/,
      /REQUIRED_JAVA=21/,
      /REQUIRED_JAVA=25/,
      /Minecraft 1\.21\.11 requires Java 21/,
      /Minecraft 26\.1\.2 and 26\.3 require Java 25/,
      /src\/main\/resources\/fabric\.mod\.json/
    ],
    forbidden: [
      /forge/i,
      /architectury/i,
      /26\.x|1\.21\.x/
    ]
  },
  {
    file: ".agents/skills/minecraft-datapack/scripts/validate-datapack.sh",
    required: [
      /pack\.min_format/,
      /pack\.max_format/
    ]
  },
  {
    file: ".agents/skills/minecraft-resource-pack/scripts/validate-resource-pack.sh",
    required: [
      /pack\.min_format/,
      /pack\.max_format/
    ]
  },
  {
    file: "scripts/run-skill-validator-fixtures.sh",
    required: [
      /datapack legacy pack metadata/,
      /resource-pack legacy pack metadata/,
      /testing valid/,
      /multiloader valid/,
      /multiloader valid 26\.3/,
      /multiloader 26\.2 warns/
    ]
  }
];

let failures = 0;

const skillsDir = path.join(repoRoot, ".agents", "skills");
for (const name of fs.readdirSync(skillsDir).sort()) {
  const skillFile = path.join(skillsDir, name, "SKILL.md");
  if (!fs.existsSync(skillFile)) continue;
  const frontmatter = fs.readFileSync(skillFile, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  const description = String(yaml.load(frontmatter)?.description ?? "");
  for (const pattern of LOOSE_DESCRIPTION_PATTERNS) {
    if (pattern.test(description)) {
      console.error(`[FAIL] .agents/skills/${name}/SKILL.md description matches loose version pattern: ${pattern}`);
      failures += 1;
    }
  }
}

for (const check of descriptionsOnly ? [] : checks) {
  const target = path.join(repoRoot, check.file);
  const text = [target, ...(check.references ?? []).map((file) => path.join(repoRoot, file))]
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");

  for (const pattern of check.required ?? []) {
    if (!pattern.test(text)) {
      console.error(`[FAIL] ${check.file} missing required pattern: ${pattern}`);
      failures += 1;
    }
  }

  for (const pattern of check.forbidden ?? []) {
    if (pattern.test(text)) {
      console.error(`[FAIL] ${check.file} still matches forbidden pattern: ${pattern}`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`[FAIL] version drift check failed with ${failures} issue(s)`);
  process.exit(1);
}

console.log("[PASS] version drift check passed");
