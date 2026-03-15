/**
 * Handler: {READER_NAME}
 * Type: API-based | DOM-based
 * Target: {site URL pattern, e.g. https://example.com/reader/*}
 *
 * Status: WIP
 * Last tested: {date}
 * Test URL: {url}
 */

import { timeout, zipAndDownload } from "../utils/utils";

// === Types ===

export type PageCapture = { pageId: number; dataUrl: string };

// Add handler-specific types here:
// type PageMeta = { imageUrl: string; ... };

// === Constants ===

// Site-specific constants, selectors, API endpoints
// const API_ENDPOINT = "/api/...";
// const PAGE_SELECTOR = ".page-container";

// === Main ===

export async function main() {
    console.log("{READER_NAME} handler starting...");

    // 1. Extract metadata (title, chapter) from the current page
    const metadata = extractMetadata();
    console.log(`Metadata: "${metadata.title}" Ch.${metadata.chapter}`);

    // 2. Get page list (via API call or DOM scan)
    const pages = await getPages();
    if (pages.length === 0) {
        alert("No pages found. Make sure the reader is fully loaded.");
        return;
    }
    console.log(`Found ${pages.length} pages. Processing...`);

    // 3. Download and process each page
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

        // Gentle pacing to avoid rate limits
        await timeout(100);
    }

    if (captures.length === 0) {
        alert("Failed to extract any pages. Check console for details.");
        return;
    }

    // 4. Package and download
    console.log(`Successfully processed ${captures.length} pages. Creating ZIP...`);
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

    // TODO: Extract title from page
    // Examples:
    //   const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
    //   const h1 = document.querySelector("h1")?.textContent;

    // TODO: Extract chapter number
    // Examples:
    //   const match = title.match(/第(\d+)[話巻]/);
    //   if (match) chapter = match[1].padStart(2, "0");

    return { title, chapter };
}

// === Page Discovery ===

export async function getPages(): Promise<unknown[]> {
    // TODO: Return an array of page metadata/elements
    //
    // API-based example:
    //   const response = await fetch("/api/pages?id=...");
    //   const data = await response.json();
    //   return data.pages;
    //
    // DOM-based example:
    //   return Array.from(document.querySelectorAll(".page-container"));

    return [];
}

// === Page Processing ===

async function processPage(
    _pageData: unknown,
    pageNumber: number
): Promise<PageCapture | null> {
    // TODO: Download/capture the page image and return as data URL
    //
    // API-based example:
    //   const response = await fetch(pageData.imageUrl);
    //   const blob = await response.blob();
    //   const dataUrl = await descramble(blob, pageData.scramblePattern);
    //   return { pageId: pageNumber, dataUrl };
    //
    // DOM-based example (with dom-to-image):
    //   const element = pageData as HTMLElement;
    //   const dataUrl = await domtoimage.toPng(element);
    //   return { pageId: pageNumber, dataUrl };

    console.warn(`Page ${pageNumber}: processPage() not implemented`);
    return null;
}

// === Auto-execute ===
// This runs when the script is injected as IIFE (extension or Puppeteer).
main();
