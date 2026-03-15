# Handler Notes

> **IMPORTANT**: Read this file before working on any handler.
> Update it after making changes or discovering new information.
> Log what was tried and failed so future sessions don't repeat mistakes.

---

## takecomic

- **Status**: Working
- **Type**: API-based
- **Test URL**: https://takecomic.jp/episodes/4a68a7464bf1f (1話, free)
- **Series URL**: https://takecomic.jp/series/8e32550d65684
- **Last tested**: 2026-02-14
- **What works**:
  - API fetch via `/api/book/contentsInfo?comici-viewer-id=...`
  - 4x4 tile descrambling using canvas
  - ZIP output via JSZip + file-saver
  - CLI extraction via Puppeteer (20s for 10 pages, 1441x2048 each)
  - Verification passes: all pages valid PNGs, no artifacts or seams
- **Known issues**:
  - CSP blocks Puppeteer-injected fetch to `viewer.takecomic.jp` -- fixed with `page.setBypassCSP(true)` in `cli/puppeteer-runner.ts`. Chrome extension path is unaffected (extensions bypass CSP automatically).
  - ZIP filenames contain `|` (pipe) from page title, which is invalid on Windows -- fixed with path sanitization in `cli/verify.ts`
- **Site quirks**:
  - Viewer ID found via `[data-comici-viewer-id]` DOM attribute (confirmed working)
  - Also searchable in: meta tags, inline `<script>` content, or global JS state (`__NUXT__`, `__NEXT_DATA__`, `window.viewerId`)
  - Scramble pattern is a JSON number array in the API response (e.g. `[11, 6, 1, 8, ...]`)
  - Images served from `viewer.takecomic.jp/book/{viewerId}/{filename}` (note: different domain from page origin -- this is why CSP matters)
  - API supports pagination via `page-from` and `page-to` params
  - Series pages: `/series/{hash}` -- lists episodes with free/paid badges
  - Episode pages: `/episodes/{hash}` -- loads the Comici viewer
  - Free episodes accessible without login; paid episodes show "アカウント登録が必要です"
  - Some older Takeshobo sites (gammaplus, storia) migrated to takecomic.jp
- **What was tried and failed**:
  - Column-major permutation -- wrong axis; the correct approach is row-major transpose (`transposePattern` + `transposeIndex`)
  - Direct canvas tile copy without pixel alignment -- caused 1px horizontal/vertical seams between tiles
  - Fixed tile sizes -- doesn't work when image dimensions aren't perfectly divisible by grid; need `buildSegments()` for fractional-pixel-aware tile coordinates
  - Naive grid splitting (equal integer division) -- remainder pixels cause seams; `effectiveWidth/Height` approach crops to divisible region
  - Running Puppeteer without CSP bypass -- all image fetches blocked by Content Security Policy `connect-src` directive

---

## speed-binb

- **Status**: Working (old URL format only)
- **Type**: DOM-based
- **Test URL**: https://storia.takeshobo.co.jp/manga/himegimi/
- **Last tested**: Unknown (pre-migration)
- **What works**:
  - WheelEvent-based page navigation
  - `dom-to-image` for page capture
  - Recursive extraction from page 0 to END_PAGE
- **Known issues**:
  - Takeshobo sites have migrated to takecomic.jp; this handler may no longer work on those
  - END_PAGE is hardcoded to 60
- **Site quirks**:
  - Page elements are `#content-p{N}` inside a scrollable container
  - Navigation uses WheelEvent; the `typeArg` varies (`"wheel"` vs `"mousewheel"`) and must be detected at runtime
  - `deltaY` direction is inverted between the two event types

---

## nico-douga

- **Status**: Deprecated (superseded by nico-manga)
- **Type**: API-based
- **Test URL**: https://seiga.nicovideo.jp/comic/47265
- **Last tested**: Unknown
- **What works**:
  - API fetch for frame URLs and DRM hashes
  - XOR decryption with `drm_hash` (first 16 hex chars)
  - Base64 encoding of decrypted image bytes
- **Known issues**:
  - Requires Niconico login for some premium/restricted content
  - Site has migrated from `seiga.nicovideo.jp` to `manga.nicovideo.jp` -- old API endpoint is likely defunct
  - Use the new `nico-manga` handler instead
- **Site quirks**:
  - API endpoint: `ssl.seiga.nicovideo.jp/api/v1/comicwalker/episodes/{cid}/frames`
  - Episode ID comes from URL query param `?cid=...`
  - Images are encrypted: each byte XORed with cycling key derived from `drm_hash`

---

## nico-manga

- **Status**: WIP (needs auth testing)
- **Type**: DOM-based (canvas capture)
- **Test URL**: https://manga.nicovideo.jp/watch/mg472312 (第1話, requires login)
- **Series URL**: https://manga.nicovideo.jp/comic/47265
- **Last tested**: 2026-02-14
- **What works**:
  - Handler created based on proven canvas capture approach
  - Registered in CLI (`--reader nico-manga`) and Chrome extension
- **Known issues**:
  - Requires Niconico login -- use `--profile` flag with CLI and `--headed` for first login
  - Not yet tested with a logged-in session (needs manual login to verify)
- **Site quirks**:
  - Successor to `seiga.nicovideo.jp` (old `nico-douga` handler)
  - Series page: `manga.nicovideo.jp/comic/{id}` -- lists episodes
  - Episode page: `manga.nicovideo.jp/watch/mg{id}` -- the reader
  - Pages are `li.page` elements with `data-page-index` attributes
  - Each page renders as `<canvas>` (excluding `.balloon` comment overlays)
  - Some pages may use `<img data-image-id="...">` as fallback
  - Pages lazy-load: must scroll into view to trigger rendering
  - Canvas starts at `width=1` until rendered; poll until real-sized
  - Without login, shows "ご視聴にはniconicoアカウントが必要です" with only a thumbnail
  - Reference: NateScarlet's userscript (https://greasyfork.org/en/scripts/436220, updated 2026-02-04) confirms canvas capture approach
- **What was tried and failed**:
  - (none yet -- handler is newly created)

---

## comic-walker

- **Status**: Unknown (needs retest)
- **Type**: DOM-based
- **Test URL**: https://comic-walker.com/contents/detail/KDCW_AM05201400010000_68/
- **Last tested**: Unknown
- **What works**: DOM navigation + dom-to-image capture
- **Known issues**: Not recently tested
- **Site quirks**: Pages are `.page-area` elements navigated via buttons

---

## kindle

- **Status**: Unknown (needs retest)
- **Type**: DOM-based
- **Test URL**: https://read.amazon.com/
- **Last tested**: Unknown
- **What works**: Left-click navigation + canvas capture
- **Known issues**:
  - Requires Amazon login (use `--profile` flag with CLI)
- **Site quirks**: Captures `<canvas>` element via dom-to-image

---

## comicbushi

- **Status**: Broken (CORS blocked)
- **Type**: DOM-based
- **Test URL**: Unknown
- **Last tested**: Unknown
- **Known issues**: CORS blocks image capture
- **Site quirks**: Page elements are `#page_{N}`

---

## comic-pixiv

- **Status**: Unknown (needs retest)
- **Type**: DOM-based (hybrid -- extracts URLs then downloads)
- **Test URL**: https://comic.pixiv.net/
- **Last tested**: Unknown
- **What works**: Extracts `background-image` URLs, downloads via axios
- **Known issues**: Not recently tested; may need Pixiv login
- **Site quirks**: Image URLs are in CSS `background-image` properties

---
---

# Monthly Series

> Tracked series for recurring monthly extraction. For each entry, the agent should:
> 1. Visit the series URL to find the latest episode
> 2. Extract it to `output/{short_name}/`
> 3. Verify and sanity check
> 4. Update `Last grabbed` below

## yume-furarete-yuri

- **Title**: 夢でフラれてはじまる百合
- **Reader**: takecomic
- **Series URL**: https://takecomic.jp/series/8e32550d65684
- **Output folder**: `output/yume-furarete-yuri/`
- **Last grabbed**: 2026-02-14 -- 1話 (https://takecomic.jp/episodes/4a68a7464bf1f, 10 pages)
- **Notes**: Free episodes marked with 無料. Episodes listed newest-first on series page. Latest free was 51話 as of 2026-02-14.

## watanare

- **Title**: わたしが恋人になれるわけないじゃん、ムリムリ！（※ムリじゃなかった!?）
- **Reader**: nico-manga
- **Series URL**: https://manga.nicovideo.jp/comic/47265
- **Output folder**: `output/watanare/`
- **Last grabbed**: (not yet grabbed -- handler needs auth testing)
- **Notes**: First 12 episodes (第1話-第12話) appear free. Episodes listed oldest-first on series page. Episode URLs follow pattern `manga.nicovideo.jp/watch/mg{id}`. Requires Niconico login.
