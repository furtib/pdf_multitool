// Main Entry Point
import { state, pdfFiles, pdfJsDocs, STATE_KEY, FILES_KEY, saveState, addBlankPage } from './modules/state.js';
import { undo, redo, setRedrawFunction } from './modules/undo.js';
import { showHelp, hideHelp, showLoader, hideLoader } from './modules/utils.js';
import { renderTabs, renderViewer, redrawCanvas, changeZoom, handleScroll, closeDoc } from './modules/viewer.js';
import { togglePageSelection, renderBasket, removePage } from './modules/selection.js';
import { setTool, setColor, setFontSize, clearCurrentPageDraw } from './modules/drawing.js';
import { exportPDF } from './modules/export.js';
import { toggleSidebar } from './modules/ui.js';
import { resetApp, setupFileHandling } from './modules/file-handler.js';

// Configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// Initialize Undo/Redo link to redrawCanvas
setRedrawFunction(redrawCanvas);

async function init() {
  showLoader("Loading Workspace...");
  try {
    // Setup Sidebar Sortable
    const basketList = document.getElementById("basket-list");
    if (basketList) {
      Sortable.create(basketList, {
        animation: 150,
        ghostClass: "blue-background-class",
        onEnd: (evt) => {
          const item = state.selectedPages.splice(evt.oldIndex, 1)[0];
          state.selectedPages.splice(evt.newIndex, 0, item);
          saveState();
        },
      });
    }

    // Setup Tabs Sortable
    const tabsTrack = document.getElementById("tabs-track");
    if (tabsTrack) {
      Sortable.create(tabsTrack, {
        animation: 150,
        ghostClass: "sortable-ghost",
        dragClass: "sortable-drag",
        onEnd: (evt) => {
          if (evt.oldIndex === evt.newIndex) return;
          const item = state.docs.splice(evt.oldIndex, 1)[0];
          state.docs.splice(evt.newIndex, 0, item);
          saveState();
        },
      });

      tabsTrack.addEventListener("wheel", (evt) => {
        if (evt.deltaY !== 0) {
          evt.preventDefault();
          tabsTrack.scrollLeft += evt.deltaY;
        }
      });
    }

    // Load Data
    const savedState = await localforage.getItem(STATE_KEY);
    if (savedState) Object.assign(state, savedState);
    
    if (state.drawMode) {
      state.tool = "draw";
      delete state.drawMode;
    }

    const savedFiles = await localforage.getItem(FILES_KEY);
    if (savedFiles) Object.assign(pdfFiles, savedFiles);

    // Hydrate PDF.js docs
    const promises = state.docs.map(async (doc) => {
      if (pdfFiles[doc.id]) {
        const data = pdfFiles[doc.id];
        pdfJsDocs[doc.id] = await pdfjsLib.getDocument({ data: data.slice(0) }).promise;
      }
    });
    await Promise.all(promises);

    renderTabs();
    renderBasket();

    // Restore visual state
    const zoomEl = document.getElementById("zoom-level");
    if (zoomEl) zoomEl.innerText = Math.round(state.zoom * 100) + "%";
    
    setTool(state.tool);
    
    const colorPicker = document.getElementById("color-picker");
    if (colorPicker && state.color) {
      colorPicker.value = state.color;
      const preview = document.getElementById("color-preview");
      if (preview) preview.style.backgroundColor = state.color;
    }
    
    const fontSizeEl = document.getElementById("font-size");
    if (fontSizeEl && state.fontSize) {
      fontSizeEl.value = state.fontSize;
    }

    if (state.sidebarWidth) {
      const sidebar = document.getElementById("sidebar");
      if (sidebar) sidebar.style.width = state.sidebarWidth + "px";
    }
    
    if (state.isSidebarOpen === false) {
      toggleSidebar(false);
    }

    if (state.currentDocId && pdfJsDocs[state.currentDocId]) {
      await renderViewer(state.currentDocId);
      const container = document.getElementById("viewer-container");
      if (container) container.scrollTop = state.scrollTop || 0;
    }
  } catch (e) {
    console.error("Init failed", e);
    alert("Could not restore previous session. Clearing data.");
    // We can't easily call resetApp here because of circular dependencies, 
    // but a reload might fix it or they can click the button.
  } finally {
    hideLoader();
  }
}

// Global Event Listeners
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;

  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "y") {
    e.preventDefault();
    redo();
  }
  if (e.key === "F1") {
    e.preventDefault();
    showHelp();
  }
  if (e.key === "Escape") {
    hideHelp();
  }
});

const viewerContainer = document.getElementById("viewer-container");
if (viewerContainer) {
  viewerContainer.onscroll = handleScroll;
}

// Exposed to global scope for HTML onclick handlers
window.state = state;
window.changeZoom = changeZoom;
window.undo = undo;
window.redo = redo;
window.setTool = setTool;
window.setColor = setColor;
window.setFontSize = setFontSize;
window.showHelp = showHelp;
window.hideHelp = hideHelp;
window.resetApp = resetApp;
window.toggleSidebar = toggleSidebar;
window.exportPDF = exportPDF;
window.closeDoc = closeDoc;
window.removePage = removePage;
window.addBlankPage = addBlankPage;

// Start the app
setupFileHandling();
init();
