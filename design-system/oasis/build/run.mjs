#!/usr/bin/env node
/**
 * Oasis design tokens build: JSON → SCSS (web) + TS (mobile).
 * Reads tokens/base/*.json and writes dist/scss/ and dist/tokens/.
 */

import { readdir, readFile, mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TOKENS_BASE = join(ROOT, "tokens", "base");
const DIST_SCSS = join(ROOT, "dist", "scss");
const DIST_TS = join(ROOT, "dist", "tokens");

async function loadTokenFiles() {
  const files = await readdir(TOKENS_BASE);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  const result = {};
  for (const f of jsonFiles) {
    const path = join(TOKENS_BASE, f);
    const content = JSON.parse(await readFile(path, "utf-8"));
    Object.assign(result, content);
  }
  return result;
}

function flattenTokens(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object" && "value" in v) {
      out[prefix ? `${prefix}-${k}` : k] = v.value;
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenTokens(v, prefix ? `${prefix}-${k}` : k));
    }
  }
  return out;
}

function toScss(tokens) {
  const lines = ["// Oasis design tokens – generated from JSON", ""];
  const byCategory = {};
  for (const [key, value] of Object.entries(tokens)) {
    const cat = key.split("-")[0];
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({ key, value });
  }
  for (const [cat, items] of Object.entries(byCategory)) {
    lines.push(`// ${cat}`);
    for (const { key, value } of items) {
      const scssKey = `$oasis-${key.replace(/-/g, "-")}`;
      const val = typeof value === "string" ? value : String(value);
      lines.push(`${scssKey}: ${val};`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function toScssBreakpointsAndMixins(tokens) {
  const breakpoints = {};
  for (const [k, v] of Object.entries(tokens)) {
    if (k.startsWith("breakpoint-")) {
      const name = k.replace("breakpoint-", "");
      breakpoints[name] = v;
    }
  }
  const lines = [
    "// Oasis breakpoints – use with @include oasis-breakpoint-up(sm) { ... }",
    "",
    "$oasis-breakpoints: (",
    ...Object.entries(breakpoints).map(([name, val]) => `  \"${name}\": ${val},`),
    ");",
    "",
    "@mixin oasis-breakpoint-up($name) {",
    "  @if map-has-key($oasis-breakpoints, $name) {",
    "    @media (min-width: map-get($oasis-breakpoints, $name)) { @content; }",
    "  }",
    "}",
    "",
    "@mixin oasis-breakpoint-down($name) {",
    "  @if map-has-key($oasis-breakpoints, $name) {",
    "    @media (max-width: calc(#{map-get($oasis-breakpoints, $name)} - 1px)) { @content; }",
    "  }",
    "}",
  ];
  return lines.join("\n");
}

function toTs(tokens) {
  const lines = [
    "// Oasis design tokens – generated from JSON (mobile/TS)",
    "",
  ];
  const bp = Object.entries(tokens)
    .filter(([k]) => k.startsWith("breakpoint-"))
    .reduce((acc, [k, v]) => {
      acc[k.replace("breakpoint-", "")] = v;
      return acc;
    }, {});
  lines.push("export const breakpoints = " + JSON.stringify(bp, null, 2) + " as const;");
  lines.push("");

  const rest = Object.entries(tokens).filter(([k]) => !k.startsWith("breakpoint-"));
  const byCategory = {};
  for (const [key, value] of rest) {
    const idx = key.indexOf("-");
    const cat = idx > 0 ? key.slice(0, idx) : "tokens";
    const subKey = idx > 0 ? key.slice(idx + 1) : key;
    if (!byCategory[cat]) byCategory[cat] = {};
    byCategory[cat][subKey] = value;
  }
  for (const [cat, obj] of Object.entries(byCategory)) {
    lines.push("export const " + cat + " = " + JSON.stringify(obj, null, 2) + " as const;");
    lines.push("");
  }
  lines.push("export default { breakpoints, " + Object.keys(byCategory).join(", ") + " };");
  return lines.join("\n");
}

async function main() {
  const raw = await loadTokenFiles();
  const flat = {};
  for (const [topKey, topVal] of Object.entries(raw)) {
    if (topVal && typeof topVal === "object") {
      for (const [k, v] of Object.entries(topVal)) {
        if (v && typeof v === "object" && "value" in v) {
          flat[`${topKey}-${k}`] = v.value;
        }
      }
    }
  }

  await mkdir(DIST_SCSS, { recursive: true });
  await mkdir(DIST_TS, { recursive: true });

  const scssVars = toScss(flat);
  const scssBreakpoints = toScssBreakpointsAndMixins(flat);

  await writeFile(join(DIST_SCSS, "_variables.scss"), scssVars, "utf-8");
  await writeFile(join(DIST_SCSS, "_breakpoints.scss"), scssBreakpoints, "utf-8");
  await writeFile(
    join(DIST_SCSS, "oasis.scss"),
    '// Oasis – design tokens (SCSS)\n@forward "variables";\n@forward "breakpoints";\n',
    "utf-8"
  );

  const tsContent = toTs(flat);
  await writeFile(join(DIST_TS, "index.ts"), tsContent, "utf-8");

  console.log("Oasis build done: dist/scss/, dist/tokens/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
