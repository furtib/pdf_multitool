const { test, expect } = require("@playwright/test");
const path = require("path");

test.describe("PDF Multitool", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the page and clear localforage to start fresh
    await page.goto("index.html");
    await page.evaluate(async () => {
      if (window.localforage) {
        await window.localforage.clear();
      }
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test("should show empty state initially", async ({ page }) => {
    await expect(page.locator("#empty-state")).toBeVisible();
    await expect(page.locator("h2")).toContainText("No Document Open");
  });

  test("should open a PDF and show its pages", async ({ page }) => {
    const filePath = path.join(__dirname, "fixtures", "test-doc1.pdf");

    // Using the file input to upload
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.click("text=+ Open PDFs");
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);

    // Wait for the loader to disappear
    await page.waitForSelector("#loader", { state: "hidden" });

    // Check if the tab is created
    await expect(page.locator(".doc-tab.active")).toContainText(
      "test-doc1.pdf",
    );

    // Check if pages are rendered (test-doc1.pdf has 2 pages)
    await expect(page.locator(".page-wrapper")).toHaveCount(2);
    await expect(page.locator(".page-meta").first()).toContainText("1");
    await expect(page.locator(".page-meta").last()).toContainText("2");
  });

  test("should add a page to the export queue", async ({ page }) => {
    const filePath = path.join(__dirname, "fixtures", "test-doc1.pdf");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.click("text=+ Open PDFs");
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);

    await page.waitForSelector("#loader", { state: "hidden" });

    // Click "Add Page"
    await page.click("text=+ Add Page");

    // Check if it changed to "Added"
    await expect(page.locator(".add-btn.added")).toBeVisible();
    await expect(page.locator(".add-btn.added")).toContainText("✓ Added");

    // Check export queue count in sidebar
    await expect(page.locator("#queue-count")).toContainText("1 Pages");

    // Check if page appears in the basket
    await expect(page.locator(".basket-item")).toHaveCount(1);
    await expect(page.locator(".basket-item .page-num")).toContainText(
      "Page 1",
    );
    await expect(page.locator(".basket-item .doc-name")).toContainText(
      "test-doc1.pdf",
    );

    // Check if download button is enabled
    await expect(page.locator("#download-btn")).not.toBeDisabled();
  });

  test("should switch between multiple PDFs", async ({ page }) => {
    const file1 = path.join(__dirname, "fixtures", "test-doc1.pdf");
    const file2 = path.join(__dirname, "fixtures", "test-doc2.pdf");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.click("text=+ Open PDFs");
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([file1, file2]);

    await page.waitForSelector("#loader", { state: "hidden" });

    // Should have 2 tabs
    await expect(page.locator(".doc-tab")).toHaveCount(2);

    // The last one added should be active (according to script.js logic)
    await expect(page.locator(".doc-tab.active")).toContainText(
      "test-doc2.pdf",
    );

    // Click on the first tab
    await page.click("text=test-doc1.pdf");
    await expect(page.locator(".doc-tab.active")).toContainText(
      "test-doc1.pdf",
    );
  });

  test("should zoom in and out", async ({ page }) => {
    const filePath = path.join(__dirname, "fixtures", "test-doc1.pdf");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.click("text=+ Open PDFs");
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);

    await page.waitForSelector("#loader", { state: "hidden" });

    await expect(page.locator("#zoom-level")).toContainText("100%");

    // Zoom in
    await page.click("text=＋");
    await expect(page.locator("#zoom-level")).toContainText("120%");

    // Zoom out
    await page.click("text=－");
    await page.click("text=－");
    await expect(page.locator("#zoom-level")).toContainText("80%");
  });

  test("should toggle tools correctly", async ({ page }) => {
    // Tool switching doesn't require a PDF to be open for the UI state
    await page.click("#draw-toggle");
    await expect(page.locator("#draw-toggle")).toHaveClass(/active/);

    await page.click("#text-toggle");
    await expect(page.locator("#draw-toggle")).not.toHaveClass(/active/);
    await expect(page.locator("#text-toggle")).toHaveClass(/active/);
    await expect(page.locator("#font-size-group")).toBeVisible();

    await page.click("#erase-toggle");
    await expect(page.locator("#text-toggle")).not.toHaveClass(/active/);
    await expect(page.locator("#erase-toggle")).toHaveClass(/active/);
    await expect(page.locator("#font-size-group")).not.toBeVisible();

    // Toggle off
    await page.click("#erase-toggle");
    await expect(page.locator("#erase-toggle")).not.toHaveClass(/active/);
  });
});
