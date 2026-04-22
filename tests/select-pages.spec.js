import { test, expect } from './test-base.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, 'fixtures');

async function waitForAppReady(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(
    () => document.getElementById('loader')?.style.display === 'none',
    null,
    { timeout: 30000 }
  );
}

async function uploadPDFs(page, ...filenames) {
  const paths = filenames.map((f) => join(FIXTURES, f));
  await page.setInputFiles('#file-input', paths);
}

/** Open a PDF and wait for its pages to appear in the viewer. */
async function openAndWaitForPages(page, filename, expectedPages) {
  await uploadPDFs(page, filename);
  await page.waitForFunction(
    (n) => document.querySelectorAll('.page-wrapper').length === n,
    expectedPages,
    { timeout: 30000 }
  );
}

test.describe('Selecting Slides / Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('add-page button is present for every rendered page', async ({ page }) => {
    await openAndWaitForPages(page, 'test-doc1.pdf', 2);
    // Each page has one add-btn
    await expect(page.locator('.add-btn')).toHaveCount(2);
  });

  test('clicking "+ Add Page" adds the page to the export queue', async ({ page }) => {
    await openAndWaitForPages(page, 'test-doc1.pdf', 2);

    await page.locator('.add-btn').first().click();

    await expect(page.locator('#queue-count')).toHaveText('1 Pages');
    await expect(page.locator('.basket-item')).toHaveCount(1);
  });

  test('button label changes to "✓ Added" after selection', async ({ page }) => {
    await openAndWaitForPages(page, 'test-doc1.pdf', 2);

    const btn = page.locator('.add-btn').first();
    await btn.click();

    await expect(btn).toContainText('Added');
    await expect(btn).toHaveClass(/added/);
  });

  test('clicking the button again deselects the page', async ({ page }) => {
    await openAndWaitForPages(page, 'test-doc1.pdf', 2);

    const btn = page.locator('.add-btn').first();
    await btn.click(); // select
    await btn.click(); // deselect

    await expect(btn).toContainText('+ Add Page');
    await expect(page.locator('#queue-count')).toHaveText('0 Pages');
  });

  test('selecting all pages from a single PDF shows the correct count', async ({ page }) => {
    await openAndWaitForPages(page, 'test-doc2.pdf', 3);

    for (const btn of await page.locator('.add-btn').all()) {
      await btn.click();
    }

    await expect(page.locator('#queue-count')).toHaveText('3 Pages');
    await expect(page.locator('.basket-item')).toHaveCount(3);
  });

  test('selecting pages from multiple PDFs accumulates in the queue', async ({ page }) => {
    // Upload both docs; test-doc2 (3 pages) becomes active.
    await uploadPDFs(page, 'test-doc1.pdf', 'test-doc2.pdf');
    await page.waitForFunction(
      () => document.querySelectorAll('.page-wrapper').length === 3,
      null,
      { timeout: 30000 }
    );

    // Add page 1 from test-doc2 (currently active).
    await page.locator('.add-btn').first().click();
    await expect(page.locator('#queue-count')).toHaveText('1 Pages');

    // Switch to test-doc1 and add one of its pages.
    await page.locator('.doc-tab').first().click();
    await page.waitForFunction(
      () => document.querySelectorAll('.page-wrapper').length === 2,
      null,
      { timeout: 20000 }
    );
    await page.locator('.add-btn').first().click();

    // Queue should now have 2 pages from 2 different documents.
    await expect(page.locator('#queue-count')).toHaveText('2 Pages');

    const docNames = await page.locator('.basket-item .doc-name').allInnerTexts();
    const uniqueDocs = new Set(docNames);
    expect(uniqueDocs.size).toBe(2);
  });

  test('removing a page from the queue decrements the count', async ({ page }) => {
    await openAndWaitForPages(page, 'test-doc1.pdf', 2);

    await page.locator('.add-btn').first().click();
    await expect(page.locator('#queue-count')).toHaveText('1 Pages');

    // Click the ✕ remove button in the sidebar
    await page.locator('.basket-item button').first().click();

    await expect(page.locator('#queue-count')).toHaveText('0 Pages');
    await expect(page.locator('.basket-item')).toHaveCount(0);
  });

  test('export queue reflects page numbers correctly', async ({ page }) => {
    await openAndWaitForPages(page, 'test-doc2.pdf', 3);

    // Add page 2 (second add-btn).
    await page.locator('.add-btn').nth(1).click();

    const pageNum = await page.locator('.basket-item .page-num').first().innerText();
    expect(pageNum).toBe('Page 2');
  });

  test('state.selectedPages matches the visible queue', async ({ page }) => {
    await openAndWaitForPages(page, 'test-doc1.pdf', 2);

    await page.locator('.add-btn').first().click();
    await page.locator('.add-btn').nth(1).click();

    const selected = await page.evaluate(() => state.selectedPages.length);
    expect(selected).toBe(2);
  });
});
