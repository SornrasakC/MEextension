// Content script for Manga Extractor
// Injects and manages the extension overlay on supported manga reader sites

/// <reference lib="dom" />

let overlayContainer: HTMLElement | null = null;
// eslint-disable-next-line no-undef
let overlayIframe: HTMLIFrameElement | null = null;
let isOverlayVisible = false;

// Create the overlay container
function createOverlay(): void {
  if (overlayContainer) return;

  // Create container
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'manga-extractor-overlay';

  // Create header for dragging
  const header = document.createElement('div');
  header.className = 'overlay-header';

  // Create title
  const title = document.createElement('span');
  title.textContent = 'Manga Extractor';
  title.className = 'overlay-title';

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = 'x';
  closeButton.className = 'overlay-close-btn';

  closeButton.addEventListener('mouseenter', () => {
    closeButton.classList.add('overlay-close-btn-hover');
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.classList.remove('overlay-close-btn-hover');
  });

  closeButton.addEventListener('click', hideOverlay);

  header.appendChild(title);
  header.appendChild(closeButton);

  // Create iframe
  overlayIframe = document.createElement('iframe');
  overlayIframe.src = chrome.runtime.getURL('index.html');
  overlayIframe.className = 'overlay-iframe';

  // Create resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'overlay-resize-handle';

  overlayContainer.appendChild(header);
  overlayContainer.appendChild(overlayIframe);
  overlayContainer.appendChild(resizeHandle);

  // Make draggable
  makeDraggable(overlayContainer, header);
  
  // Make resizable
  makeResizable(overlayContainer, resizeHandle);

  // Append to body
  document.body.appendChild(overlayContainer);

  // Listen for messages from overlay iframe
  window.addEventListener('message', handleOverlayMessage);

  console.log('Manga Extractor overlay created successfully');
}

// Handle messages from overlay iframe
// eslint-disable-next-line no-undef
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
function startImageExtraction(reader: string, _url: string): void {
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

// Make element resizable
function makeResizable(element: HTMLElement, handle: HTMLElement): void {
  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent triggering drag
    isResizing = true;
    
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(window.getComputedStyle(element, null).getPropertyValue('width'));
    startHeight = parseInt(window.getComputedStyle(element, null).getPropertyValue('height'));
    
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  });

  function resize(e: MouseEvent): void {
    if (!isResizing) return;
    
    e.preventDefault();
    
    const newWidth = startWidth + (e.clientX - startX);
    const newHeight = startHeight + (e.clientY - startY);
    
    // Apply minimum and maximum constraints
    const minWidth = 350;
    const minHeight = 680;
    const maxWidth = window.innerWidth - parseInt(element.style.left || '0');
    const maxHeight = window.innerHeight - parseInt(element.style.top || '0');
    
    const constrainedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
    const constrainedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
    
    // Update container dimensions
    element.style.width = constrainedWidth + 'px';
    element.style.height = constrainedHeight + 'px';
    
    // Update iframe dimensions (it will automatically resize due to CSS calc)
    if (overlayIframe) {
      // overlayIframe.style.height = `calc(${constrainedHeight}px - 32px)`;
      overlayIframe.style.height = `${constrainedHeight}px`;
      overlayIframe.style.width = `${constrainedWidth}px`;
    }
  }

  function stopResize(): void {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
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
    // console.log('Dragging overlay', currentX, currentY);
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
    sendResponse({ success: false, error: (error as Error).message });
  }
  return true; // Keep message channel open for async response
});

// Notify background script that content script is ready
function notifyReady(): void {
  try {
    chrome.runtime.sendMessage({ action: 'contentScriptReady' }, (_response) => {
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

// Handle page navigation (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    createOverlay();
  }
}).observe(document, { subtree: true, childList: true }); 
