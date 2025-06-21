# MEextension
[Manga Extractor](https://github.com/SornrasakC/MangaExtractors) as Chrome extension

## Recent Updates

### Content Script Overlay Implementation
The extension now injects a floating overlay directly into web pages instead of using a popup. This provides the best user experience and solves the popup closing issue completely.

**Benefits:**
- ✅ Interface stays open when clicking outside
- ✅ Works on multiple tabs simultaneously
- ✅ Draggable and resizable overlay
- ✅ Auto-detects supported manga reader sites
- ✅ No interference with page content
- ✅ Modern glassmorphism design

**Features:**
- 🎯 **Smart Detection:** Automatically activates on supported manga sites
- 🖱️ **Draggable:** Move the overlay anywhere on the page
- 📏 **Resizable:** Adjust size to your preference
- 🎨 **Beautiful UI:** Modern glassmorphism design with backdrop blur
- 🔄 **Multi-tab Support:** Works independently on each tab
- ⚡ **Fast Toggle:** Click extension icon to show/hide instantly

### How to Use

1. **Install the Extension:**
   ```bash
   # Build the extension
   bun run build.ts
   
   # Load in Chrome:
   # 1. Go to chrome://extensions/
   # 2. Enable "Developer mode"
   # 3. Click "Load unpacked"
   # 4. Select the ./build directory
   ```

2. **Using the Overlay:**
   - Navigate to any supported manga reader site (Comic Walker, Pixiv, etc.)
   - Click the extension icon in the toolbar to toggle the overlay
   - Drag the overlay by its header to reposition
   - Resize using the resize handle in the bottom-right corner
   - Close using the × button or click the extension icon again

3. **Supported Sites:**
   - Comic Walker (comic-walker.com)
   - Pixiv (www.pixiv.net)
   - Nico Video (nicovideo.jp)
   - Amazon Kindle (read.amazon.com)
   - Comic Bushi (comicbushi.com)

ref: 
- https://medium.com/@SunnyGolovine/build-a-chrome-extension-using-reactjs-and-webpack-part-1-976a414b85d0

- https://github.com/lusakasa/saka-key/blob/master/webpack.config.js

[Workdir](https://github.com/SornrasakC/MEextension/tree/main/app/handlers)
