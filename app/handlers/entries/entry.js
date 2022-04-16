import { getCurrentTabId } from "../../utils/chrome/access";

export const READERS = {
    NICO_DOUGA: "handlers/nico-douga.js",
    SPEED_BINB: "handlers/speed-binb-reader.js",
    COMIC_WALKER: "handlers/comic-walker.js",
    COMIC_PIXIV: "handlers/comic-pixiv.js",
    KINDLE: "handlers/kindle.js",
};

async function _execute(filename) {
    const tabId = await getCurrentTabId();
    return new Promise((resolve) => {
        chrome.scripting.executeScript(
            {
                target: { tabId },
                files: [filename],
            },
            () => {
                resolve(filename);
            }
        );
    });
}

export async function executeNicoDougaScript() {
    return _execute(READERS.NICO_DOUGA);
}

export async function executeSpeedBinbReaderScript() {
    return _execute(READERS.SPEED_BINB);
}

export async function executeComicWalkerScript() {
    return _execute(READERS.COMIC_WALKER);
}

export async function executeComicPixivScript() {
    return _execute(READERS.COMIC_PIXIV);
}

export async function executeKindleScript() {
    return _execute(READERS.KINDLE);
}
