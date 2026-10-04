import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** KaTeX ships woff2 + woff + ttf; every current browser uses woff2, so drop the rest to keep the file small. */
function katexWoff2Only(): Plugin {
  return {
    name: 'katex-woff2-only',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('katex') || !id.endsWith('.css')) return null;
      return code.replace(/,url\(fonts\/[^)]+\.woff\) format\("woff"\),url\(fonts\/[^)]+\.ttf\) format\("truetype"\)/g, '');
    },
  };
}

/** Inline the favicon so the single file has no sibling assets. */
function inlineFavicon(): Plugin {
  return {
    name: 'inline-favicon',
    transformIndexHtml(html) {
      const svg = readFileSync('public/favicon.svg', 'utf8');
      return html.replace('href="./favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(svg)}"`);
    },
  };
}

/**
 * One self-contained HTML file (scripts, styles, and math fonts inlined) that opens
 * by double-clicking — no server, no install. Build with `npm run build:single`.
 */
export default defineConfig({
  plugins: [katexWoff2Only(), inlineFavicon(), react(), viteSingleFile()],
  publicDir: false,
  base: './',
  build: {
    outDir: 'dist-single',
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 5000,
    reportCompressedSize: false,
  },
});
