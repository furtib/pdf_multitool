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

/** Open a PDF and wait for its pages to appear in the viewer. */
async function openDoc(page, filename, pageCount) {
  await page.setInputFiles('#file-input', join(FIXTURES, filename));
  await page.waitForFunction(
    (n) => document.querySelectorAll('.page-wrapper').length === n,
    pageCount,
    { timeout: 30000 }
  );
}

/** Draw a line on the first draw-canvas by simulating mouse drag. */
async function drawLine(page, startX = 50, startY = 50, endX = 150, endY = 150) {
  const canvas = page.locator('.draw-canvas').first();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + startX, box.y + startY);
  await page.mouse.down();
  await page.mouse.move(box.x + endX, box.y + endY);
  await page.mouse.up();
}

test.describe('Drawing and Editing Tools', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await openDoc(page, 'test-doc1.pdf', 2);
  });

  // --- Tool activation ---

  test('draw button is not active by default', async ({ page }) => {
    await expect(page.locator('#draw-toggle')).not.toHaveClass(/active/);
  });

  test('clicking Draw activates the draw tool', async ({ page }) => {
    await page.click('#draw-toggle');
    await expect(page.locator('#draw-toggle')).toHaveClass(/active/);

    const tool = await page.evaluate(() => state.tool);
    expect(tool).toBe('draw');
  });

  test('clicking Draw a second time toggles it off', async ({ page }) => {
    await page.click('#draw-toggle');
    await page.click('#draw-toggle');

    await expect(page.locator('#draw-toggle')).not.toHaveClass(/active/);
    const tool = await page.evaluate(() => state.tool);
    expect(tool).toBeNull();
  });

  test('clicking Eraser activates the erase tool', async ({ page }) => {
    await page.click('#erase-toggle');
    await expect(page.locator('#erase-toggle')).toHaveClass(/active/);

    const tool = await page.evaluate(() => state.tool);
    expect(tool).toBe('erase');
  });

  test('clicking Text activates the text tool', async ({ page }) => {
    await page.click('#text-toggle');
    await expect(page.locator('#text-toggle')).toHaveClass(/active/);

    const tool = await page.evaluate(() => state.tool);
    expect(tool).toBe('text');
  });

  test('activating Text shows the font-size control', async ({ page }) => {
    await expect(page.locator('#font-size-group')).not.toBeVisible();
    await page.click('#text-toggle');
    await expect(page.locator('#font-size-group')).toBeVisible();
  });

  test('deactivating Text hides the font-size control again', async ({ page }) => {
    await page.click('#text-toggle'); // on
    await page.click('#text-toggle'); // off
    await expect(page.locator('#font-size-group')).not.toBeVisible();
  });

  test('only one tool is active at a time', async ({ page }) => {
    await page.click('#draw-toggle');
    await page.click('#erase-toggle');

    await expect(page.locator('#draw-toggle')).not.toHaveClass(/active/);
    await expect(page.locator('#erase-toggle')).toHaveClass(/active/);
  });

  // --- Color picker ---

  test('changing the color updates state and the color preview', async ({ page }) => {
    await page.evaluate(() => {
      const picker = document.getElementById('color-picker');
      picker.value = '#0000ff';
      picker.dispatchEvent(new Event('change'));
    });

    const color = await page.evaluate(() => state.color);
    expect(color).toBe('#0000ff');

    const previewBg = await page.locator('#color-preview').evaluate(
      (el) => el.style.backgroundColor
    );
    // Browsers normalise hex to rgb()
    expect(previewBg).toBe('rgb(0, 0, 255)');
  });

  // --- Font size ---

  test('changing the font size updates state', async ({ page }) => {
    await page.evaluate(() => {
      const input = document.getElementById('font-size');
      input.value = 24;
      input.dispatchEvent(new Event('change'));
    });

    const size = await page.evaluate(() => state.fontSize);
    expect(size).toBe(24);
  });

  // --- Drawing on canvas ---

  test('drawing a stroke records it in state.drawings', async ({ page }) => {
    await page.click('#draw-toggle');
    await drawLine(page);

    const drawingCount = await page.evaluate(() =>
      Object.values(state.drawings).reduce((sum, arr) => sum + arr.length, 0)
    );
    expect(drawingCount).toBeGreaterThan(0);
  });

  test('no drawing is recorded when no tool is active', async ({ page }) => {
    // Tool is null by default – drawing should be ignored.
    await drawLine(page);

    const drawingCount = await page.evaluate(() =>
      Object.values(state.drawings).reduce((sum, arr) => sum + arr.length, 0)
    );
    expect(drawingCount).toBe(0);
  });

  // --- Undo / Redo ---

  test('undo button is disabled before any drawing', async ({ page }) => {
    await expect(page.locator('#btn-undo')).toBeDisabled();
  });

  test('redo button is disabled before any undo', async ({ page }) => {
    await expect(page.locator('#btn-redo')).toBeDisabled();
  });

  test('undo button becomes enabled after drawing a stroke', async ({ page }) => {
    await page.click('#draw-toggle');
    await drawLine(page);

    await expect(page.locator('#btn-undo')).toBeEnabled();
  });

  test('undo removes the last drawing', async ({ page }) => {
    await page.click('#draw-toggle');
    await drawLine(page, 50, 50, 150, 150);

    const beforeUndo = await page.evaluate(() =>
      Object.values(state.drawings).reduce((sum, arr) => sum + arr.length, 0)
    );
    expect(beforeUndo).toBeGreaterThan(0);

    await page.click('#btn-undo');

    const afterUndo = await page.evaluate(() =>
      Object.values(state.drawings).reduce((sum, arr) => sum + arr.length, 0)
    );
    expect(afterUndo).toBe(0);
  });

  test('redo restores a stroke after undo', async ({ page }) => {
    await page.click('#draw-toggle');
    await drawLine(page, 50, 50, 150, 150);
    await page.click('#btn-undo');

    await expect(page.locator('#btn-redo')).toBeEnabled();
    await page.click('#btn-redo');

    const afterRedo = await page.evaluate(() =>
      Object.values(state.drawings).reduce((sum, arr) => sum + arr.length, 0)
    );
    expect(afterRedo).toBeGreaterThan(0);
  });

  test('Ctrl+Z undoes a drawing', async ({ page }) => {
    await page.click('#draw-toggle');
    await drawLine(page);

    await page.keyboard.press('Control+z');

    const count = await page.evaluate(() =>
      Object.values(state.drawings).reduce((sum, arr) => sum + arr.length, 0)
    );
    expect(count).toBe(0);
  });

  test('Ctrl+Y redoes after Ctrl+Z', async ({ page }) => {
    await page.click('#draw-toggle');
    await drawLine(page);
    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+y');

    const count = await page.evaluate(() =>
      Object.values(state.drawings).reduce((sum, arr) => sum + arr.length, 0)
    );
    expect(count).toBeGreaterThan(0);
  });

  // --- Eraser ---

  test('eraser removes a drawn stroke', async ({ page }) => {
    // Draw a stroke first
    await page.click('#draw-toggle');
    await drawLine(page, 50, 50, 100, 100);

    const beforeErase = await page.evaluate(() =>
      Object.values(state.drawings).reduce((sum, arr) => sum + arr.length, 0)
    );
    expect(beforeErase).toBeGreaterThan(0);

    // Switch to eraser and erase the stroke
    await page.click('#erase-toggle');
    await drawLine(page, 50, 50, 100, 100); // drag over the same path

    const afterErase = await page.evaluate(() =>
      Object.values(state.drawings).reduce((sum, arr) => sum + arr.length, 0)
    );
    expect(afterErase).toBeLessThan(beforeErase);
  });

  // --- Zoom ---

  test('zoom in increases the zoom level', async ({ page }) => {
    const before = await page.evaluate(() => state.zoom);
    await page.click('button:has-text("＋")');
    const after = await page.evaluate(() => state.zoom);
    expect(after).toBeGreaterThan(before);
  });

  test('zoom out decreases the zoom level', async ({ page }) => {
    const before = await page.evaluate(() => state.zoom);
    await page.click('button:has-text("－")');
    const after = await page.evaluate(() => state.zoom);
    expect(after).toBeLessThan(before);
  });

  test('zoom level display updates when zooming', async ({ page }) => {
    await page.click('button:has-text("＋")');
    const text = await page.locator('#zoom-level').innerText();
    expect(text).not.toBe('100%');
  });
});
