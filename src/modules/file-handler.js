import { state, pdfFiles, pdfJsDocs, saveState } from './state.js';
import { showLoader, hideLoader } from './utils.js';
import { renderTabs, renderViewer } from './viewer.js';

export async function resetApp() {
  if (!confirm("Clear all PDFs and start over?")) return;
  await localforage.clear();
  location.reload();
}

export function setupFileHandling() {
  const fileInput = document.getElementById("file-input");
  if (!fileInput) return;
  
  fileInput.onchange = async (e) => {
    showLoader("Processing PDFs...");
    const files = Array.from(e.target.files);

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const id = "doc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

      try {
        const pdfDoc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
        pdfFiles[id] = buffer;
        pdfJsDocs[id] = pdfDoc;

        state.docs.push({
          id: id,
          name: file.name,
          pageCount: pdfDoc.numPages,
          blankPageCount: 0,
        });
      } catch (err) {
        console.error("Error loading PDF", file.name, err);
        alert(`Error loading ${file.name}`);
      }
    }

    if (!state.currentDocId && state.docs.length > 0) {
      state.currentDocId = state.docs[state.docs.length - 1].id;
    } else if (state.docs.length > 0) {
      state.currentDocId = state.docs[state.docs.length - 1].id;
    }

    saveState();
    renderTabs();
    renderViewer(state.currentDocId);
    hideLoader();
  };
}
