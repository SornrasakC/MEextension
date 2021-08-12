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
