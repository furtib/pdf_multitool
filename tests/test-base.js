/**
 * Custom test fixture that intercepts every CDN request the app makes and
 * fulfills it from local node_modules. This keeps tests self-contained and
 * independent of external network access.
 *
 * pdfjs-dist 4.x is used (patched for CVE-2024-4367 / arbitrary JS execution
 * in PDF.js ≤ 4.1.392). Its build output is webpack-compiled JavaScript that
 * assigns globalThis.pdfjsLib, so it works as a regular <script> despite the
 * .mjs extension.  A renderTextLayer shim is appended because that helper was
 * removed in 4.x (superseded by new TextLayer class).
 */
import { test as base, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NM = resolve(__dirname, '../node_modules');

// renderTextLayer was removed in PDF.js 4.x.  This shim restores the 3.x
// functional API used by the app so PDF text layers continue to render.
const RENDER_TEXT_LAYER_SHIM = `
;(function patchRenderTextLayer() {
  var lib = globalThis.pdfjsLib;
  if (!lib || lib.renderTextLayer || !lib.TextLayer) return;
  lib.renderTextLayer = function(params) {
    var tl = new lib.TextLayer({
      textContentSource: params.textContentSource,
      container: params.container,
      viewport: params.viewport,
    });
    tl.render();
    return tl;
  };
})();
`;

// The pdfjs-dist 4.x .mjs files are webpack bundles that set globalThis.pdfjsLib
// directly — they work as plain <script> content despite the .mjs extension.
function pdfjsBody() {
  return readFileSync(`${NM}/pdfjs-dist/build/pdf.min.mjs`, 'utf8') + RENDER_TEXT_LAYER_SHIM;
}

// Map each CDN URL used in index.html to its local node_modules equivalent.
// context.route() catches requests from the page AND dedicated workers (e.g.
// the PDF.js worker), so all external requests are handled locally.
const CDN_ROUTES = [
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    fulfill: (route) =>
      route.fulfill({ body: pdfjsBody(), contentType: 'application/javascript' }),
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    fulfill: (route) =>
      route.fulfill({
        path: `${NM}/pdfjs-dist/build/pdf.worker.min.mjs`,
        contentType: 'application/javascript',
      }),
  },
  {
    url: 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    fulfill: (route) => route.fulfill({ path: `${NM}/pdf-lib/dist/pdf-lib.min.js` }),
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js',
    fulfill: (route) => route.fulfill({ path: `${NM}/sortablejs/Sortable.min.js` }),
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js',
    fulfill: (route) => route.fulfill({ path: `${NM}/localforage/dist/localforage.min.js` }),
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.min.css',
    fulfill: (route) =>
      route.fulfill({ path: `${NM}/pdfjs-dist/web/pdf_viewer.css`, contentType: 'text/css' }),
  },
];

/**
 * Extended test that adds CDN route interception to every browser context.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    for (const { url, fulfill } of CDN_ROUTES) {
      await context.route(url, fulfill);
    }
    await use(context);
  },
});

export { expect };
