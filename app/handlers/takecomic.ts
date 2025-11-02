import axios from "axios";
import { zipAndDownload } from "../utils/utils";
import { PROGRESS_STATUS } from "../utils/constants";
import { storageGet } from "../utils/chrome/storage";

interface PageInfo {
    imageUrl: string;
    scramble: string; // JSON array as string
    sort: number;
    width: number;
    height: number;
    expiresOn: number;
}

interface ContentsResponse {
    totalPages: number;
    scrollDirection: string;
    spreadDesignation: number;
    result: PageInfo[];
}

// Extract metadata from page
function extractMetadata() {
    const title = document.querySelector('h1')?.textContent?.trim() || 
                  document.querySelector('[property="og:title"]')?.getAttribute('content') || 
                  "Unknown Title";
    
    // Try to extract chapter/episode number
    const chapterMatch = title.match(/(\d+)話/) || title.match(/第(\d+)話/) || title.match(/(\d+)/);
    const chapter = chapterMatch ? chapterMatch[1] : "0";
    
    // Clean title - remove chapter info
    const cleanTitle = title.replace(/・\d+話/, '').replace(/第\d+話/, '').trim();
    
    return {
        TITLE: cleanTitle,
        CHAPTER: chapter,
        FILENAME_PREFIX: `第${chapter}話 ${cleanTitle}`
    };
}

// Extract comici-viewer-id from page
function extractViewerId(): string | null {
    console.log('Starting viewerId extraction...');
    
    // Method 1: Check window.__NEXT_DATA__ (Next.js apps store data here)
    try {
        const nextData = (window as any).__NEXT_DATA__;
        if (nextData) {
            console.log('Found __NEXT_DATA__, searching for viewerId...');
            const jsonStr = JSON.stringify(nextData);
            const match = jsonStr.match(/"viewerId"\s*:\s*"([a-f0-9]{32,})"/i);
            if (match) {
                console.log('Found viewerId in __NEXT_DATA__:', match[1]);
                return match[1];
            }
        }
    } catch (e) {
        console.log('Error checking __NEXT_DATA__:', e);
    }
    
    // Method 2: Search through script tags
    console.log('Searching script tags...');
    const scripts = Array.from(document.querySelectorAll('script'));
    console.log(`Found ${scripts.length} script tags`);
    
    for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        const content = script.textContent || script.innerHTML;
        
        if (!content || content.length === 0) continue;
        
        // Try multiple patterns: "viewerId", "comici-viewer-id", etc.
        // Note: In Next.js script tags, quotes are often escaped as \"
        const patterns = [
            /\\"viewerId\\":\s*\\"([a-f0-9]{32,})\\"/i,  // Escaped quotes in Next.js
            /"viewerId"\s*:\s*"([a-f0-9]{32,})"/i,       // Regular quotes
            /'viewerId'\s*:\s*'([a-f0-9]{32,})'/i,       // Single quotes
            /comici-viewer-id["\s:=]+([a-f0-9]{32,})/i,
            /"viewer-id"\s*:\s*"([a-f0-9]{32,})"/i,
        ];
        
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                console.log(`Found viewerId in script tag ${i}:`, match[1]);
                return match[1];
            }
        }
        
        // Log if script contains viewerId keyword but didn't match
        if (content.toLowerCase().includes('viewerid') || content.toLowerCase().includes('viewer-id')) {
            console.log(`Script ${i} contains 'viewerId' keyword but no match. Sample:`, content.substring(0, 500));
        }
    }
    
    // Method 3: Check data attributes
    console.log('Checking data attributes...');
    const viewerElement = document.querySelector('[data-viewer-id]');
    if (viewerElement) {
        const id = viewerElement.getAttribute('data-viewer-id');
        console.log('Found viewerId in data attribute:', id);
        return id;
    }
    
    // Method 4: Check if there's a viewer container with data
    const viewerContainer = document.querySelector('[class*="viewer"]');
    if (viewerContainer) {
        console.log('Found viewer container:', viewerContainer.className);
        // Check all attributes
        for (const attr of Array.from(viewerContainer.attributes)) {
            console.log(`  Attribute: ${attr.name} = ${attr.value.substring(0, 100)}`);
        }
    }
    
    console.log('ViewerId not found with any method');
    return null;
}

// Unscramble image by rearranging tiles
async function unscrambleImage(imageUrl: string, scramblePattern: number[]): Promise<string> {
    try {
        // Fetch the image
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const blob = new Blob([response.data], { type: 'image/jpeg' });
        const imageBitmap = await createImageBitmap(blob);
        
        // Calculate tile dimensions (4x4 grid = 16 tiles)
        const tilesPerRow = 4;
        const tilesPerCol = 4;
        const tileWidth = imageBitmap.width / tilesPerRow;
        const tileHeight = imageBitmap.height / tilesPerCol;
        
        // Create canvas for unscrambling
        const canvas = document.createElement('canvas');
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }
        
        // Draw tiles in correct order
        for (let i = 0; i < scramblePattern.length; i++) {
            const scrambledIndex = scramblePattern[i];
            
            // Source position (scrambled)
            const srcX = (scrambledIndex % tilesPerRow) * tileWidth;
            const srcY = Math.floor(scrambledIndex / tilesPerRow) * tileHeight;
            
            // Destination position (correct order)
            const destX = (i % tilesPerRow) * tileWidth;
            const destY = Math.floor(i / tilesPerRow) * tileHeight;
            
            ctx.drawImage(
                imageBitmap,
                srcX, srcY, tileWidth, tileHeight,
                destX, destY, tileWidth, tileHeight
            );
        }
        
        // Convert canvas to data URL
        return canvas.toDataURL('image/jpeg', 0.95);
    } catch (error) {
        console.error('Error unscrambling image:', error);
        // Fallback: return original image as data URL
        try {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const base64 = btoa(
                new Uint8Array(response.data).reduce(
                    (data, byte) => data + String.fromCharCode(byte),
                    ''
                )
            );
            return `data:image/jpeg;base64,${base64}`;
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            throw fallbackError;
        }
    }
}

// Port management
let port: chrome.runtime.Port | null = null;
let connName: string | null = null;

function createPort() {
    if (port) {
        try {
            port.disconnect();
        } catch (_e) {
            // Port already disconnected
        }
    }
    
    port = chrome.runtime.connect({ name: connName || undefined });
    
    port.onDisconnect.addListener(() => {
        console.log("Port disconnected, will reconnect on next message");
        port = null;
    });
    
    return port;
}

function safePostMessage(message: any) {
    try {
        if (!port || !('name' in port)) {
            port = createPort();
        }
        port.postMessage(message);
    } catch (_error) {
        console.log("Port disconnected, attempting to reconnect...");
        port = createPort();
        try {
            port.postMessage(message);
        } catch (retryError) {
            console.error("Failed to send message after reconnection:", retryError);
        }
    }
}

async function main() {
    try {
        const { ["me-conn-name"]: storedConnName } = await storageGet("me-conn-name");
        connName = storedConnName as string;
        
        const { TITLE, CHAPTER, FILENAME_PREFIX } = extractMetadata();
        console.log(`Start extract on: ${FILENAME_PREFIX}`);
        
        port = createPort();
        safePostMessage({ status: PROGRESS_STATUS.READING });
        
        // Extract viewer ID
        console.log('Attempting to extract viewer ID...');
        const viewerId = extractViewerId();
        console.log('Viewer ID extracted:', viewerId);
        
        if (!viewerId) {
            const errorMsg = 'Could not find viewer ID (viewerId). Please make sure:\n' +
                '1. You are on an episode page (takecomic.jp/episodes/...)\n' +
                '2. The viewer is loaded (you may need to click "開いて読む" button)\n' +
                '3. You are logged in and have access to this episode';
            console.error(errorMsg);
            alert(errorMsg);
            safePostMessage({ status: PROGRESS_STATUS.FINISHED });
            return;
        }
    
    console.log(`Found viewer ID: ${viewerId}`);
    
    try {
        // Fetch first batch to get total pages
        console.log('Fetching initial page info...');
        const initialResponse = await axios.get<ContentsResponse>(
            `/api/book/contentsInfo?user-id=&comici-viewer-id=${viewerId}&page-from=0&page-to=5`
        );
        
        const totalPages = initialResponse.data.totalPages;
        console.log(`Total pages: ${totalPages}`);
        console.log('Fetching all pages data...');
        
        // Fetch all pages
        const fullResponse = await axios.get<ContentsResponse>(
            `/api/book/contentsInfo?user-id=&comici-viewer-id=${viewerId}&page-from=0&page-to=${totalPages}`
        );
        
        const pages = fullResponse.data.result;
        console.log(`Fetched ${pages.length} pages`);
        console.log('Sample page structure:', pages[0] ? { 
            imageUrl: pages[0].imageUrl.substring(0, 50) + '...', 
            hasScramble: !!pages[0].scramble,
            sort: pages[0].sort 
        } : 'No pages');
        
        // Process images
        const dataUrls: Array<{ pageId: number; dataUrl: string }> = [];
        
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            console.log(`Processing page ${i + 1}/${pages.length}...`);
            
            try {
                const scrambleArray: number[] = JSON.parse(page.scramble);
                const unscrambledDataUrl = await unscrambleImage(page.imageUrl, scrambleArray);
                dataUrls.push({
                    pageId: page.sort + 1, // Use sort order, +1 for 1-based indexing
                    dataUrl: unscrambledDataUrl
                });
            } catch (error) {
                console.error(`Failed to process page ${i + 1}:`, error);
                // Continue with next page
            }
        }
        
        console.log(`Successfully processed ${dataUrls.length} pages`);
        safePostMessage({ status: PROGRESS_STATUS.FINALIZING });
        
        // Download as zip
        zipAndDownload(
            dataUrls,
            { FILENAME_PREFIX, CHAPTER },
            () => safePostMessage({ status: PROGRESS_STATUS.FINISHED })
        );
        
    } catch (apiError: any) {
        console.error('API/Extraction error:', apiError);
        console.error('Error details:', {
            message: apiError.message,
            response: apiError.response,
            config: apiError.config
        });
        const errorDetails = apiError.response ? 
            `Status: ${apiError.response.status}, Data: ${JSON.stringify(apiError.response.data)}` : 
            apiError.message;
        alert(`Failed to extract pages: ${errorDetails}\n\nMake sure you are logged in and have access to this episode.`);
        safePostMessage({ status: PROGRESS_STATUS.FINISHED });
    }
    } catch (mainError) {
        console.error('Main function error:', mainError);
        alert(`Unexpected error: ${mainError}`);
        try {
            safePostMessage({ status: PROGRESS_STATUS.FINISHED });
        } catch (_e) {
            // Port might be dead
        }
    }
}

// === Main ===
main();


