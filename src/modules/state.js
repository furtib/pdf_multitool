// Global Application State
export const STATE_KEY = "pdf_stitcher_v2_state";
export const FILES_KEY = "pdf_stitcher_v2_files";

export let state = {
  docs: [], // { id, name, pageCount }
  selectedPages: [], // { id (unique), docId, pageNum, name }
  drawings: {}, // { "docId-pageNum": [ {x,y, type: 'path', points: []} ] }
  currentDocId: null,
  zoom: 1.0,
  tool: null, // 'draw', 'erase', 'text', null
  color: "#ef4444",
  fontSize: 16,
  scrollTop: 0,
  sidebarWidth: 320,
  isSidebarOpen: true,
};

export let pdfFiles = {}; // { docId: ArrayBuffer } stored in IndexedDB
export let pdfJsDocs = {}; // Cache of loaded PDF.js documents

export function resetAppState() {
  for (let key in state) delete state[key];
  Object.assign(state, {
    docs: [],
    selectedPages: [],
    drawings: {},
    currentDocId: null,
    zoom: 1.0,
    tool: null,
    color: "#ef4444",
    fontSize: 16,
    scrollTop: 0,
    sidebarWidth: 320,
    isSidebarOpen: true,
  });
  for (let key in pdfFiles) delete pdfFiles[key];
  for (let key in pdfJsDocs) delete pdfJsDocs[key];
}

export async function saveState() {
  const statusText = document.getElementById("status-text");
  if (statusText) statusText.innerText = "Saving...";
  
  await localforage.setItem(STATE_KEY, state);
  await localforage.setItem(FILES_KEY, pdfFiles);
  
  if (statusText) {
    statusText.innerText = "Saved";
    setTimeout(() => (statusText.innerText = ""), 1000);
  }
}
