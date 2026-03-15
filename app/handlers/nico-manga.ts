/**
 * Handler: Nico Manga
 * Type: DOM-based (canvas capture)
 * Target: https://manga.nicovideo.jp/watch/*
 *
 * Status: WIP
 * Last tested: 2026-02-14
 * Test URL: https://manga.nicovideo.jp/watch/mg472312
 *
 * Niconico Manga renders pages as <canvas> elements inside <li class="page">
 * containers. Pages lazy-load when scrolled into view. The canvas starts at
 * width=1 and expands once the image data is painted.
 *
 * Auth: Requires a logged-in Niconico session. Use --profile with CLI.
 */

import { timeout, zipAndDownload } from "../utils/utils";

// === Types ===

export type PageCapture = { pageId: number; dataUrl: string };

// === Constants ===

/** Selector for page list items in the Niconico manga reader */
const PAGE_SELECTOR = "li.page";

/** Selector for the rendered canvas (excludes balloon/comment overlays) */
const CANVAS_SELECTOR = "canvas:not(.balloon)";

/** Selector for fallback image elements */
const IMAGE_SELECTOR = "img[data-image-id]";

/** Max time (ms) to wait for a single page's canvas to render */
const PAGE_RENDER_TIMEOUT = 30_000;

/** Polling interval (ms) when waiting for canvas to render */
const POLL_INTERVAL = 1_000;

/** Delay (ms) between processing consecutive pages */
const INTER_PAGE_DELAY = 500;

// === Main ===

export async function main() {
    console.log("nico-manga handler starting...");

    // 1. Extract metadata (title, chapter) from the current page
    const metadata = extractMetadata();
    console.log(`Metadata: "${metadata.title}" Ch.${metadata.chapter}`);

    // 2. Get page list from DOM
    const pages = await getPages();
    if (pages.length === 0) {
        alert(
            "No pages found. Make sure you are logged in and the reader is fully loaded."
        );
        return;
    }
    console.log(`Found ${pages.length} pages. Processing...`);

    // 3. Process each page: scroll into view, wait for canvas, capture
    const captures: PageCapture[] = [];
    for (let i = 0; i < pages.length; i++) {
        const pageNumber = i + 1;
        console.log(`Processing page ${pageNumber}/${pages.length}...`);

        try {
            const capture = await processPage(pages[i], pageNumber);
            if (capture) {
                captures.push(capture);
            } else {
                console.warn(`Skipped page ${pageNumber}: no data returned`);
            }
        } catch (error) {
            console.error(`Failed page ${pageNumber}:`, error);
        }

        // Gentle pacing between pages
        await timeout(INTER_PAGE_DELAY);
    }

    if (captures.length === 0) {
        alert("Failed to extract any pages. Check console for details.");
        return;
    }

    // 4. Package and download
    console.log(
        `Successfully processed ${captures.length}/${pages.length} pages. Creating ZIP...`
    );
    zipAndDownload(captures, {
        FILENAME_PREFIX: metadata.title,
        CHAPTER: metadata.chapter,
    });

    return captures;
}

// === Metadata Extraction ===

export function extractMetadata(): { title: string; chapter: string } {
    let title = "unknown";
    let chapter = "01";

    // Try og:title first (e.g. "わたしが恋人になれるわけないじゃん... 第1話 / ...")
    const ogTitle = document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content");
    const pageTitle = ogTitle ?? document.title ?? "";

    if (pageTitle) {
        // Extract the series + episode portion (before " / " separator)
        const mainPart = pageTitle.split(" / ")[0].trim();
        title = mainPart || pageTitle;
    }

    // Extract chapter number from common patterns:
    //   第N話, 第N巻, 第N話（前編）, Episode N, etc.
    const chapterPatterns = [
        /第(\d+)話/,        // 第1話
        /第(\d+)巻/,        // 第1巻
        /(\d+)話/,          // 1話
        /Episode\s*(\d+)/i, // Episode 1
        /Ch\.?\s*(\d+)/i,   // Ch.1 or Ch 1
    ];

    for (const pattern of chapterPatterns) {
        const match = pageTitle.match(pattern);
        if (match) {
            chapter = match[1].padStart(2, "0");
            break;
        }
    }

    // Sanitize title for use as filename
    title = title.replace(/[/\\?%*:|"<>]/g, "").trim();

    return { title, chapter };
}

// === Page Discovery ===

export async function getPages(): Promise<HTMLElement[]> {
    const pages = Array.from(
        document.querySelectorAll<HTMLElement>(PAGE_SELECTOR)
    );

    if (pages.length === 0) {
        // Fallback: wait a moment and retry in case the reader hasn't rendered yet
        console.log("No pages found yet, waiting 3s for reader to initialize...");
        await timeout(3000);
        return Array.from(
            document.querySelectorAll<HTMLElement>(PAGE_SELECTOR)
        );
    }

    return pages;
}

// === Page Processing ===

export async function processPage(
    pageElement: HTMLElement,
    pageNumber: number
): Promise<PageCapture | null> {
    // Scroll the page element into view to trigger lazy loading
    pageElement.scrollIntoView({ behavior: "instant", block: "center" });

    // Wait a beat for the scroll to settle and rendering to start
    await timeout(200);

    // Poll until the canvas is rendered (width > 1) or timeout
    const startTime = Date.now();

    while (Date.now() - startTime < PAGE_RENDER_TIMEOUT) {
        // Try canvas first (primary rendering method)
        const canvas = pageElement.querySelector<HTMLCanvasElement>(CANVAS_SELECTOR);
        if (canvas && canvas.width > 1) {
            try {
                const dataUrl = canvas.toDataURL("image/png");
                if (dataUrl && dataUrl !== "data:,") {
                    return { pageId: pageNumber, dataUrl };
                }
            } catch (err) {
                console.warn(
                    `Page ${pageNumber}: canvas.toDataURL() failed (tainted?), trying fallback...`,
                    err
                );
                // Canvas may be tainted by cross-origin images -- try image fallback
                break;
            }
        }

        // Try image fallback
        const img = pageElement.querySelector<HTMLImageElement>(IMAGE_SELECTOR);
        if (img && img.complete && img.naturalWidth > 1) {
            try {
                const dataUrl = await imageToDataUrl(img);
                if (dataUrl) {
                    return { pageId: pageNumber, dataUrl };
                }
            } catch (err) {
                console.warn(
                    `Page ${pageNumber}: image fallback failed:`,
                    err
                );
            }
        }

        // Not ready yet -- wait and retry
        await timeout(POLL_INTERVAL);
    }

    // One final attempt after timeout
    const canvas = pageElement.querySelector<HTMLCanvasElement>(CANVAS_SELECTOR);
    if (canvas && canvas.width > 1) {
        try {
            const dataUrl = canvas.toDataURL("image/png");
            if (dataUrl && dataUrl !== "data:,") {
                return { pageId: pageNumber, dataUrl };
            }
        } catch {
            // Fall through
        }
    }

    console.warn(
        `Page ${pageNumber}: timed out after ${PAGE_RENDER_TIMEOUT / 1000}s`
    );
    return null;
}

// === Helpers ===

/**
 * Convert an <img> element to a data URL by drawing it onto a temporary canvas.
 * Attempts CORS-anonymous loading if the initial draw taints the canvas.
 */
async function imageToDataUrl(img: HTMLImageElement): Promise<string | null> {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);

    // Check if the canvas is tainted
    try {
        canvas.toDataURL(); // test access
    } catch {
        // Try again with CORS
        const corsImg = new Image();
        corsImg.crossOrigin = "anonymous";
        corsImg.src = img.src;
        await new Promise<void>((resolve, reject) => {
            corsImg.onload = () => resolve();
            corsImg.onerror = () => reject(new Error("CORS image load failed"));
        });

        canvas.width = corsImg.naturalWidth;
        canvas.height = corsImg.naturalHeight;
        ctx.drawImage(corsImg, 0, 0);
    }

    return canvas.toDataURL("image/png");
}

// === Auto-execute ===
// This runs when the script is injected as IIFE (extension or Puppeteer).
main();
