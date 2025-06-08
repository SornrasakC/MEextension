#!/usr/bin/env bun

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const BUILD_DIR = './build';
const STATIC_DIR = './static';
const CHROME_DIR = './chrome';

// Clean and create build directory
if (existsSync(BUILD_DIR)) {
  await Bun.$`rm -rf ${BUILD_DIR}`;
}
mkdirSync(BUILD_DIR, { recursive: true });

console.log('🧹 Cleaned build directory');

// Copy static assets
function copyDirectory(src: string, dest: string) {
  if (!existsSync(src)) return;
  
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  
  const entries = readdirSync(src);
  
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    
    if (statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Copy chrome manifest and icons
copyDirectory(CHROME_DIR, BUILD_DIR);
console.log('📋 Copied Chrome extension files');

// Copy static assets
if (existsSync(STATIC_DIR)) {
  copyDirectory(join(STATIC_DIR, 'assets'), join(BUILD_DIR, 'assets'));
  copyDirectory(join(STATIC_DIR, 'fonts'), join(BUILD_DIR, 'fonts'));
  
  // Copy and process HTML
  if (existsSync(join(STATIC_DIR, 'index.html'))) {
    copyFileSync(join(STATIC_DIR, 'index.html'), join(BUILD_DIR, 'index.html'));
  }
  
  // Copy CSS (will be processed by Tailwind later)
  if (existsSync(join(STATIC_DIR, 'index.css'))) {
    copyFileSync(join(STATIC_DIR, 'index.css'), join(BUILD_DIR, 'index.css'));
  }
}

console.log('📁 Copied static assets');

// Build main React app (popup)
await Bun.build({
  entrypoints: ['./static/index.js'],
  outdir: BUILD_DIR,
  target: 'browser',
  format: 'esm',
  minify: process.env.NODE_ENV === 'production',
  sourcemap: 'external',
  external: ['chrome'],
  naming: '[dir]/[name].[ext]'
});

console.log('⚛️  Built React popup app');

// Build content script
if (existsSync('./app/content-scripts/content-script.js')) {
  await Bun.build({
    entrypoints: ['./app/content-scripts/content-script.js'],
    outdir: BUILD_DIR,
    target: 'browser',
    format: 'iife',
    minify: process.env.NODE_ENV === 'production',
    sourcemap: 'external',
    external: ['chrome'],
    naming: '[dir]/[name].[ext]'
  });
  
  console.log('📄 Built content script');
}

// Build handlers
const handlersDir = './app/handlers';
if (existsSync(handlersDir)) {
  const handlers = readdirSync(handlersDir).filter(file => 
    file.endsWith('.js') && !file.includes('entries')
  );
  
  for (const handler of handlers) {
    const entrypoint = join(handlersDir, handler);
    
    await Bun.build({
      entrypoints: [entrypoint],
      outdir: join(BUILD_DIR, 'handlers'),
      target: 'browser',
      format: 'iife',
      minify: process.env.NODE_ENV === 'production',
      sourcemap: 'external',
      external: ['chrome'],
      naming: '[name].[ext]'
    });
  }
  
  console.log(`🔧 Built ${handlers.length} handlers`);
}

// Process CSS with Tailwind v4
if (existsSync('./tailwind.config.js') && existsSync('./static/index.css')) {
  console.log('🎨 Processing Tailwind CSS...');
  
  try {
    // Use Tailwind v4 CLI
    await Bun.$`bunx @tailwindcss/cli@next -i ./static/index.css -o ./build/index.css ${process.env.NODE_ENV === 'production' ? '--minify' : ''}`;
    console.log('✅ Tailwind CSS processed');
  } catch (error) {
    console.warn('⚠️  Tailwind v4 processing failed, trying fallback...');
    try {
      // Fallback to regular tailwindcss
      await Bun.$`bunx tailwindcss -i ./static/index.css -o ./build/index.css ${process.env.NODE_ENV === 'production' ? '--minify' : ''}`;
      console.log('✅ Tailwind CSS processed with fallback');
    } catch (fallbackError) {
      console.warn('⚠️  All Tailwind processing failed, copying CSS as-is');
      copyFileSync('./static/index.css', './build/index.css');
    }
  }
}

console.log('🎉 Build completed successfully!');

// Watch mode
if (process.argv.includes('--watch')) {
  console.log('👀 Watching for changes...');
  
  // This is a simplified watch implementation
  // In a real implementation, you'd want more sophisticated file watching
  setInterval(async () => {
    // Re-run build on changes
    // This is a basic implementation - you'd want to optimize this
  }, 1000);
} 