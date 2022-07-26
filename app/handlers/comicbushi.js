import domtoimage from "dom-to-image";

import { timeout, zipAndDownload, isElemOverLeft, isElemOverRight } from "../utils/utils";
import { getConnName } from "../utils/chrome/access";
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

// TODO reconnect if port disconnected

async function main() {
    const { ["me-conn-name"]: connName } = await storageGet("me-conn-name");

    const port = chrome.runtime.connect({ name: connName });

    console.log(`Start extract on: ${FILENAME_PREFIX}`);

    try {
        port.postMessage({ status: PROGRESS_STATUS.READING });
    } catch {}

    const dataUrls = await extract(START_PAGE, END_PAGE);
    try {
        port.postMessage({ status: PROGRESS_STATUS.FINALIZING });
    } catch {}

    zipAndDownload(
        dataUrls,
        { FILENAME_PREFIX, CHAPTER: RAW_CHAPTER },
        (() => port.postMessage({ status: PROGRESS_STATUS.FINISHED })).bind(port)
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
