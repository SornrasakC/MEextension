import domtoimage from "dom-to-image";

import { timeout, zipAndDownload } from "../utils/utils";
// import { getConnName } from "../utils/chrome/access"; // Not used in this handler
import { PROGRESS_STATUS } from "../utils/constants";
import { storageGet } from "../utils/chrome/storage";

const TITLE = document.getElementById("readerChromeHeaderTitle").textContent;

const START_PAGE = 1;
const END_PAGE = parseInt(document.getElementById("pageInfoTotalPage").textContent);

const title = document.querySelector('[property="og:title"]').getAttribute('content');
const description = document.querySelector('[property="og:description"]').getAttribute('content');
const possibleChapter = description.match(/第[0-9]+巻/g) // ['第114巻'] or null
const possibleNumbering = title.match(/[0-9]+/g) // ['114'] or null

const getRawChapter = () => {
    if(possibleChapter) return possibleChapter[0];
    if(possibleNumbering) return `第${possibleNumbering[0]}巻`;
    return '第0巻';
}

const RAW_CHAPTER = getRawChapter();
const CHAPTER = RAW_CHAPTER.match(/[0-9]+/g)[0];
const FILENAME_PREFIX = `${RAW_CHAPTER} ${TITLE}`;

// Port management
let port = null;
let connName = null;

function createPort() {
  if (port) {
    try {
      port.disconnect();
    } catch (_e) {
      // Port already disconnected
    }
  }
  
  port = chrome.runtime.connect({ name: connName });
  
  port.onDisconnect.addListener(() => {
    console.log("Port disconnected, will reconnect on next message");
    port = null;
  });
  
  return port;
}

function safePostMessage(message) {
  try {
    if (!port || port.name === undefined) {
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
    const { ["me-conn-name"]: storedConnName } = await storageGet("me-conn-name");
    connName = storedConnName;

    port = createPort();

    console.log(`Start extract on: ${FILENAME_PREFIX}`);
    safePostMessage({ status: PROGRESS_STATUS.READING });

    const dataUrls = await extract(START_PAGE, END_PAGE);
    safePostMessage({ status: PROGRESS_STATUS.FINALIZING });

    zipAndDownload(
        dataUrls,
        { FILENAME_PREFIX, CHAPTER },
        () => safePostMessage({ status: PROGRESS_STATUS.FINISHED })
    );
}

/**
 *  Helpers
 */

function getCurrentPage() {
    return parseInt(document.getElementById("pageInfoCurrentPage").textContent);
}

async function extract(pageId, endPage) {
    const leftButton = document.getElementById('readerChevronLeft');
    // const rightButton = document.getElementById('readerChevronRight');
    const [canvas] = document.getElementsByTagName('canvas');

    if (getCurrentPage() >= endPage) return [];

    console.log("Started:", pageId);

    const node = canvas;
    const dataUrl = await domtoimage.toPng(node).catch(function (error) {
        console.error("ERR domtoimage.toPng(node)", error);
    });

    leftButton.click();
    await timeout(200);

    return [{ pageId, dataUrl }, ...(await extract(pageId + 1, endPage))];
}

// === Main ===
main();
