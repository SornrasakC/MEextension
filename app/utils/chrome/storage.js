// storageGet('ur_key')
// storageGet(['ur_key1', 'ur_key2])
// return {'ur_key': 'ur_val'}
export async function storageGet(keys) {
  return new Promise((resolve, _reject) => {
    chrome.storage.sync.get(keys, (result) => {
      resolve(result);
    });
  });
}
// storageSet({'ur_key': 'ur_val'})
// storageSet([{'ur_key': 'ur_val'}, {'ur_key2': 'ur_val2'}])
export async function storageSet(keyVals) {
  return new Promise((resolve, _reject) => {
    chrome.storage.sync.set(keyVals, (result) => {
      resolve(result);
    });
  });
}
