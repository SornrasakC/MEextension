import domtoimage from "dom-to-image";

import { timeout, zipAndDownload, isElemOverLeft, isElemOverRight } from "../utils/utils";
// import { getConnName } from "../utils/chrome/access"; // Not used in this handler
import { PROGRESS_STATUS } from "../utils/constants";
import { storageGet } from "../utils/chrome/storage";

// const CHAPTER = document.getElementsByClassName("episode_title")[0].textContent.match(/[0-9|\uff10-\uff19]+/g)[0];

const TITLE = document
    .querySelector("h1.series-header-title")
    .textContent.replace(/[/\\?%*:|"<>]\./g, "")
    .trim();
const START_PAGE = 0;
const END_PAGE = 60;

const RAW_CHAPTER = document
    .querySelector("h1.episode-header-title")
    .textContent.replace(/[/\\?%*:|"<>]\./g, "")
    .trim();
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
        { FILENAME_PREFIX, CHAPTER: RAW_CHAPTER },
        () => safePostMessage({ status: PROGRESS_STATUS.FINISHED })
    );
}

/**
 *  Helpers
 */

async function extract(pageId, endPage) {
    if (pageId >= endPage) return [];

    const content = document.getElementById("content");
    const containers = content.querySelectorAll("p.page-area");
    if (containers.length <= pageId) return [];
    const container = containers[pageId];

    const goForwardElem = document.querySelector(".page-navigation-forward");
    const goBackwardElem = document.querySelector(".page-navigation-backward");

    do {
        if (isElemOverLeft(container)) goForwardElem.click();
        if (isElemOverRight(container)) goBackwardElem.click();
        await timeout(500);
    } while (isElemOverLeft(container) || isElemOverRight(container));

    if (container.firstElementChild == null) {
        console.log("Waited", pageId);
        await timeout(2000);
    }

    console.log("Started:", pageId);

    // const node = container.firstElementChild;
    const node = container;
    const dataUrl = await domtoimage.toPng(node).catch(function (error) {
        console.error("ERR domtoimage.toPng(node)", error);
    });

    return [{ pageId, dataUrl }, ...(await extract(pageId + 1, endPage))];
}

// === Main ===
main();
