import { messages } from "@extend-chrome/messages";

export async function storageGet(keys) {
  return new Promise((resolve, _reject) => {
    chrome.storage.sync.get(keys, (result) => {
      resolve(result);
    });
  });
}

export async function storageSet(keyVals) {
  return new Promise((resolve, _reject) => {
    chrome.storage.sync.set(keyVals, (result) => {
      resolve(result);
    });
  });
}

export function statusFetcher(callback) {
  messages.on((message, _sender) => {
    const {
      greeting,
      data: { status },
    } = message;

    if (!greeting.includes("mugyu~") || !greeting.includes("status")) return;

    callback(status);
  });
}
