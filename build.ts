#!/usr/bin/env bun
/// <reference types="bun-types" />

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  watch,
} from 'fs';
import { join } from 'path';

const BUILD_DIR = './build';
const STATIC_DIR = './static';
const CHROME_DIR = './chrome';

// ────────────────────────────────────────────────────────────────────────────────
// Core build logic wrapped in a single function so we can call it on changes
// ────────────────────────────────────────────────────────────────────────────────
async function buildAll() {
  // Clean + recreate build dir
  if (existsSync(BUILD_DIR)) {
    await Bun.$`rm -rf ${BUILD_DIR}`;
  }
  mkdirSync(BUILD_DIR, { recursive: true });
  console.log('🧹 Cleaned build directory');

  // Utility: recursive copy
  function copyDirectory(src: string, dest: string) {
    if (!existsSync(src)) return;
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

    for (const entry of readdirSync(src)) {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);
      statSync(srcPath).isDirectory()
        ? copyDirectory(srcPath, destPath)
        : copyFileSync(srcPath, destPath);
    }
  }

  // Chrome‑specific assets
  copyDirectory(CHROME_DIR, BUILD_DIR);
  console.log('📋 Copied Chrome extension files');

  // Generic static assets
  if (existsSync(STATIC_DIR)) {
    copyDirectory(join(STATIC_DIR, 'assets'), join(BUILD_DIR, 'assets'));
    copyDirectory(join(STATIC_DIR, 'fonts'), join(BUILD_DIR, 'fonts'));

    const staticFiles = [
      'index.html',
      'index.css',
      'index.js',
      'content-overlay.css',
    ];
    for (const file of staticFiles) {
      const from = join(STATIC_DIR, file);
      if (existsSync(from)) copyFileSync(from, join(BUILD_DIR, file));
    }
  }
  console.log('📁 Copied static assets');

  // Build bundles -------------------------------------------------------------
  await Bun.build({
    entrypoints: ['./static/index.js'],
    outdir: BUILD_DIR,
    target: 'browser',
    format: 'esm',
    sourcemap: 'external',
    minify: process.env.NODE_ENV === 'production',
    external: ['chrome'],
    naming: '[dir]/[name].[ext]',
  });
  console.log('⚛️  Built React popup app');

  if (existsSync('./src/background/background.ts')) {
    await Bun.build({
      entrypoints: ['./src/background/background.ts'],
      outdir: BUILD_DIR,
      target: 'browser',
      format: 'esm',
      sourcemap: 'external',
      minify: process.env.NODE_ENV === 'production',
      external: ['chrome'],
      naming: '[name].[ext]',
    });
    console.log('🔧 Built background script');
  }

  if (existsSync('./static/overlay.js')) {
    await Bun.build({
      entrypoints: ['./static/overlay.js'],
      outdir: BUILD_DIR,
      target: 'browser',
      format: 'esm',
      sourcemap: 'external',
      minify: process.env.NODE_ENV === 'production',
      external: ['chrome'],
      naming: '[name].[ext]',
    });
    console.log('🎨 Built overlay script');
  }

  if (existsSync('./src/content-scripts/content-script.ts')) {
    await Bun.build({
      entrypoints: ['./src/content-scripts/content-script.ts'],
      outdir: BUILD_DIR,
      target: 'browser',
      format: 'iife',
      sourcemap: 'external',
      minify: process.env.NODE_ENV === 'production',
      external: ['chrome'],
      naming: '[name].[ext]',
    });
    console.log('📄 Built content script');
  }

  // Handler bundles -----------------------------------------------------------
  const handlersDir = './app/handlers';
  if (existsSync(handlersDir)) {
    const handlers = readdirSync(handlersDir).filter(
      f => f.endsWith('.js') && !f.includes('entries')
    );
    for (const h of handlers) {
      await Bun.build({
        entrypoints: [join(handlersDir, h)],
        outdir: join(BUILD_DIR, 'handlers'),
        target: 'browser',
        format: 'iife',
        sourcemap: 'external',
        minify: process.env.NODE_ENV === 'production',
        external: ['chrome'],
        naming: '[name].[ext]',
      });
    }
    console.log(`🔧 Built ${handlers.length} handlers`);
  }

  // Tailwind CSS --------------------------------------------------------------
  if (existsSync('./tailwind.config.js') && existsSync('./static/index.css')) {
    console.log('🎨 Processing Tailwind CSS…');
    try {
      await Bun.$`bunx tailwindcss -i ./static/index.css -o ${BUILD_DIR}/index.css ${
        process.env.NODE_ENV === 'production' ? '--minify' : ''
      }`;
      console.log('✅ Tailwind CSS processed');
    } catch {
      console.warn('⚠️  Tailwind processing failed, copying CSS as‑is');
      copyFileSync('./static/index.css', join(BUILD_DIR, 'index.css'));
    }
  }

  console.log('🎉 Build completed successfully!');
}

// ────────────────────────────────────────────────────────────────────────────────
// CLI entry point & watch logic (Option #2)
// ────────────────────────────────────────────────────────────────────────────────
const watching = process.argv.includes('--watch');
await buildAll();

if (watching) {
  console.log('👀 Watching for changes…');

  const debounce = <T extends (...args: unknown[]) => void>(
    fn: T,
    delay = 150
  ) => {
    let id: NodeJS.Timeout | undefined;
    return (...args: Parameters<T>) => {
      clearTimeout(id);
      id = setTimeout(() => fn(...args), delay);
    };
  };

  const rebuild = debounce(async (event: string, file?: string) => {
    console.log(`🔄  ${file ?? '(unknown)'} changed (${event}) – rebuilding…`);
    try {
      await buildAll();
      console.log('✅ Rebuild finished');
    } catch (err) {
      console.error('❌ Rebuild failed', err);
    }
  });

  const watchTargets = [
    STATIC_DIR,
    './src',
    './app',
    CHROME_DIR,
    './tailwind.config.js',
  ];

  for (const target of watchTargets) {
    if (!existsSync(target)) continue;

    const stats = statSync(target);
    if (stats.isDirectory()) {
      watch(target, { recursive: true }, rebuild);
    } else {
      // For single files, watch their directory and filter
      const dir = join(target, '..');
      const filename = target.split('/').pop()!;
      watch(dir, (evt, file) => {
        if (file === filename) rebuild(evt, file);
      });
    }
  }
}
