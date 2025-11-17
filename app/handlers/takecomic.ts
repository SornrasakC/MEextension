import { timeout, zipAndDownload } from "../utils/utils";

type ContentsInfo = {
    totalPages: number;
    result: Array<PagePayload>;
};

type PagePayload = {
    imageUrl: string;
    scramble?: string | number[];
    sort?: number;
    width?: number;
    height?: number;
};

type PageCapture = { pageId: number; dataUrl: string };

const FALLBACK_PATTERN = [11, 6, 1, 8, 14, 7, 0, 4, 9, 15, 13, 10, 12, 5, 2, 3];
const TILES_PER_SIDE = 4; // Preferred grid (4x4)

async function main() {
    console.log("Takecomic (Comici) handler starting with API descrambler...");

    const metadata = extractMetadata();
    const viewerId = extractViewerId();

    if (!viewerId) {
        alert(
            'Could not locate the Comici viewer ID.\nPlease open a chapter and ensure the reader is fully loaded (button "開いて読む").'
        );
        return;
    }

    try {
        const contents = await fetchContentsInfo(viewerId);
        const pagesMeta = (contents?.result || []).slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

        if (pagesMeta.length === 0) {
            alert("Could not find any pages in the API response. Please reload the viewer and try again.");
            return;
        }

        console.log(`Found ${pagesMeta.length} pages from API. Downloading & descrambling...`);

        const captures: PageCapture[] = [];
        for (let i = 0; i < pagesMeta.length; i++) {
            const pageNumber = i + 1;
            const meta = pagesMeta[i];

            console.log(`→ Processing page ${pageNumber}/${pagesMeta.length}`);
            try {
                const capture = await downloadAndDescramble(meta, pageNumber, viewerId);
                if (capture) {
                    captures.push(capture);
                } else {
                    console.warn(`✗ Skipped page ${pageNumber}: no data returned`);
                }
            } catch (error) {
                console.error(`✗ Failed to process page ${pageNumber}`, error);
            }

            // Gentle pacing to avoid flooding the API
            await timeout(50);
        }

        if (captures.length === 0) {
            alert("Failed to process any pages. Check console logs for details.");
            return;
        }

        console.log(`✓ Successfully processed ${captures.length} pages. Creating ZIP...`);
        zipAndDownload(captures, { FILENAME_PREFIX: metadata.title, CHAPTER: metadata.chapter });
    } catch (error) {
        console.error("Takecomic handler failed:", error);
        alert("Failed to process Takecomic chapter. Check console for details.");
    }
}

function extractMetadata(): { title: string; chapter: string } {
    let title = "unknown";
    let chapter = "01";

    const titleElement =
        document.querySelector("h1") ||
        document.querySelector('[class*="title"]') ||
        document.querySelector('[class*="episode"]') ||
        document.querySelector("title");

    if (titleElement?.textContent) {
        title = titleElement.textContent.trim();
    }

    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
    if (ogTitle) {
        title = ogTitle.trim();
    }

    const chapterPatterns = [
        /第(\d+)[話巻]/,
        /(\d+)[話巻]/,
        /[Ee]pisode\s*(\d+)/,
        /[Cc]hapter\s*(\d+)/,
        /#(\d+)/,
        /ep\.?\s*(\d+)/i,
    ];

    for (const pattern of chapterPatterns) {
        const match = title.match(pattern);
        if (match) {
            chapter = match[1].padStart(2, "0");
            break;
        }
    }

    if (chapter === "01") {
        const breadcrumbs = document.querySelector('[class*="breadcrumb"]');
        const breadcrumbText = breadcrumbs?.textContent ?? "";
        for (const pattern of chapterPatterns) {
            const match = breadcrumbText.match(pattern);
            if (match) {
                chapter = match[1].padStart(2, "0");
                break;
            }
        }
    }

    console.log(`Extracted metadata → Title: "${title}", Chapter: "${chapter}"`);
    return { title, chapter };
}

function extractViewerId(): string | null {
    const selectors = [
        "[data-comici-viewer-id]",
        "[data-viewer-id]",
        "[data-viewerid]",
        "[data-comic-viewerid]",
        "#viewer",
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector) as HTMLElement | null;
        if (!element) continue;
        const attrNames = ["data-comici-viewer-id", "data-viewer-id", "data-viewerid", "data-viewerId"];
        for (const attr of attrNames) {
            const value = element.getAttribute(attr);
            if (value && value.trim()) {
                console.log(`Found viewer ID via ${selector} (${attr}).`);
                return value.trim();
            }
        }
        if (element.dataset?.viewerId) {
            console.log(`Found viewer ID via ${selector} (dataset).`);
            return element.dataset.viewerId.trim();
        }
    }

    const metaViewer = document.querySelector('meta[name="comici-viewer-id"]')?.getAttribute("content");
    if (metaViewer) {
        console.log("Found viewer ID via meta tag.");
        return metaViewer.trim();
    }

    const scriptMatch = extractViewerIdFromScripts();
    if (scriptMatch) {
        console.log("Found viewer ID via inline script.");
        return scriptMatch;
    }

    const globalAny = window as Record<string, unknown>;
    const candidates = [
        (globalAny.__NUXT__ as any)?.state?.viewerId,
        (globalAny.__NUXT__ as any)?.state?.book?.viewerId,
        (globalAny.__NUXT__ as any)?.state?.episode?.viewerId,
        (globalAny.__NEXT_DATA__ as any)?.props?.pageProps?.viewerId,
        (globalAny as any).viewerId,
        (globalAny as any).__VIEWER_ID__,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.length > 6) {
            console.log("Found viewer ID via global state.");
            return candidate;
        }
    }

    return null;
}

function extractViewerIdFromScripts(): string | null {
    const scripts = Array.from(document.querySelectorAll("script"));
    for (const script of scripts) {
        const text = script.textContent;
        if (!text) continue;
        const match =
            text.match(/comiciViewerId["']?\s*[:=]\s*["']([a-z0-9_-]+)["']/i) ||
            text.match(/viewerId["']?\s*[:=]\s*["']([a-z0-9_-]+)["']/i);
        if (match) {
            return match[1];
        }
    }
    return null;
}

function extractEpisodeId(): string | null {
    const match = window.location.pathname.match(/episodes\/([a-z0-9]+)/i);
    return match ? match[1] : null;
}

async function fetchContentsInfo(viewerId: string): Promise<ContentsInfo> {
    const probe = await requestContentsInfoRange(viewerId, 0, 1);

    if (!probe || !probe.result?.length) {
        throw new Error("contentsInfo probe returned no pages");
    }

    const totalPages = probe.totalPages ?? probe.result.length;

    if (totalPages <= probe.result.length) {
        return probe;
    }

    const full = await requestContentsInfoRange(viewerId, 0, totalPages);
    if (!full || !full.result?.length) {
        console.warn("Full contentsInfo request failed, falling back to probe result");
        return probe;
    }

    return full;
}

async function requestContentsInfoRange(
    viewerId: string,
    pageFrom: number,
    pageTo: number
): Promise<ContentsInfo | null> {
    const url = new URL("/api/book/contentsInfo", window.location.origin);
    url.searchParams.set("user-id", "");
    url.searchParams.set("comici-viewer-id", viewerId);
    url.searchParams.set("page-from", String(Math.max(0, pageFrom)));
    url.searchParams.set("page-to", String(Math.max(pageFrom, pageTo)));

    const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
        headers: {
            Accept: "application/json, text/plain, */*",
            "Accept-Language": navigator.language ? `${navigator.language},en;q=0.8` : "en-US,en;q=0.8",
            Authorization: "",
        },
        referrer: window.location.href,
        referrerPolicy: "strict-origin-when-cross-origin",
        mode: "cors",
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.warn("contentsInfo request failed", response.status, response.statusText, text.slice(0, 200));
        return null;
    }

    return (await response.json()) as ContentsInfo;
}

async function downloadAndDescramble(meta: PagePayload, pageNumber: number, viewerId: string): Promise<PageCapture | null> {
    const imageUrl = buildImageUrl(meta.imageUrl, viewerId);
    if (!imageUrl) {
        console.warn(`Page ${pageNumber} is missing imageUrl`);
        return null;
    }

    const response = await fetch(imageUrl, {
        mode: "cors",
        credentials: "omit",
        headers: {
            Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            "Accept-Language": navigator.language ? `${navigator.language},en;q=0.8` : "en-US,en;q=0.8",
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch page image (${response.status})`);
    }

    const blob = await response.blob();
    const scramblePattern = parseScramblePattern(meta.scramble) ?? FALLBACK_PATTERN;
    const dataUrl = await descrambleBlob(blob, scramblePattern);

    console.log(`✓ Page ${pageNumber} descrambled (${Math.round(blob.size / 1024)} KB)`);
    return { pageId: pageNumber, dataUrl };
}

function buildImageUrl(rawUrl: string | undefined, viewerId: string): string | null {
    if (!rawUrl) return null;

    if (rawUrl.includes("viewer.takecomic.jp")) {
        return rawUrl;
    }

    try {
        const url = new URL(rawUrl, window.location.origin);
        return url.toString();
    } catch {
        // rawUrl might already be a file name; assemble manually
    }

    // Example format: master-{timestamp}-{page}.jpg
    const fileName = rawUrl.replace(/^\/+/, "");
    if (!fileName) return null;

    return `https://viewer.takecomic.jp/book/${viewerId}/${fileName}`;
}

function parseScramblePattern(scramble?: string | number[]): number[] | null {
    if (!scramble) return null;

    const parseArray = (raw: unknown): number[] | null => {
        if (!Array.isArray(raw)) return null;
        const values = raw.map((value) => Number(value)).filter((value) => Number.isFinite(value));
        return values.length ? values : null;
    };

    if (Array.isArray(scramble)) {
        return parseArray(scramble);
    }

    const trimmed = scramble.trim();
    if (!trimmed) return null;

    try {
        const parsed = JSON.parse(trimmed);
        const values = parseArray(parsed);
        if (values) return values;
    } catch {
        // Continue with manual split fallback below
    }

    const manual = trimmed
        .replace(/[\[\]]/g, "")
        .split(/[,|\s]+/)
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value));

    return manual.length ? manual : null;
}

async function descrambleBlob(blob: Blob, pattern: number[]): Promise<string> {
    const image = await blobToImage(blob);

    const scratch = document.createElement("canvas");
    scratch.width = image.width;
    scratch.height = image.height;
    const scratchCtx = scratch.getContext("2d");
    if (!scratchCtx) {
        throw new Error("Canvas 2D context unavailable");
    }
    scratchCtx.drawImage(image, 0, 0);

    if (pattern.length <= 1) {
        return scratch.toDataURL("image/png");
    }

    const { rows, cols } = inferGrid(pattern.length);
    const permutation = derivePermutation(pattern, rows, cols);

    if (permutation.length !== rows * cols) {
        console.warn("Permutation mismatch, returning original image");
        return scratch.toDataURL("image/png");
    }

    const output = document.createElement("canvas");
    output.width = image.width;
    output.height = image.height;
    const outputCtx = output.getContext("2d");
    if (!outputCtx) {
        throw new Error("Canvas 2D context unavailable for output");
    }

    const xSegments = buildSegments(image.width, cols);
    const ySegments = buildSegments(image.height, rows);

    for (let destIndex = 0; destIndex < permutation.length; destIndex++) {
        const srcIndex = permutation[destIndex];
        const sourceRect = getTileRect(srcIndex, xSegments, ySegments, cols);
        const destRect = getTileRect(destIndex, xSegments, ySegments, cols);

        outputCtx.drawImage(
            scratch,
            sourceRect.x,
            sourceRect.y,
            sourceRect.width,
            sourceRect.height,
            destRect.x,
            destRect.y,
            destRect.width,
            destRect.height
        );
    }

    return output.toDataURL("image/png");
}

function inferGrid(length: number): { rows: number; cols: number } {
    if (length === TILES_PER_SIDE * TILES_PER_SIDE) {
        return { rows: TILES_PER_SIDE, cols: TILES_PER_SIDE };
    }

    const sqrt = Math.sqrt(length);
    if (Number.isInteger(sqrt)) {
        return { rows: sqrt, cols: sqrt };
    }

    let bestRows = 1;
    let bestCols = length;
    let bestDiff = Number.MAX_SAFE_INTEGER;
    for (let rows = 1; rows <= length; rows++) {
        if (length % rows !== 0) continue;
        const cols = length / rows;
        const diff = Math.abs(rows - cols);
        if (diff < bestDiff) {
            bestDiff = diff;
            bestRows = rows;
            bestCols = cols;
        }
    }
    return { rows: bestRows, cols: bestCols };
}

function derivePermutation(pattern: number[], rows: number, cols: number): number[] {
    const destTransposed = transposePattern(pattern, rows, cols);
    return destTransposed.map((value) => transposeIndex(value, rows, cols));
}

function transposePattern(pattern: number[], rows: number, cols: number): number[] {
    const matrix: number[][] = [];
    for (let r = 0; r < rows; r++) {
        matrix.push(pattern.slice(r * cols, (r + 1) * cols));
    }

    const result: number[] = [];
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            result.push(matrix[r][c]);
        }
    }

    return result;
}

function transposeIndex(value: number, rows: number, cols: number): number {
    const r = Math.floor(value / cols);
    const c = value % cols;
    return c * cols + r;
}

type Segment = { start: number; size: number };

function buildSegments(total: number, parts: number): Segment[] {
    const base = Math.floor(total / parts);
    let remainder = total % parts;
    const segments: Segment[] = [];
    let cursor = 0;

    for (let i = 0; i < parts; i++) {
        const size = base + (remainder > 0 ? 1 : 0);
        segments.push({ start: cursor, size });
        cursor += size;
        if (remainder > 0) remainder -= 1;
    }

    return segments;
}

function getTileRect(index: number, columns: Segment[], rows: Segment[], cols: number) {
    const rowIndex = Math.floor(index / cols);
    const colIndex = index % cols;
    const col = columns[colIndex] ?? { start: 0, size: 0 };
    const row = rows[rowIndex] ?? { start: 0, size: 0 };
    return { x: col.start, y: row.start, width: col.size, height: row.size };
}

async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = (error) => {
            URL.revokeObjectURL(url);
            reject(error);
        };
        image.src = url;
    });
}

// === Main ===
main();
