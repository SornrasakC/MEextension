// Content script for Manga Extractor
// Injects and manages the extension overlay on supported manga reader sites

let overlayContainer: HTMLElement | null = null;
let overlayIframe: HTMLIFrameElement | null = null;
let isOverlayVisible = false;

// Create the overlay container
function createOverlay(): void {
  if (overlayContainer) return;

  // Create container
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'manga-extractor-overlay';
  overlayContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 320px;
    height: 480px;
    z-index: 2147483647;
    background: rgba(0, 0, 0, 0.9);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
    min-width: 280px;
    min-height: 400px;
    max-width: 400px;
    max-height: 600px;
  `;

  // Create header for dragging
  const header = document.createElement('div');
  header.style.cssText = `
    position: relative;
    height: 32px;
    background: rgba(0, 0, 0, 0.8);
    cursor: move;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    border-radius: 8px 8px 0 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  `;

  // Create title
  const title = document.createElement('span');
  title.textContent = 'Manga Extractor';
  title.style.cssText = `
    color: white;
    font-weight: 600;
    font-size: 12px;
    pointer-events: none;
  `;

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    transition: background-color 0.2s;
  `;

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.backgroundColor = 'transparent';
  });

  closeButton.addEventListener('click', hideOverlay);

  header.appendChild(title);
  header.appendChild(closeButton);

  // Create iframe
  overlayIframe = document.createElement('iframe');
  overlayIframe.src = chrome.runtime.getURL('overlay.html');
  overlayIframe.style.cssText = `
    width: 100%;
    height: calc(100% - 32px);
    border: none;
    background: transparent;
  `;

  overlayContainer.appendChild(header);
  overlayContainer.appendChild(overlayIframe);

  // Make draggable
  makeDraggable(overlayContainer, header);

  // Append to body
  document.body.appendChild(overlayContainer);

  // Inject CSS to prevent conflicts
  injectOverlayCSS();

  // Listen for messages from overlay iframe
  window.addEventListener('message', handleOverlayMessage);

  console.log('Manga Extractor overlay created successfully');
}

// Handle messages from overlay iframe
function handleOverlayMessage(event: MessageEvent): void {
  // Only accept messages from our overlay iframe
  if (event.source !== overlayIframe?.contentWindow) return;

  const { action, reader, url } = event.data;

  switch (action) {
    case 'extractImages':
      console.log('Starting image extraction with reader:', reader, 'URL:', url);
      startImageExtraction(reader, url);
      break;
    
    case 'downloadZip':
      console.log('Starting ZIP download');
      startZipDownload();
      break;
    
    default:
      console.log('Unknown action from overlay:', action);
  }
}

// Start image extraction based on selected reader
function startImageExtraction(reader: string, url: string): void {
  // Send message to overlay with status update
  if (overlayIframe?.contentWindow) {
    overlayIframe.contentWindow.postMessage({
      action: 'updateStatus',
      status: `Starting extraction with ${reader}...`,
      color: '#4ecdc4'
    }, '*');
  }

  // Here you would integrate with your existing extraction logic
  // For now, we'll simulate the process
  setTimeout(() => {
    if (overlayIframe?.contentWindow) {
      overlayIframe.contentWindow.postMessage({
        action: 'updateStatus',
        status: 'Extraction completed! Found 15 images.',
        color: '#51cf66'
      }, '*');
    }
  }, 2000);
}

// Start ZIP download
function startZipDownload(): void {
  if (overlayIframe?.contentWindow) {
    overlayIframe.contentWindow.postMessage({
      action: 'updateStatus',
      status: 'Creating ZIP file...',
      color: '#4ecdc4'
    }, '*');
  }

  // Simulate ZIP creation
  setTimeout(() => {
    if (overlayIframe?.contentWindow) {
      overlayIframe.contentWindow.postMessage({
        action: 'updateStatus',
        status: 'ZIP download started!',
        color: '#51cf66'
      }, '*');
    }
  }, 1500);
}

// Inject CSS to prevent conflicts with page styles
function injectOverlayCSS(): void {
  const style = document.createElement('style');
  style.id = 'manga-extractor-overlay-styles';
  style.textContent = `
    #manga-extractor-overlay {
      all: initial !important;
      position: fixed !important;
      z-index: 2147483647 !important;
      pointer-events: auto !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }
    
    #manga-extractor-overlay * {
      box-sizing: border-box !important;
      pointer-events: auto !important;
    }
    
    #manga-extractor-overlay iframe {
      pointer-events: auto !important;
    }
  `;
  
  if (!document.getElementById('manga-extractor-overlay-styles')) {
    document.head.appendChild(style);
  }
}

// Make element draggable
function makeDraggable(element: HTMLElement, handle: HTMLElement): void {
  let isDragging = false;
  let currentX = 0;
  let currentY = 0;
  let initialX = 0;
  let initialY = 0;

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    
    const rect = element.getBoundingClientRect();
    initialX = e.clientX - rect.left;
    initialY = e.clientY - rect.top;
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
  });

  function drag(e: MouseEvent): void {
    if (!isDragging) return;
    
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - element.offsetWidth;
    const maxY = window.innerHeight - element.offsetHeight;
    
    currentX = Math.max(0, Math.min(currentX, maxX));
    currentY = Math.max(0, Math.min(currentY, maxY));
    
    element.style.left = currentX + 'px';
    element.style.top = currentY + 'px';
    element.style.right = 'auto';
  }

  function stopDrag(): void {
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
  }
}

// Show overlay
function showOverlay(): void {
  if (!overlayContainer) {
    createOverlay();
  }
  
  if (overlayContainer) {
    overlayContainer.style.display = 'block';
    isOverlayVisible = true;
    console.log('Manga Extractor overlay shown');
  }
}

// Hide overlay
function hideOverlay(): void {
  if (overlayContainer) {
    overlayContainer.style.display = 'none';
    isOverlayVisible = false;
    console.log('Manga Extractor overlay hidden');
  }
}

// Toggle overlay
function toggleOverlay(): void {
  if (isOverlayVisible) {
    hideOverlay();
  } else {
    showOverlay();
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === 'toggleOverlay') {
      toggleOverlay();
      sendResponse({ success: true, visible: isOverlayVisible });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
  return true; // Keep message channel open for async response
});

// Notify background script that content script is ready
function notifyReady(): void {
  try {
    chrome.runtime.sendMessage({ action: 'contentScriptReady' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Background script not ready yet:', chrome.runtime.lastError.message);
      } else {
        console.log('Content script registered with background script');
      }
    });
  } catch (error) {
    console.log('Failed to notify background script:', error);
  }
}

// Initialize when DOM is ready
function initialize(): void {
  try {
    createOverlay();
    notifyReady();
    console.log('Manga Extractor content script initialized');
  } catch (error) {
    console.error('Failed to initialize content script:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Auto-show overlay on supported manga reader sites
function checkAndAutoShow(): void {
  const hostname = window.location.hostname;
  const supportedSites = [
    'comic-walker.com',
    'www.pixiv.net',
    'nicovideo.jp',
    'read.amazon.com',
    'comicbushi.com'
  ];

  if (supportedSites.some(site => hostname.includes(site))) {
    // Auto-create overlay but don't show it immediately
    createOverlay();
    console.log(`Manga Extractor ready on ${hostname}`);
  }
}

// Handle page navigation (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    checkAndAutoShow();
  }
}).observe(document, { subtree: true, childList: true }); 