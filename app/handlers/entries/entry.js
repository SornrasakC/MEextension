import { getCurrentTabId } from "../../utils/chrome/access";

export const READERS = {
    NICO_DOUGA: "nico-douga.js",
    SPEED_BNB: "speed-bnb-reader.js",
};

function _execute(filename) {
    return getCurrentTabId((tabId) =>
        chrome.scripting.executeScript({
            target: { tabId },
            files: [filename],
        })
    );
}

export function executeNicoDougaScript() {
    return _execute(READERS.NICO_DOUGA);
}

export function executeSpeedBnbReaderScript() {
    return _execute(READERS.SPEED_BNB);
}
