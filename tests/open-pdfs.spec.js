import { test, expect } from './test-base.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, 'fixtures');

/** Wait for the app's async init() to finish (loader hidden). */
async function waitForAppReady(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(
    () => document.getElementById('loader')?.style.display === 'none',
    null,
    { timeout: 30000 }
  );
}

/** Upload one or more PDF fixture files via the hidden file input. */
async function uploadPDFs(page, ...filenames) {
  const paths = filenames.map((f) => join(FIXTURES, f));
  await page.setInputFiles('#file-input', paths);
}

test.describe('Opening PDFs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('shows empty state before any file is opened', async ({ page }) => {
    await expect(page.locator('#empty-state')).toBeVisible();
    await expect(page.locator('#tabs-track')).toBeEmpty();
    await expect(page.locator('#queue-count')).toHaveText('0 Pages');
  });

  test('opens a single PDF and creates a tab', async ({ page }) => {
    await uploadPDFs(page, 'test-doc1.pdf');
    await page.waitForSelector('.doc-tab', { timeout: 20000 });

    await expect(page.locator('.doc-tab')).toHaveCount(1);
    await expect(page.locator('.doc-tab').first()).toContainText('test-doc1.pdf');
  });

  test('opens multiple PDFs in one action and creates one tab per file', async ({ page }) => {
    await uploadPDFs(page, 'test-doc1.pdf', 'test-doc2.pdf');
    await page.waitForSelector('.doc-tab', { timeout: 20000 });

    await expect(page.locator('.doc-tab')).toHaveCount(2);
  });

  test('renders the correct number of pages for the active document', async ({ page }) => {
    // test-doc1.pdf has 2 pages; after upload it becomes the active doc
    await uploadPDFs(page, 'test-doc1.pdf');
    await page.waitForSelector('.page-wrapper', { timeout: 30000 });

    await expect(page.locator('.page-wrapper')).toHaveCount(2);
  });

  test('switches to the correct document when a tab is clicked', async ({ page }) => {
    await uploadPDFs(page, 'test-doc1.pdf', 'test-doc2.pdf');
    await page.waitForSelector('.doc-tab', { timeout: 20000 });

    // The last-uploaded file (test-doc2.pdf, 3 pages) is active by default.
    await page.waitForSelector('.page-wrapper', { timeout: 30000 });
    await expect(page.locator('.page-wrapper')).toHaveCount(3);

    // Click the first tab (test-doc1.pdf, 2 pages).
    await page.locator('.doc-tab').first().click();
    await page.waitForFunction(
      () => document.querySelectorAll('.page-wrapper').length === 2,
      null,
      { timeout: 20000 }
    );
    await expect(page.locator('.page-wrapper')).toHaveCount(2);
  });

  test('removes the tab when its close button is clicked', async ({ page }) => {
    await uploadPDFs(page, 'test-doc1.pdf', 'test-doc2.pdf');
    await page.waitForSelector('.doc-tab', { timeout: 20000 });

    // Close the first tab.
    await page.locator('.doc-tab').first().locator('.close-tab').click();
    await expect(page.locator('.doc-tab')).toHaveCount(1);
  });

  test('opens a third PDF alongside existing ones', async ({ page }) => {
    await uploadPDFs(page, 'test-doc1.pdf', 'test-doc2.pdf');
    await page.waitForSelector('.doc-tab', { timeout: 20000 });

    await uploadPDFs(page, 'test-doc3.pdf');
    await page.waitForFunction(
      () => document.querySelectorAll('.doc-tab').length === 3,
      null,
      { timeout: 20000 }
    );
    await expect(page.locator('.doc-tab')).toHaveCount(3);
  });
});
