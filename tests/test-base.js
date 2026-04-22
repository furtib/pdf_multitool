/**
 * Custom test fixture that intercepts every CDN request the app makes and
 * fulfills it from local node_modules. This keeps tests self-contained and
 * independent of external network access.
 */
import { test as base, expect } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NM = resolve(__dirname, '../node_modules');

// Map each CDN URL used in index.html to its local node_modules equivalent.
const CDN_ROUTES = [
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    path: `${NM}/pdfjs-dist/build/pdf.min.js`,
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    path: `${NM}/pdfjs-dist/build/pdf.worker.min.js`,
  },
  {
    url: 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    path: `${NM}/pdf-lib/dist/pdf-lib.min.js`,
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js',
    path: `${NM}/sortablejs/Sortable.min.js`,
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js',
    path: `${NM}/localforage/dist/localforage.min.js`,
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.min.css',
    path: `${NM}/pdfjs-dist/web/pdf_viewer.css`,
  },
];

/**
 * Extended test that adds CDN route interception to every browser context.
 * context.route() catches requests from the page AND from dedicated workers
 * (e.g. the PDF.js worker), so all external requests are handled locally.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    for (const { url, path } of CDN_ROUTES) {
      await context.route(url, (route) => route.fulfill({ path }));
    }
    await use(context);
  },
});

export { expect };
