#!/usr/bin/env node

import path from "path";
import fs from "fs";
import open from "open";
import { startServer } from "./server/index.js";
import { scanProject } from "./server/services/scanner.js";
import { generateSvg } from "./server/services/svg-export.js";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
  Usage: nextmap [options]

  Options:
    --port <number>   Port to run on (default: 3718)
    --no-browser      Don't open the browser automatically
    --export-svg      Export route map as SVG and exit
    -o <file>         Output file for SVG export (default: nextmap.svg)
    -h, --help        Show this help message
`);
  process.exit(0);
}

const portIndex = args.indexOf("--port");
const preferredPort = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3718;
const noBrowser = args.includes("--no-browser");
const exportSvg = args.includes("--export-svg");
const outputIndex = args.indexOf("-o");
const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : "nextmap.svg";
const targetDir = process.env.TARGET_DIR || process.cwd();

// Verify it's a Next.js project
const hasNextConfig =
  fs.existsSync(path.join(targetDir, "next.config.js")) ||
  fs.existsSync(path.join(targetDir, "next.config.mjs")) ||
  fs.existsSync(path.join(targetDir, "next.config.ts"));
const hasAppDir =
  fs.existsSync(path.join(targetDir, "app")) ||
  fs.existsSync(path.join(targetDir, "src", "app"));
const hasPagesDir =
  fs.existsSync(path.join(targetDir, "pages")) ||
  fs.existsSync(path.join(targetDir, "src", "pages"));

if (!hasNextConfig && !hasAppDir && !hasPagesDir) {
  console.error(
    `\n  Error: No Next.js project found in ${targetDir}\n  Looking for: next.config.*, app/, or pages/ directory.\n`
  );
  process.exit(1);
}

// SVG export mode — no server needed
if (exportSvg) {
  const result = scanProject(targetDir);
  const svg = generateSvg(result.routes);
  fs.writeFileSync(outputFile, svg);
  console.log(`\n  🗺️  Exported ${result.routes.length} routes to ${outputFile}\n`);
  process.exit(0);
}

startServer(targetDir, preferredPort).then(({ port }) => {
  if (!noBrowser) {
    open(`http://localhost:${port}`);
  }
});
