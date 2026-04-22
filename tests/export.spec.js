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

async function openDoc(page, filename, pageCount) {
  await page.setInputFiles('#file-input', join(FIXTURES, filename));
  await page.waitForFunction(
    (n) => document.querySelectorAll('.page-wrapper').length === n,
    pageCount,
    { timeout: 30000 }
  );
}

test.describe('Export Queue and Output', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('download button is disabled when the queue is empty', async ({ page }) => {
    await expect(page.locator('#download-btn')).toBeDisabled();
  });

  test('download button becomes enabled once a page is added', async ({ page }) => {
    await openDoc(page, 'test-doc1.pdf', 2);
    await page.locator('.add-btn').first().click();
    await expect(page.locator('#download-btn')).toBeEnabled();
  });

  test('download button is disabled again after all pages are removed', async ({ page }) => {
    await openDoc(page, 'test-doc1.pdf', 2);

    await page.locator('.add-btn').first().click();
    await expect(page.locator('#download-btn')).toBeEnabled();

    await page.locator('.basket-item button').first().click();
    await expect(page.locator('#download-btn')).toBeDisabled();
  });

  test('queue count accurately reflects the number of selected pages', async ({ page }) => {
    await openDoc(page, 'test-doc2.pdf', 3);

    for (const btn of await page.locator('.add-btn').all()) {
      await btn.click();
    }

    await expect(page.locator('#queue-count')).toHaveText('3 Pages');
    await expect(page.locator('.basket-item')).toHaveCount(3);
  });

  test('each basket item shows the correct page number and document name', async ({ page }) => {
    await openDoc(page, 'test-doc2.pdf', 3);

    // Add the second page only.
    await page.locator('.add-btn').nth(1).click();

    await expect(page.locator('.basket-item .page-num').first()).toHaveText('Page 2');
    await expect(page.locator('.basket-item .doc-name').first()).toContainText('test-doc2.pdf');
  });

  test('pages from multiple documents appear in the queue with correct labels', async ({ page }) => {
    // Upload both docs; test-doc2 (3 pages) becomes active.
    await page.setInputFiles('#file-input', [
      join(FIXTURES, 'test-doc1.pdf'),
      join(FIXTURES, 'test-doc2.pdf'),
    ]);
    await page.waitForFunction(
      () => document.querySelectorAll('.page-wrapper').length === 3,
      null,
      { timeout: 30000 }
    );

    // Add one page from test-doc2.
    await page.locator('.add-btn').first().click();

    // Switch to test-doc1 and add one page.
    await page.locator('.doc-tab').first().click();
    await page.waitForFunction(
      () => document.querySelectorAll('.page-wrapper').length === 2,
      null,
      { timeout: 20000 }
    );
    await page.locator('.add-btn').nth(1).click();

    await expect(page.locator('#queue-count')).toHaveText('2 Pages');

    const docNames = await page.locator('.basket-item .doc-name').allInnerTexts();
    expect(docNames).toContain('test-doc1.pdf');
    expect(docNames).toContain('test-doc2.pdf');
  });

  test('clicking Download Merged PDF triggers a file download', async ({ page }) => {
    await openDoc(page, 'test-doc1.pdf', 2);
    await page.locator('.add-btn').first().click();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.locator('#download-btn').click(),
    ]);

    expect(download.suggestedFilename()).toBe('stitched_pro.pdf');
  });

  test('exported PDF download has a non-zero size', async ({ page }) => {
    await openDoc(page, 'test-doc1.pdf', 2);
    await page.locator('.add-btn').first().click();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.locator('#download-btn').click(),
    ]);

    const path = await download.path();
    const { statSync } = await import('fs');
    const { size } = statSync(path);
    expect(size).toBeGreaterThan(0);
  });

  test('exported PDF with annotation from multiple docs has correct size', async ({ page }) => {
    // Open two docs and select pages from each.
    await page.setInputFiles('#file-input', [
      join(FIXTURES, 'test-doc1.pdf'),
      join(FIXTURES, 'test-doc2.pdf'),
    ]);
    await page.waitForFunction(
      () => document.querySelectorAll('.page-wrapper').length === 3,
      null,
      { timeout: 30000 }
    );

    // Draw on a page of test-doc2 then add it.
    await page.click('#draw-toggle');
    const canvas = page.locator('.draw-canvas').first();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 120);
    await page.mouse.up();
    await page.locator('.add-btn').first().click();

    // Switch to test-doc1 and add a page (no drawing).
    await page.locator('.doc-tab').first().click();
    await page.waitForFunction(
      () => document.querySelectorAll('.page-wrapper').length === 2,
      null,
      { timeout: 20000 }
    );
    await page.locator('.add-btn').first().click();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.locator('#download-btn').click(),
    ]);

    const path = await download.path();
    const { statSync } = await import('fs');
    const { size } = statSync(path);
    expect(size).toBeGreaterThan(1000); // Real PDF with embedded image annotation
  });
});
