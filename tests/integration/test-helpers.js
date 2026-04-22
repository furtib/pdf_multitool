const { expect } = require("@playwright/test");
const path = require("path");

async function clearStorage(page) {
  await page.evaluate(async () => {
    if (window.localforage) {
      await window.localforage.clear();
    }
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}

async function uploadPdf(page, fileName) {
  const filePath = path.join(__dirname, "..", "fixtures", fileName);
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.click("text=+ Open PDFs");
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);
  await page.waitForSelector("#loader", { state: "hidden" });
}

async function uploadMultiplePdfs(page, fileNames) {
  const filePaths = fileNames.map(name => path.join(__dirname, "..", "fixtures", name));
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.click("text=+ Open PDFs");
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePaths);
  await page.waitForSelector("#loader", { state: "hidden" });
}

module.exports = {
  clearStorage,
  uploadPdf,
  uploadMultiplePdfs
};
