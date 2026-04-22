const { test, expect } = require("@playwright/test");
const { clearStorage, uploadPdf } = require("./test-helpers");

test.describe("UI Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("index.html");
    await clearStorage(page);
  });

  test("should zoom in and out", async ({ page }) => {
    await uploadPdf(page, "test-doc1.pdf");

    await expect(page.locator("#zoom-level")).toContainText("100%");

    // Zoom in
    await page.click("text=＋");
    await expect(page.locator("#zoom-level")).toContainText("120%");

    // Zoom out
    await page.click("text=－");
    await page.click("text=－");
    await expect(page.locator("#zoom-level")).toContainText("80%");
  });

  test("should toggle sidebar", async ({ page }) => {
    const sidebar = page.locator("#sidebar");
    const toggleBtn = page.locator("#sidebar-toggle-btn");
    
    // Sidebar should be visible initially
    await expect(sidebar).toBeVisible();
    await expect(toggleBtn).not.toBeVisible();
    
    // Click Sidebar Toggle (inside sidebar header)
    // Actually there is no close button in sidebar header, it uses the global toggleBtn when closed.
    // Wait, script.js toggleSidebar handles visibility of #sidebar-toggle-btn.
    // There is no explicit "Close" button in CSS for sidebar, let's check index.html.
    // Index.html has <div class="sidebar-header"><h3>Export Queue</h3></div>
    // The resizer or a keybinding might close it? No, script.js has toggleSidebar(forceState).
    // Let's check how it's triggered in index.html.
    // <div id="sidebar-toggle-btn" class="sidebar-toggle-btn" onclick="toggleSidebar()">Basket</div>
    
    // I will trigger it via page.evaluate since there is no 'close' button in UI visible in the provided snippets.
    // Ah, usually there is a button. Let's check the header again.
    await page.evaluate(() => window.toggleSidebar(false));
    await expect(sidebar).not.toBeVisible();
    await expect(toggleBtn).toBeVisible();
    
    await toggleBtn.click();
    await expect(sidebar).toBeVisible();
  });

  test("should open and close help modal", async ({ page }) => {
    const helpModal = page.locator("#help-modal");
    
    // Open via key
    await page.keyboard.press("F1");
    await expect(helpModal).toBeVisible();
    
    // Close via key
    await page.keyboard.press("Escape");
    await expect(helpModal).not.toBeVisible();
    
    // Open via Evaluate (checking global export)
    await page.evaluate(() => window.showHelp());
    await expect(helpModal).toBeVisible();
    
    // Close via close button in modal
    await page.click(".close-modal");
    await expect(helpModal).not.toBeVisible();
  });
});
