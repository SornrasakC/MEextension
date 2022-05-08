import domtoimage from "dom-to-image";

import { timeout, zipAndDownload } from "../utils/utils";

// window.location.href
// 'https://gammaplus.takeshobo.co.jp/manga/yumedefurarete/_files/01/'
// 'https://storia.takeshobo.co.jp/_files/himegimi/33/'
// const CHAPTER = window.location.href.split("/")[6];
// const TITLE = window.location.href.split("/")[4];

const title = document.querySelector('[property="og:title"]').getAttribute("content");
const description = document.querySelector('[property="og:description"]').getAttribute("content");
const possibleChapter = description.match(/第[0-9]+巻/g); // ['第114巻'] or null
const possibleNumbering = title.match(/[0-9]+/g); // ['114'] or null

const getRawChapter = () => {
    if (possibleChapter) return possibleChapter[0];
    if (possibleNumbering) return `第${possibleNumbering[0]}巻`;
    return "第0巻";
};

const TITLE = title;
const RAW_CHAPTER = getRawChapter();
const CHAPTER = RAW_CHAPTER.match(/[0-9]+/g)[0];

const START_PAGE = 0;
const END_PAGE = 60;

const FILENAME_PREFIX = `第${CHAPTER}話 ${TITLE}`;

async function main() {
    console.log(`Start extract on: ${FILENAME_PREFIX}`);

    const typeArg = await getWheelEventTypeArg();

    const dataUrls = await extract(START_PAGE, END_PAGE, typeArg);

    zipAndDownload(dataUrls, { FILENAME_PREFIX, CHAPTER });
}

/**
 *  Helpers
 */

async function extract(pageId, endPage, typeArg) {
    if (pageId >= endPage) return [];

    const container = document.getElementById(`content-p${pageId}`);
    if (!container) {
        console.log("Missing:", pageId);
        return extract(pageId + 1, endPage, typeArg);
    }

    const deltaY = (() => {
        if (typeArg == "mousewheel") return 100;
        if (typeArg == "wheel") return -100;
        return 1000;
    })();

    // PAGE SLIDES RIGHT to LEFT (Previous Page)
    const evtWheeledUp = new WheelEvent(typeArg, { deltaY: deltaY, view: window, bubbles: true });

    // PAGE SLIDES LEFT to RIGHT (Next Page)
    const evtWheeledDown = new WheelEvent(typeArg, { deltaY: -deltaY, view: window, bubbles: true });

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

    return [{ pageId, dataUrl }, ...(await extract(pageId + 1, endPage, typeArg))];
}

async function getWheelEventTypeArg() {
    const evtWheeledDown = new WheelEvent("wheel", { deltaY: 100, view: window, bubbles: true });
    const watchElem = document.getElementById("content-p1");
    const styleBefore = watchElem.getAttribute("style");
    contents.dispatchEvent(evtWheeledDown);
    await timeout(700);
    const styleAfter = watchElem.getAttribute("style");
    const typeArg = styleBefore == styleAfter ? "mousewheel" : "wheel";
    console.log("Using typeArg:", typeArg);
    return typeArg;
}

// === Main ===
main();
