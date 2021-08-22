import domtoimage from "dom-to-image";

import { timeout, zipAndDownload } from "../utils/utils";

const CHAPTER = window.location.href.split("/")[6];
const TITLE = window.location.href.split("/")[4];
const START_PAGE = 0;
const END_PAGE = 60;

const FILENAME_PREFIX = `第${CHAPTER}話 ${TITLE}`;

async function main() {
    console.log(`Start extract on: ${FILENAME_PREFIX}`);

    const dataUrls = await extract(START_PAGE, END_PAGE);

    zipAndDownload(dataUrls, { FILENAME_PREFIX, CHAPTER });
}

/**
 *  Helpers
 */

async function extract(pageId, endPage) {
    if (pageId >= endPage) return [];

    const container = document.getElementById(`content-p${pageId}`);
    if (!container) {
        console.log("Missing:", pageId);
        return extract(pageId + 1, endPage);
    }

    // PAGE SLIDES RIGHT to LEFT (Previous Page)
    const evtWheeledUp = new WheelEvent("mousewheel", { deltaY: 100, view: window, bubbles: true });

    // PAGE SLIDES LEFT to RIGHT (Next Page)
    const evtWheeledDown = new WheelEvent("mousewheel", { deltaY: -100, view: window, bubbles: true });

    // Get X-coordinate number of left border and right border
    const LR = (elem) => (({ left, right }) => ({ left, right }))(elem.getBoundingClientRect());

    const isElemOverLeft = (elem) => LR(elem).left < 0;
    const isElemOverRight = (elem) => LR(elem).right > window.innerWidth;

    do {
        if (isElemOverLeft(container)) contents.dispatchEvent(evtWheeledDown);
        if (isElemOverRight(container)) contents.dispatchEvent(evtWheeledUp);
        // console.log(`Wheeled ${isElemOverLeft(container) ? "Down" : "Up"}`);
        await timeout(1500);
    } while (isElemOverLeft(container) || isElemOverRight(container));

    console.log("Started:", pageId);

    const node = container.firstElementChild;
    const dataUrl = await domtoimage.toPng(node).catch(function (error) {
        console.error("ERR domtoimage.toPng(node)", error);
    });

    return [{ pageId, dataUrl }, ...(await extract(pageId + 1, endPage))];
}

// === Main ===
main();

