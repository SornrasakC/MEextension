#!/usr/bin/env bun
/// <reference types="bun-types" />

/**
 * Shared Puppeteer runner for DOM-based (and API-based) handlers.
 *
 * Launches a real Chrome browser, navigates to the target URL,
 * injects the handler script, and intercepts the resulting download.
 */

import puppeteer, { type Browser, type Page } from "puppeteer";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "fs";
import { resolve, join, dirname } from "path";

export interface RunDomHandlerOptions {
  /** URL to navigate to */
  url: string;
  /** Absolute path to the built handler JS file */
  handlerScript: string;
  /** Directory where downloaded files will be saved */
  outputDir: string;
  /** Run headless (default true) */
  headless?: boolean;
  /** Chrome user-data-dir for reusing login sessions */
  userDataDir?: string;
  /** Maximum time to wait for extraction in ms (default 5 minutes) */
  timeout?: number;
  /** Path to a cookie JSON file for session persistence */
  cookieFile?: string;
  /** If true, pause after navigation for manual login and save cookies */
  login?: boolean;
}

export interface RunResult {
  /** Files that appeared in the output directory */
  downloadedFiles: string[];
  /** Whether the handler completed (vs timed out) */
  completed: boolean;
}

/**
 * Launch Chrome, navigate to url, inject handlerScript, wait for download.
 */
export async function runDomHandler(
  opts: RunDomHandlerOptions
): Promise<RunResult> {
  const {
    url,
    handlerScript,
    outputDir,
    headless = true,
    userDataDir,
    timeout = 5 * 60 * 1000,
    cookieFile,
    login = false,
  } = opts;

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Snapshot files already present so we can detect new ones
  const existingFiles = new Set(safeReaddir(outputDir));

  console.log("Launching browser...");

  const launchArgs: string[] = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-blink-features=AutomationControlled",
  ];

  const browser: Browser = await puppeteer.launch({
    headless: headless ? true : false,
    args: launchArgs,
    defaultViewport: { width: 1280, height: 900 },
    ...(userDataDir ? { userDataDir: resolve(userDataDir) } : {}),
  });

  const page: Page = await browser.newPage();

  // ---- Bypass Content Security Policy ----------------------------------
  // Handlers fetch images from domains (e.g. viewer.takecomic.jp) that the
  // page's CSP connect-src does not allow. Chrome extensions bypass CSP
  // automatically, but Puppeteer-injected scripts do not.
  await page.setBypassCSP(true);

  // ---- Download interception via CDP -----------------------------------
  const client = await page.createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: resolve(outputDir),
  });

  // Also use the newer Browser.setDownloadBehavior if available
  try {
    await client.send("Browser.setDownloadBehavior" as any, {
      behavior: "allow",
      downloadPath: resolve(outputDir),
      eventsEnabled: true,
    });
  } catch {
    // Older Chrome versions may not support this; that's OK
  }

  // ---- Load saved cookies before navigation ------------------------------
  if (cookieFile && existsSync(cookieFile)) {
    try {
      const cookies = JSON.parse(readFileSync(cookieFile, "utf-8"));
      await page.setCookie(...cookies);
      console.log(`Loaded ${cookies.length} saved cookies from ${cookieFile}`);
    } catch (err) {
      console.warn("Failed to load cookies:", err);
    }
  }

  // ---- Navigate --------------------------------------------------------
  console.log(`Navigating to ${url} ...`);
  await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: 60_000,
  });

  // ---- Login mode: pause for manual auth, then save cookies -------------
  if (login) {
    console.log("\n  ┌──────────────────────────────────────────────┐");
    console.log("  │  Log in to the site in the browser window.   │");
    console.log("  │  Press Enter here when done...               │");
    console.log("  └──────────────────────────────────────────────┘\n");
    await waitForEnter();

    if (cookieFile) {
      const cookieDir = dirname(cookieFile);
      if (!existsSync(cookieDir)) {
        mkdirSync(cookieDir, { recursive: true });
      }
      const cookies = await page.cookies();
      writeFileSync(cookieFile, JSON.stringify(cookies, null, 2));
      console.log(`Saved ${cookies.length} cookies to ${cookieFile}`);
    }

    // Reload to pick up the authenticated state
    console.log("Reloading page with authenticated session...");
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60_000,
    });
  }

  console.log("Page loaded. Injecting handler script...");

  // ---- Capture page console output (MUST be before handler injection) ---
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === "error") {
      console.error(`[page] ${text}`);
    } else if (type === "warn") {
      console.warn(`[page] ${text}`);
    } else {
      console.log(`[page] ${text}`);
    }
  });

  // ---- Inject handler --------------------------------------------------
  // Override alert/confirm so they don't block headless execution
  await page.evaluate(() => {
    window.alert = (msg?: string) => console.warn("[alert]", msg);
    window.confirm = (_msg?: string) => true;
    window.prompt = (_msg?: string, def?: string) => def ?? "";
  });

  await page.addScriptTag({ path: handlerScript });
  console.log("Handler injected. Waiting for extraction to complete...");

  // ---- Wait for download -----------------------------------------------
  const completed = await waitForNewFiles(outputDir, existingFiles, timeout);

  // Give a little extra time for file-saver to finish writing
  await new Promise((r) => setTimeout(r, 2000));

  const allFiles = safeReaddir(outputDir);
  const newFiles = allFiles.filter((f) => !existingFiles.has(f));

  if (newFiles.length > 0) {
    console.log(`\nDownloaded ${newFiles.length} file(s):`);
    for (const f of newFiles) {
      const stat = statSync(join(outputDir, f));
      const sizeKB = (stat.size / 1024).toFixed(1);
      console.log(`  ${f}  (${sizeKB} KB)`);
    }
  } else {
    console.warn("\nNo new files detected in output directory.");
    console.log(
      "The handler may have written to a different location, or extraction failed."
    );
    console.log("Check the browser console output above for details.");
  }

  await browser.close();

  return {
    downloadedFiles: newFiles,
    completed,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeReaddir(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

/**
 * Poll the output directory for new files. Returns true if new files
 * appeared within the timeout, false if timed out.
 */
async function waitForNewFiles(
  dir: string,
  existingFiles: Set<string>,
  timeout: number
): Promise<boolean> {
  const pollInterval = 2000; // 2 seconds
  const deadline = Date.now() + timeout;
  let lastCount = 0;
  let stableChecks = 0;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const current = safeReaddir(dir);
    const newFiles = current.filter(
      (f) => !existingFiles.has(f) && !f.endsWith(".crdownload") && !f.endsWith(".tmp")
    );

    if (newFiles.length > 0) {
      // Files appeared -- wait for them to stabilize (no new files for 3 checks)
      if (newFiles.length === lastCount) {
        stableChecks++;
        if (stableChecks >= 3) {
          return true;
        }
      } else {
        stableChecks = 0;
        lastCount = newFiles.length;
      }
    }
  }

  // Check one final time
  const finalFiles = safeReaddir(dir).filter(
    (f) => !existingFiles.has(f) && !f.endsWith(".crdownload") && !f.endsWith(".tmp")
  );
  return finalFiles.length > 0;
}

/**
 * Wait for the user to press Enter in the terminal.
 */
function waitForEnter(): Promise<void> {
  return new Promise((resolve) => {
    const onData = () => {
      process.stdin.removeListener("data", onData);
      process.stdin.pause();
      resolve();
    };
    process.stdin.resume();
    process.stdin.once("data", onData);
  });
}
