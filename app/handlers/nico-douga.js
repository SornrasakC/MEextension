import domtoimage from "dom-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// import { storageGet } from "../utils/chrome/storage";

import { timeout, zeroPad } from "../utils/utils";

const CHAPTER = document.getElementsByClassName("episode_title")[0].textContent.match(/\d+/)[0];
const TITLE = document
    .getElementsByClassName("manga_title")[0]
    .textContent.replace(/[/\\?%*:|"<>]\./g, "")
    .trim();
const START_PAGE = 0;
const END_PAGE = 60;

const RAW_CHAPTER = document.getElementsByClassName("episode_title")[0].textContent;
const FILENAME_PREFIX = `${RAW_CHAPTER} ${TITLE}`;

async function main() {
    // const { CHAPTER, TITLE, START_PAGE, END_PAGE } = await storageGet(["CHAPTER", "TITLE", "START_PAGE", "END_PAGE"]);

    console.log(`Start extract on: ${FILENAME_PREFIX}`);

    const dataUrls = await extract(START_PAGE, END_PAGE);

    zipAndDownload(dataUrls);
}

main();

/**
 *  Helpers
 */

async function extract(pageId, endPage) {
    if (pageId >= endPage) return [];

    const container = document.getElementById(`page_${pageId}`);
    if (!container) {
        console.log("Missing:", pageId);
        return extract(pageId + 1, endPage);
    }
    container.scrollIntoView();

    if (container.firstElementChild.childElementCount < 3) {
        console.log("Waited", pageId);
        await timeout(2000);
    }

    console.log("Started:", pageId);

    const node = container.firstElementChild;
    const dataUrl = await domtoimage.toPng(node).catch(function (error) {
        console.error("ERR domtoimage.toPng(node)", error);
    });

    return [{ pageId, dataUrl }, ...(await extract(pageId + 1, endPage))];
}

function zipAndDownload(dataUrls) {
    console.log("Finalized");

    const zip = new JSZip();
    const folder = zip.folder(FILENAME_PREFIX);

    dataUrls.forEach(({ pageId, dataUrl }) => {
        const imageString = dataUrl.split("base64,")[1];
        folder.file(`${FILENAME_PREFIX}/Ch-${CHAPTER} Pg-${zeroPad(pageId)}.png`, imageString, { base64: true });
    });

    folder.generateAsync({ type: "blob" }).then((content) => saveAs(content, FILENAME_PREFIX));
}
