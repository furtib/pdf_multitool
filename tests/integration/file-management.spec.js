const { test, expect } = require("@playwright/test");
const { clearStorage, uploadPdf, uploadMultiplePdfs } = require("./test-helpers");

test.describe("File Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("index.html");
    await clearStorage(page);
  });

  test("should show empty state initially", async ({ page }) => {
    await expect(page.locator("#empty-state")).toBeVisible();
    await expect(page.locator("h2")).toContainText("No Document Open");
  });

  test("should open a PDF and render all pages", async ({ page }) => {
    await uploadPdf(page, "test-doc1.pdf");

    await expect(page.locator(".doc-tab.active")).toContainText("test-doc1.pdf");
    // test-doc1.pdf has 2 pages
    await expect(page.locator(".page-wrapper")).toHaveCount(2);
    await expect(page.locator(".page-meta").first()).toContainText("1");
    await expect(page.locator(".page-meta").last()).toContainText("2");
  });

  test("should switch between multiple PDFs", async ({ page }) => {
    await uploadMultiplePdfs(page, ["test-doc1.pdf", "test-doc2.pdf"]);

    await expect(page.locator(".doc-tab")).toHaveCount(2);
    // Last one added should be active
    await expect(page.locator(".doc-tab.active")).toContainText("test-doc2.pdf");

    // Switch to first
    await page.click("text=test-doc1.pdf");
    await expect(page.locator(".doc-tab.active")).toContainText("test-doc1.pdf");
    await expect(page.locator(".page-wrapper")).toHaveCount(2);
  });

  test("should close documents and fallback to previous tab", async ({ page }) => {
    await uploadMultiplePdfs(page, ["test-doc1.pdf", "test-doc2.pdf"]);
    
    // Close doc2
    await page.locator(".doc-tab.active .close-tab").click();
    
    await expect(page.locator(".doc-tab")).toHaveCount(1);
    await expect(page.locator(".doc-tab.active")).toContainText("test-doc1.pdf");
    
    // Close doc1
    await page.locator(".doc-tab.active .close-tab").click();
    await expect(page.locator("#empty-state")).toBeVisible();
  });

  test("should add a blank page to the current document", async ({ page }) => {
    await uploadPdf(page, "test-doc1.pdf");
    
    // Initially 2 pages
    await expect(page.locator(".page-wrapper")).toHaveCount(2);
    
    // Click + Blank Page
    await page.click("text=+ Blank Page");
    
    // Should now have 3 pages
    await expect(page.locator(".page-wrapper")).toHaveCount(3);
    await expect(page.locator(".page-meta").last()).toContainText("3");
    
    // Add the blank page to basket
    await page.locator(".add-btn").last().click();
    await expect(page.locator("#queue-count")).toContainText("1 Pages");
    await expect(page.locator(".basket-item")).toHaveCount(1);
    await expect(page.locator(".basket-item")).toContainText("Page 3");
  });
});
