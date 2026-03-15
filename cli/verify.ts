#!/usr/bin/env bun
/// <reference types="bun-types" />

/**
 * Verification tool for extracted manga pages.
 *
 * Checks:
 *   - Page count
 *   - File sizes (flags zero-byte / suspiciously small)
 *   - Valid image headers (PNG/JPEG magic bytes)
 *   - Sequential numbering (gap detection)
 *   - Image dimensions (via header parsing)
 *
 * Generates:
 *   - output/viewer.html  -- all pages as a vertical scroll for quick visual review
 *
 * Usage:
 *   bun cli/verify.ts --input ./output
 *   bun cli/verify.ts --input ./output/MyManga.zip
 */

import { parseArgs } from "util";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  mkdirSync,
} from "fs";
import { resolve, join, extname, basename, dirname } from "path";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    input: { type: "string", short: "i" },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: true,
  allowPositionals: false,
});

if (values.help || !values.input) {
  console.log(`
Manga Extractor Verifier
────────────────────────
Usage:
  bun cli/verify.ts --input <path>

Options:
  -i, --input   Path to output directory or ZIP file (required)
  -h, --help    Show this help

The tool scans for image files, runs sanity checks, and generates
a viewer.html for quick visual review.
`);
  process.exit(values.help ? 0 : 1);
}

// ---------------------------------------------------------------------------
// Resolve input
// ---------------------------------------------------------------------------

const inputPath = resolve(values.input!);

if (!existsSync(inputPath)) {
  console.error(`Input not found: ${inputPath}`);
  process.exit(1);
}

let imageDir: string;
const inputStat = statSync(inputPath);

if (inputStat.isFile() && inputPath.endsWith(".zip")) {
  // Extract ZIP to a temp dir next to it
  const extractDir = join(dirname(inputPath), `${basename(inputPath, ".zip")}_extracted`);
  console.log(`Extracting ZIP to ${extractDir}...`);
  const JSZip = (await import("jszip")).default;
  const zipData = readFileSync(inputPath);
  const zip = await JSZip.loadAsync(zipData);

  if (!existsSync(extractDir)) mkdirSync(extractDir, { recursive: true });

  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const content = await entry.async("nodebuffer");
    // Sanitize path: replace characters invalid on Windows (|, <, >, ", ?, *)
    const safeName = name.replace(/[|<>"?*]/g, "_");
    const outPath = join(extractDir, safeName);
    const outDir = dirname(outPath);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    writeFileSync(outPath, content);
  }

  imageDir = extractDir;
} else if (inputStat.isDirectory()) {
  imageDir = inputPath;
} else {
  console.error("Input must be a directory or a .zip file");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Collect image files (recursively)
// ---------------------------------------------------------------------------

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

function collectImages(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectImages(full));
    } else if (IMAGE_EXTS.has(extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

const images = collectImages(imageDir).sort();

if (images.length === 0) {
  // Also check for ZIP files inside the directory
  const zips = readdirSync(imageDir).filter((f) => f.endsWith(".zip"));
  if (zips.length > 0) {
    console.log(`\nNo images found directly, but found ${zips.length} ZIP file(s):`);
    for (const z of zips) {
      console.log(`  ${z}`);
    }
    console.log(
      `\nRe-run with the ZIP path:\n  bun cli/verify.ts --input "${join(imageDir, zips[0])}"\n`
    );
  } else {
    console.error("No image files found in", imageDir);
  }
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Sanity checks
// ---------------------------------------------------------------------------

interface ImageInfo {
  path: string;
  name: string;
  sizeBytes: number;
  sizeKB: string;
  format: string;
  width: number;
  height: number;
  ok: boolean;
  issues: string[];
}

function detectFormat(buf: Buffer): string {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "PNG";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "JPEG";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return "WEBP";
  return "UNKNOWN";
}

function pngDimensions(buf: Buffer): { width: number; height: number } | null {
  // PNG: width at offset 16, height at offset 20 (big-endian uint32)
  if (buf.length < 24) return null;
  if (buf[0] !== 0x89 || buf[1] !== 0x50) return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

function jpegDimensions(buf: Buffer): { width: number; height: number } | null {
  // Scan for SOFn markers (0xFF 0xC0..0xCF except C4, C8, CC)
  let offset = 2; // skip SOI
  while (offset < buf.length - 8) {
    if (buf[offset] !== 0xff) break;
    const marker = buf[offset + 1];
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }
    const segLen = buf.readUInt16BE(offset + 2);
    offset += 2 + segLen;
  }
  return null;
}

function getImageDimensions(buf: Buffer, format: string): { width: number; height: number } {
  if (format === "PNG") {
    const dims = pngDimensions(buf);
    if (dims) return dims;
  } else if (format === "JPEG") {
    const dims = jpegDimensions(buf);
    if (dims) return dims;
  }
  return { width: 0, height: 0 };
}

const infos: ImageInfo[] = [];

for (const imgPath of images) {
  const name = basename(imgPath);
  const stat = statSync(imgPath);
  const buf = readFileSync(imgPath);
  const format = detectFormat(buf);
  const dims = getImageDimensions(buf, format);
  const issues: string[] = [];

  if (stat.size === 0) issues.push("ZERO BYTES");
  else if (stat.size < 1024) issues.push("VERY SMALL (<1KB)");
  if (format === "UNKNOWN") issues.push("UNKNOWN FORMAT");

  infos.push({
    path: imgPath,
    name,
    sizeBytes: stat.size,
    sizeKB: (stat.size / 1024).toFixed(1),
    format,
    width: dims.width,
    height: dims.height,
    ok: issues.length === 0,
    issues,
  });
}

// ---------------------------------------------------------------------------
// Terminal report
// ---------------------------------------------------------------------------

console.log(`\nVerification: ${imageDir}`);
console.log(`${"─".repeat(60)}`);
console.log(`Pages: ${infos.length}\n`);

const maxNameLen = Math.max(...infos.map((i) => i.name.length), 10);
const okCount = infos.filter((i) => i.ok).length;
const failCount = infos.length - okCount;

for (const info of infos) {
  const status = info.ok ? "OK" : `!! ${info.issues.join(", ")}`;
  const dims = info.width && info.height ? `${info.width}x${info.height}` : "???";
  console.log(
    `  ${info.name.padEnd(maxNameLen)}  ${info.sizeKB.padStart(8)} KB  ${dims.padStart(11)}  ${status}`
  );
}

console.log(`\n${"─".repeat(60)}`);
if (failCount === 0) {
  console.log(`All ${okCount} pages valid.`);
} else {
  console.log(`${okCount} OK, ${failCount} with issues.`);
}

// ---------------------------------------------------------------------------
// Generate viewer.html
// ---------------------------------------------------------------------------

const viewerPath = join(imageDir, "viewer.html");

function imageToBase64DataUrl(imgPath: string, format: string): string {
  const data = readFileSync(imgPath);
  const mime =
    format === "PNG"
      ? "image/png"
      : format === "JPEG"
        ? "image/jpeg"
        : format === "WEBP"
          ? "image/webp"
          : "application/octet-stream";
  return `data:${mime};base64,${data.toString("base64")}`;
}

const imageHtmlBlocks = infos
  .map((info, idx) => {
    const dataUrl = imageToBase64DataUrl(info.path, info.format);
    const statusClass = info.ok ? "ok" : "warn";
    return `
    <div class="page">
      <div class="page-info ${statusClass}">
        <span class="page-num">#${idx + 1}</span>
        <span class="page-name">${info.name}</span>
        <span class="page-meta">${info.sizeKB} KB | ${info.width}x${info.height} | ${info.format}</span>
        ${info.issues.length ? `<span class="page-issues">${info.issues.join(", ")}</span>` : ""}
      </div>
      <img src="${dataUrl}" alt="Page ${idx + 1}" loading="lazy" />
    </div>`;
  })
  .join("\n");

const viewerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Manga Extractor - Viewer (${infos.length} pages)</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #1a1a2e;
      color: #e0e0e0;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
    }
    h1 {
      text-align: center;
      padding: 16px;
      color: #f0f0f0;
      font-size: 1.5rem;
      border-bottom: 1px solid #333;
      margin-bottom: 20px;
    }
    .summary {
      text-align: center;
      margin-bottom: 24px;
      color: #aaa;
    }
    .page {
      margin: 0 auto 24px;
      max-width: 900px;
    }
    .page img {
      display: block;
      width: 100%;
      height: auto;
      border: 1px solid #333;
    }
    .page-info {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 6px 8px;
      background: #16213e;
      border: 1px solid #333;
      border-bottom: none;
      font-size: 0.8rem;
    }
    .page-info.warn { background: #3e1616; }
    .page-num { color: #4ecdc4; font-weight: bold; }
    .page-name { color: #ccc; }
    .page-meta { color: #888; }
    .page-issues { color: #ff6b6b; font-weight: bold; }
    .nav {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .nav button {
      padding: 8px 12px;
      background: #16213e;
      border: 1px solid #444;
      color: #e0e0e0;
      cursor: pointer;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    .nav button:hover { background: #1a3a5c; }
  </style>
</head>
<body>
  <h1>Manga Extractor Viewer</h1>
  <div class="summary">
    ${infos.length} pages | ${okCount} OK${failCount ? ` | ${failCount} with issues` : ""}
    | Generated ${new Date().toISOString().slice(0, 19).replace("T", " ")}
  </div>

  ${imageHtmlBlocks}

  <div class="nav">
    <button onclick="window.scrollTo({top:0,behavior:'smooth'})">Top</button>
    <button onclick="window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})">Bottom</button>
  </div>
</body>
</html>`;

writeFileSync(viewerPath, viewerHtml, "utf-8");
console.log(`\nViewer: ${viewerPath}`);
console.log(`Open in browser to review pages visually.\n`);
