import domtoimage from "dom-to-image";

import { timeout, zipAndDownload } from "../utils/utils";
import { getConnName } from "../utils/chrome/access";
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
const CHAPTER = RAW_CHAPTER.match(/[0-9]*/g)[0];
const FILENAME_PREFIX = `${RAW_CHAPTER} ${TITLE}`;

// TODO reconnect if port disconnected

async function main() {
    const { ["me-conn-name"]: connName } = await storageGet("me-conn-name");

    const port = chrome.runtime.connect({ name: connName });

    console.log(`Start extract on: ${FILENAME_PREFIX}`);
    port.postMessage({ status: PROGRESS_STATUS.READING });

    const dataUrls = await extract(START_PAGE, END_PAGE);
    port.postMessage({ status: PROGRESS_STATUS.FINALIZING });

    zipAndDownload(
        dataUrls,
        { FILENAME_PREFIX, CHAPTER },
        (() => port.postMessage({ status: PROGRESS_STATUS.FINISHED })).bind(port)
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
