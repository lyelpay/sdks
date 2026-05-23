#!/usr/bin/env node
import { readFile, mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STYLES = join(ROOT, "styles");
const DIST = join(ROOT, "dist");

const theme = await readFile(join(STYLES, "oasis-theme.css"), "utf-8");
const components = await readFile(join(STYLES, "oasis-components.css"), "utf-8");
await mkdir(DIST, { recursive: true });
await writeFile(join(DIST, "styles.css"), theme + "\n" + components, "utf-8");
console.log("Oasis styles copied to dist/styles.css");
