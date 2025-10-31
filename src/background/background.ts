// Background script for Manga Extractor
// Handles overlay toggle when extension icon is clicked

/// <reference lib="dom" />

chrome.action.onClicked.addListener(async (tab) => {
  try {
    // First, try to send message to existing content script
    await chrome.tabs.sendMessage(tab.id!, { action: 'toggleOverlay' });
  } catch (_error) {
    console.log('Content script not found, injecting...');
    
    // If content script is not loaded, inject it
    try {
      // Inject the content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ['content-script.js']
      });
      
      // Wait a moment for the script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to send the message again
      try {
        await chrome.tabs.sendMessage(tab.id!, { action: 'toggleOverlay' });
      } catch (retryError) {
        console.error('Failed to toggle overlay after injection:', retryError);
        
        // If still failing, try direct injection with inline script
        await chrome.scripting.executeScript({
          target: { tabId: tab.id! },
          func: () => {
            // Create overlay directly if content script fails
            const existingOverlay = document.getElementById('manga-extractor-overlay');
            if (existingOverlay) {
              existingOverlay.style.display = existingOverlay.style.display === 'none' ? 'block' : 'none';
            } else {
              console.log('Creating overlay directly...');
              // This will be handled by the content script once it loads
            }
          }
        });
      }
    } catch (injectionError) {
      console.error('Failed to inject content script:', injectionError);
      
      // Show user-friendly error
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id! },
          func: () => {
            window.alert('Manga Extractor: This page is not supported or content script injection failed. Please try refreshing the page.');
          }
        });
      } catch (alertError) {
        console.error('Failed to show error message:', alertError);
      }
    }
  }
});

// Set up extension on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Manga Extractor installed');
});

// Handle content script messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'contentScriptReady') {
    console.log('Content script ready on tab:', sender.tab?.id);
    sendResponse({ success: true });
  }
});

chrome.commands.onCommand.addListener(cmd => {
  if (cmd === 'reload-me') chrome.runtime.reload();
});
