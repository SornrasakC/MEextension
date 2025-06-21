// Overlay initialization script for Manga Extractor
// This script loads the React app in the iframe context

// Overlay-specific styling
const overlayStyles = `
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    overflow-x: hidden;
  }
  
  #root {
    padding: 16px;
    min-height: 100vh;
    box-sizing: border-box;
  }
  
  /* Compact styling for overlay */
  h1 {
    font-size: 18px;
    margin: 0 0 12px 0;
    font-weight: 600;
  }
  
  h2 {
    font-size: 16px;
    margin: 0 0 8px 0;
    font-weight: 500;
  }
  
  p {
    font-size: 13px;
    line-height: 1.4;
    margin: 0 0 8px 0;
  }
  
  select, input, button {
    font-size: 12px;
    padding: 6px 8px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    margin: 4px 0;
    width: 100%;
    box-sizing: border-box;
  }
  
  button {
    background: rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  button:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  select option {
    background: #333;
    color: white;
  }
  
  .form-group {
    margin-bottom: 12px;
  }
  
  label {
    display: block;
    font-size: 12px;
    margin-bottom: 4px;
    font-weight: 500;
  }
  
  .text-center {
    text-align: center;
  }
  
  .mt-4 {
    margin-top: 16px;
  }
`;

// Create a simple interface since React isn't loading
function createSimpleInterface() {
  const root = document.getElementById('root');
  if (!root) return;
  
  root.innerHTML = `
    <div>
      <h1>Manga Extractor</h1>
      
      <div class="form-group">
        <label for="reader-select">リーダー (Reader):</label>
        <select id="reader-select">
          <option value="">Select Reader...</option>
          <option value="nico-douga">Nico Douga</option>
          <option value="comic-walker">Comic Walker</option>
          <option value="pixiv">Pixiv</option>
          <option value="amazon-kindle">Amazon Kindle</option>
          <option value="mangaplus">MangaPlus</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="url-input">URL:</label>
        <input type="text" id="url-input" placeholder="Enter manga URL..." value="${window.location.href}">
      </div>
      
      <div class="form-group">
        <button id="extract-btn">Extract Images</button>
      </div>
      
      <div class="form-group">
        <button id="download-btn">Download as ZIP</button>
      </div>
      
      <div id="status" class="text-center mt-4">
        <p>Ready to extract manga images</p>
      </div>
    </div>
  `;
  
  // Add event listeners
  const extractBtn = document.getElementById('extract-btn');
  const downloadBtn = document.getElementById('download-btn');
  const readerSelect = document.getElementById('reader-select');
  const urlInput = document.getElementById('url-input');
  const status = document.getElementById('status');
  
  extractBtn.addEventListener('click', () => {
    const reader = readerSelect.value;
    const url = urlInput.value;
    
    if (!reader) {
      status.innerHTML = '<p style="color: #ff6b6b;">Please select a reader first</p>';
      return;
    }
    
    if (!url) {
      status.innerHTML = '<p style="color: #ff6b6b;">Please enter a URL</p>';
      return;
    }
    
    status.innerHTML = '<p style="color: #4ecdc4;">Extracting images...</p>';
    
    // Send message to content script to start extraction
    try {
      window.parent.postMessage({
        action: 'extractImages',
        reader: reader,
        url: url
      }, '*');
    } catch (error) {
      console.error('Failed to send message:', error);
      status.innerHTML = '<p style="color: #ff6b6b;">Failed to start extraction</p>';
    }
  });
  
  downloadBtn.addEventListener('click', () => {
    status.innerHTML = '<p style="color: #4ecdc4;">Preparing download...</p>';
    
    try {
      window.parent.postMessage({
        action: 'downloadZip'
      }, '*');
    } catch (error) {
      console.error('Failed to send message:', error);
      status.innerHTML = '<p style="color: #ff6b6b;">Failed to start download</p>';
    }
  });
  
  // Auto-detect reader based on current URL
  const currentUrl = window.parent.location.href;
  if (currentUrl.includes('nicovideo.jp')) {
    readerSelect.value = 'nico-douga';
  } else if (currentUrl.includes('comic-walker.com')) {
    readerSelect.value = 'comic-walker';
  } else if (currentUrl.includes('pixiv.net')) {
    readerSelect.value = 'pixiv';
  } else if (currentUrl.includes('amazon.com')) {
    readerSelect.value = 'amazon-kindle';
  } else if (currentUrl.includes('mangaplus.shueisha.co.jp')) {
    readerSelect.value = 'mangaplus';
  }
  
  // Update URL input with parent page URL
  urlInput.value = currentUrl;
}

// Inject styles
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = overlayStyles;
  document.head.appendChild(style);
}

// Listen for messages from parent content script
function setupMessageListener() {
  window.addEventListener('message', (event) => {
    if (event.data.action === 'updateStatus') {
      const status = document.getElementById('status');
      if (status) {
        status.innerHTML = `<p style="color: ${event.data.color}">${event.data.status}</p>`;
      }
    }
  });
}

// Initialize
function initialize() {
  injectStyles();
  createSimpleInterface();
  setupMessageListener();
  console.log('Manga Extractor overlay interface loaded');
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
} 