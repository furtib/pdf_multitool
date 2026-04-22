const { test, expect } = require("@playwright/test");
const { clearStorage, uploadPdf } = require("./test-helpers");

test.describe("Export Queue", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("index.html");
    await clearStorage(page);
    await uploadPdf(page, "test-doc1.pdf");
  });

  test("should add and remove pages from queue", async ({ page }) => {
    const addBtn = page.locator(".add-btn").first();
    await addBtn.click();
    
    await expect(addBtn).toContainText("✓ Added");
    await expect(page.locator("#queue-count")).toContainText("1 Pages");
    await expect(page.locator(".basket-item")).toHaveCount(1);
    
    // Remove via basket '✕'
    await page.locator(".basket-item .remove-btn").click();
    await expect(page.locator(".basket-item")).toHaveCount(0);
    await expect(page.locator("#queue-count")).toContainText("0 Pages");
    await expect(addBtn).toContainText("+ Add Page");
  });

  test("should show hover preview for basket items", async ({ page }) => {
    await page.click("text=+ Add Page");
    
    const basketItem = page.locator(".basket-item");
    const preview = page.locator("#hover-preview");
    
    await basketItem.hover();
    await expect(preview).toBeVisible();
    
    // Wait for canvas to be drawn inside preview
    await expect(preview.locator("canvas")).toBeVisible();
    
    await page.mouse.move(0, 0); // Move away
    await expect(preview).not.toBeVisible();
  });

  test("should export a merged PDF", async ({ page }) => {
    await page.click("text=+ Add Page");
    
    const downloadBtn = page.locator("#download-btn");
    await expect(downloadBtn).not.toBeDisabled();
    
    // Intercept download
    const downloadPromise = page.waitForEvent("download");
    await downloadBtn.click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toBe("stitched_pro.pdf");
  });
});
