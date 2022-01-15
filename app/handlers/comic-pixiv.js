import domtoimage from "dom-to-image";
import axios from "axios";

import { timeout, zipAndDownload, getFirstNumberOfEngOrJap, zeroPad } from "../utils/utils";
import { getConnName } from "../utils/chrome/access";
import { PROGRESS_STATUS } from "../utils/constants";
import { storageGet } from "../utils/chrome/storage";

// https://comic.pixiv.net/api/app/episodes/100600/read
// const ID = window.location.pathname.split("/").at(-1);
// const READ_API_URL = `/api/app/episodes/${ID}/read`;
// const headers = {
//     "x-client-hash": "",
//     "x-client-time": "2022-01-12T02:00:58+07:00",
//     "x-requested-with": "pixivcomic",
// };
// const readRes = await axios.get(READ_API_URL, { headers });
// const data = readRes.data.data.reading_episode;
// numbering_title: "第1話"
// sub_title: "私の好きな人"
// title: "第1話 私の好きな人"
// work_title: "1×1/2-イチトニブンノイチ-"
// const { work_title: TITLE, numbering_title, pages } = data;
// const CHAPTER = zeroPad(getFirstNumberOfEngOrJap(numbering_title), 2);
// const FILENAME_PREFIX = `${numbering_title} ${TITLE}`;

function splitTake(str, sep, pos = 0) {
    const words = str.split(sep);
    const [retVal] = words.splice(pos, 1);
    return [retVal, words.join(sep)];
}

const rawTitle = document.getElementsByTagName("title")[0].textContent;
const [rawChapter, rawTitleCut] = splitTake(rawTitle, " | ");
const [_nonce1, title] = splitTake(rawTitleCut, " - ", -1);

const TITLE = title.replace("/", "-");
const [CHAPTER, _nonce2] = splitTake(rawChapter, " ");
const FILENAME_PREFIX = `${CHAPTER} ${TITLE}`;
// const START_PAGE = 0;
// const END_PAGE = 60;

// TODO reconnect if port disconnected

async function main() {
    const { ["me-conn-name"]: connName } = await storageGet("me-conn-name");
    const port = chrome.runtime.connect({ name: connName });

    console.log(`Start extract on: ${FILENAME_PREFIX}`);
    port.postMessage({ status: PROGRESS_STATUS.READING });

    const pageNodes = [...document.querySelectorAll('[style*="background-image:"]')];
    // node.style.backgroundImage == 'url("https://public-img-comic.pximg.net/c!/a=1,w=720,h=1024,b=FFFFFF,lg=7,lxr=0.05,lyr=0.05,l=c%2521%252Fa%253D0%252Cw%253D270%252Fimages%252Fborder_logo.png/images/blank.png")'
    const urls = pageNodes.map(node => node.style.backgroundImage.split('"')[1]);

    const dataUrls = await urlsToDataUrls(urls);
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

function blobToBase64(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

async function urlsToDataUrls(urls) {
    const reqs = urls.map(url => axios.get(url, { responseType: "blob" }));
    const urlRes = await axios.all(reqs);

    const dataUrls = await Promise.all(urlRes.map((res) => blobToBase64(res.data)));

    return [...dataUrls.entries()].map(([index, dataUrl]) => ({ pageId: index, dataUrl }));
}

// === Main ===
main();
