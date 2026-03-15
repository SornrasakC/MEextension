#!/usr/bin/env bun
/// <reference types="bun-types" />

/**
 * CLI entry point for manga extraction.
 *
 * Usage:
 *   bun cli/extract.ts --reader takecomic --url "https://takecomic.jp/episodes/abc" [--out ./output]
 *   bun cli/extract.ts --reader speed-binb --url "https://storia.takeshobo.co.jp/..." [--out ./output] [--headed] [--profile ./chrome-profile]
 */

import { parseArgs } from "util";
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";

import { runDomHandler } from "./puppeteer-runner";

// ---------------------------------------------------------------------------
// Handler registry
// ---------------------------------------------------------------------------

type HandlerType = "api" | "dom";

interface HandlerEntry {
  type: HandlerType;
  /** Relative path from project root to the built handler JS (IIFE) */
  script: string;
  /** Human-readable label */
  label: string;
}

const HANDLERS: Record<string, HandlerEntry> = {
  takecomic: {
    type: "api",
    script: "build/handlers/takecomic.js",
    label: "Takecomic (Comici)",
  },
  "nico-douga": {
    type: "api",
    script: "build/handlers/nico-douga.js",
    label: "Nico Douga",
  },
  "comic-walker": {
    type: "api",
    script: "build/handlers/comic-walker.js",
    label: "Comic Walker",
  },
  "speed-binb": {
    type: "dom",
    script: "build/handlers/speed-binb-reader.js",
    label: "Speed Binb Reader",
  },
  kindle: {
    type: "dom",
    script: "build/handlers/kindle.js",
    label: "Kindle",
  },
  comicbushi: {
    type: "dom",
    script: "build/handlers/comicbushi.js",
    label: "Comicbushi",
  },
  "comic-pixiv": {
    type: "dom",
    script: "build/handlers/comic-pixiv.js",
    label: "Comic Pixiv",
  },
  "nico-manga": {
    type: "dom",
    script: "build/handlers/nico-manga.js",
    label: "Nico Manga (manga.nicovideo.jp)",
  },
};

// ---------------------------------------------------------------------------
// Parse CLI arguments
// ---------------------------------------------------------------------------

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    reader: { type: "string", short: "r" },
    url: { type: "string", short: "u" },
    out: { type: "string", short: "o", default: "./output" },
    headed: { type: "boolean", default: false },
    profile: { type: "string" },
    login: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: true,
  allowPositionals: false,
});

if (values.help || !values.reader || !values.url) {
  console.log(`
Manga Extractor CLI
───────────────────
Usage:
  bun cli/extract.ts --reader <name> --url <url> [options]

Options:
  -r, --reader   Reader name (required). One of:
                 ${Object.keys(HANDLERS).join(", ")}
  -u, --url      URL to extract from (required)
  -o, --out      Output directory (default: ./output)
      --headed   Show the browser window
      --profile  Path to Chrome user data dir (for auth)
      --login    Open headed browser for manual login. Cookies saved for future runs.
  -h, --help     Show this help

Examples:
  bun cli/extract.ts --reader takecomic --url "https://takecomic.jp/episodes/abc123"
  bun cli/extract.ts --reader nico-manga --url "https://manga.nicovideo.jp/watch/mg472312" --login
  bun cli/extract.ts --reader speed-binb --url "https://storia.takeshobo.co.jp/..." --headed
`);
  process.exit(values.help ? 0 : 1);
}

const readerKey = values.reader!.toLowerCase();
const handler = HANDLERS[readerKey];

if (!handler) {
  console.error(
    `Unknown reader: "${values.reader}"\nAvailable: ${Object.keys(HANDLERS).join(", ")}`
  );
  process.exit(1);
}

const outputDir = resolve(values.out!);
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Cookie file for session persistence
// ---------------------------------------------------------------------------

const cookieDir = resolve("cli/cookies");
if (!existsSync(cookieDir)) {
  mkdirSync(cookieDir, { recursive: true });
}
const cookieFile = resolve(cookieDir, `${readerKey}.json`);

// --login forces headed mode (need visible browser for manual login)
const isLogin = values.login ?? false;
const isHeaded = isLogin || values.headed;

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

console.log(`\n  Reader:  ${handler.label}`);
console.log(`  Type:    ${handler.type}`);
console.log(`  URL:     ${values.url}`);
console.log(`  Output:  ${outputDir}`);
if (existsSync(cookieFile)) {
  console.log(`  Cookies: ${cookieFile}`);
}
if (isLogin) {
  console.log(`  Mode:    Login (will pause for manual auth)`);
}
console.log();

const startTime = performance.now();

try {
  if (handler.type === "dom") {
    // DOM-based: use Puppeteer to navigate + inject handler
    const scriptPath = resolve(handler.script);
    if (!existsSync(scriptPath)) {
      console.error(
        `Handler script not found: ${scriptPath}\nRun "bun run build" first.`
      );
      process.exit(1);
    }

    await runDomHandler({
      url: values.url!,
      handlerScript: scriptPath,
      outputDir,
      headless: !isHeaded,
      userDataDir: values.profile,
      cookieFile,
      login: isLogin,
    });
  } else {
    // API-based: use Puppeteer too, but only to get into the page context
    // (the handler still needs fetch with cookies, page origin, etc.)
    // For now, all handlers go through Puppeteer injection.
    // Pure-Node extraction can be added per-handler later.
    const scriptPath = resolve(handler.script);
    if (!existsSync(scriptPath)) {
      console.error(
        `Handler script not found: ${scriptPath}\nRun "bun run build" first.`
      );
      process.exit(1);
    }

    await runDomHandler({
      url: values.url!,
      handlerScript: scriptPath,
      outputDir,
      headless: !isHeaded,
      userDataDir: values.profile,
      cookieFile,
      login: isLogin,
    });
  }

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
  console.log(`\nExtraction completed in ${elapsed}s`);
  console.log(`Output: ${outputDir}`);
  console.log(`\nRun verification:\n  bun cli/verify.ts --input "${outputDir}"\n`);
} catch (error) {
  console.error("\nExtraction failed:", error);
  process.exit(1);
}
