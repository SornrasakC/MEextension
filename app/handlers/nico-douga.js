import domtoimage from "dom-to-image";

import { timeout, zipAndDownload } from "../utils/utils";
import { getConnName } from "../utils/chrome/access";
import { PROGRESS_STATUS } from "../utils/constants";
import { storageGet } from "../utils/chrome/storage";

// const CHAPTER = document.getElementsByClassName("episode_title")[0].textContent.match(/[0-9|\uff10-\uff19]+/g)[0];
const TITLE = document
  .getElementsByClassName("manga_title")[0]
  .textContent.replace(/[/\\?%*:|"<>]\./g, "")
  .trim();
const START_PAGE = 0;
const END_PAGE = 60;

const RAW_CHAPTER =
  document.getElementsByClassName("episode_title")[0].textContent;
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
    { FILENAME_PREFIX, CHAPTER: RAW_CHAPTER },
    (() => port.postMessage({ status: PROGRESS_STATUS.FINISHED })).bind(port)
  );
}

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

// === Main ===
main();
