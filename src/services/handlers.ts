import { executeScriptInActiveTab } from '../utils/chrome/access';

/**
 * Execute Speed Binb Reader script
 */
export async function executeSpeedBinbReaderScript(): Promise<void> {
  return executeScriptInActiveTab('handlers/speed-binb-reader.js');
}

/**
 * Execute Nico Douga script
 */
export async function executeNicoDougaScript(): Promise<void> {
  return executeScriptInActiveTab('handlers/nico-douga.js');
}

/**
 * Execute Comic Walker script
 */
export async function executeComicWalkerScript(): Promise<void> {
  return executeScriptInActiveTab('handlers/comic-walker.js');
}

/**
 * Execute Comic Pixiv script
 */
export async function executeComicPixivScript(): Promise<void> {
  return executeScriptInActiveTab('handlers/comic-pixiv.js');
}

/**
 * Execute Kindle script
 */
export async function executeKindleScript(): Promise<void> {
  return executeScriptInActiveTab('handlers/kindle.js');
}

/**
 * Execute Comicbushi script
 */
export async function executeComicbushiScript(): Promise<void> {
  return executeScriptInActiveTab('handlers/comicbushi.js');
}

/**
 * Execute Takecomic script
 */
export async function executeTakecomicScript(): Promise<void> {
  return executeScriptInActiveTab('handlers/takecomic.js');
}

/**
 * Execute Nico Manga script (manga.nicovideo.jp)
 */
export async function executeNicoMangaScript(): Promise<void> {
  return executeScriptInActiveTab('handlers/nico-manga.js');
} 