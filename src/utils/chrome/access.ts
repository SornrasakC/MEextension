import type { ProgressMessage, ChromeMessage } from '../../types';

/**
 * Set up a listener for Chrome runtime messages
 */
export function setListener(
  callback: (message: ProgressMessage) => void
): void {
  chrome.runtime.onMessage.addListener(
    (message: ChromeMessage, sender, sendResponse) => {
      if (message.type === 'PROGRESS_UPDATE') {
        callback(message.data as ProgressMessage);
      }
      return true; // Keep the message channel open for async responses
    }
  );
}

/**
 * Send a message to the active tab
 */
export async function sendMessageToActiveTab(
  message: ChromeMessage
): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      } else {
        reject(new Error('No active tab found'));
      }
    });
  });
}

/**
 * Execute a script in the active tab
 */
export async function executeScriptInActiveTab(
  scriptPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            files: [scriptPath],
          },
          () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          }
        );
      } else {
        reject(new Error('No active tab found'));
      }
    });
  });
} 