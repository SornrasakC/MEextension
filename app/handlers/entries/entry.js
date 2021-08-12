import { getCurrentTabId } from "../../utils/chrome/access";

export const READERS = {
    NICO_DOUGA: "handlers/nico-douga.js",
    SPEED_BNB: "handlers/speed-bnb-reader.js",
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

export async function executeSpeedBnbReaderScript() {
    return _execute(READERS.SPEED_BNB);
}
