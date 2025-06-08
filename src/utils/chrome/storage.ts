import type { StorageData } from '../../types';

/**
 * Set data in Chrome storage
 */
export async function storageSet(data: StorageData): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get data from Chrome storage
 */
export async function storageGet(
  keys?: string | string[] | Record<string, any> | null
): Promise<StorageData> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys || null, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result as StorageData);
      }
    });
  });
}

/**
 * Clear Chrome storage
 */
export async function storageClear(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
} 