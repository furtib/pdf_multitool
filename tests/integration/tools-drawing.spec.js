const { test, expect } = require("@playwright/test");
const { clearStorage, uploadPdf } = require("./test-helpers");

test.describe("Drawing & Tools", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("index.html");
    await clearStorage(page);
    await uploadPdf(page, "test-doc1.pdf");
  });

  test("should toggle tools and update UI state", async ({ page }) => {
    await page.click("#draw-toggle");
    await expect(page.locator("#draw-toggle")).toHaveClass(/active/);
    await expect(page.locator(".page-wrapper").first()).toHaveClass(/draw-mode/);

    await page.click("#text-toggle");
    await expect(page.locator("#draw-toggle")).not.toHaveClass(/active/);
    await expect(page.locator("#text-toggle")).toHaveClass(/active/);
    await expect(page.locator("#font-size-group")).toBeVisible();

    await page.click("#erase-toggle");
    await expect(page.locator("#erase-toggle")).toHaveClass(/active/);
    await expect(page.locator("#font-size-group")).not.toBeVisible();
  });

  test("should draw a path and undo it", async ({ page }) => {
    await page.click("#draw-toggle");
    
    const canvas = page.locator(".draw-canvas").first();
    const box = await canvas.boundingBox();
    
    // Perform a drawing motion
    await page.mouse.move(box.x + 50, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.up();
    
    // Undo button should now be enabled
    const btnUndo = page.locator("#btn-undo");
    await expect(btnUndo).not.toBeDisabled();
    
    // Undo
    await btnUndo.click();
    await expect(btnUndo).toBeDisabled();
    
    // Redo should now be enabled
    const btnRedo = page.locator("#btn-redo");
    await expect(btnRedo).not.toBeDisabled();
    
    // Redo
    await btnRedo.click();
    await expect(btnRedo).toBeDisabled();
    await expect(btnUndo).not.toBeDisabled();
  });

  test("should add text annotation", async ({ page }) => {
    await page.click("#text-toggle");
    
    const canvas = page.locator(".draw-canvas").first();
    const box = await canvas.boundingBox();
    
    // Click to start text input
    await page.mouse.click(box.x + 50, box.y + 50);
    
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
    
    await textarea.fill("Hello Playwright");
    await page.keyboard.press("Enter"); // Triggers blur/save
    
    await expect(textarea).not.toBeVisible();
    await expect(page.locator("#btn-undo")).not.toBeDisabled();
  });

  test("should clear drawings", async ({ page }) => {
    await page.click("#draw-toggle");
    const canvas = page.locator(".draw-canvas").first();
    const box = await canvas.boundingBox();
    
    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.up();
    
    await expect(page.locator("#btn-undo")).not.toBeDisabled();
    
    // Click Clear (usually in a dropdown or toolbar, let's check index.html)
    // index.html has: <button class="btn" title="Clear all drawings" onclick="clearCurrentPageDraw()">Clear</button>
    
    page.on('dialog', dialog => dialog.accept());
    await page.click("text=Clear");
    
    await expect(page.locator("#btn-undo")).toBeDisabled();
  });
});
