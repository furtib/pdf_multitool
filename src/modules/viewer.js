import { state, pdfJsDocs, pdfFiles, saveState } from './state.js';
import { togglePageSelection } from './selection.js';
import { setupDrawingEvents } from './drawing.js';

// Cache empty state HTML once on load, since it might be cleared from DOM
const emptyStateTemplate = document.getElementById("empty-state")?.outerHTML || "";

export function changeZoom(delta) {
  state.zoom = Math.max(0.5, Math.min(3.0, state.zoom + delta));
  const zoomLevel = document.getElementById("zoom-level");
  if (zoomLevel) zoomLevel.textContent = Math.round(state.zoom * 100) + "%";
  saveState();
  renderViewer(state.currentDocId);
}

export async function renderViewer(docId) {
  const container = document.getElementById("viewer-container");
  if (!container) return;
  
  container.innerHTML = "";

  if (!docId || !pdfJsDocs[docId]) {
    if (emptyStateTemplate) {
      container.innerHTML = emptyStateTemplate;
      const el = container.querySelector("#empty-state");
      if (el) el.style.display = "block";
    }
    return;
  }

  const pdfDoc = pdfJsDocs[docId];
  const docMeta = state.docs.find((d) => d.id === docId);

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const wrapper = document.createElement("div");
    wrapper.className = `page-wrapper ${state.tool === "draw" ? "draw-mode" : state.tool === "erase" ? "erase-mode" : state.tool === "text" ? "text-mode" : ""}`;
    wrapper.dataset.pageNum = i;

    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: state.zoom });

    wrapper.style.width = `${viewport.width}px`;
    wrapper.style.height = `${viewport.height}px`;

    const canvas = document.createElement("canvas");
    canvas.className = "pdf-canvas";
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");

    const textLayerDiv = document.createElement("div");
    textLayerDiv.className = "textLayer";
    textLayerDiv.style.width = `${viewport.width}px`;
    textLayerDiv.style.height = `${viewport.height}px`;
    textLayerDiv.style.position = "absolute";
    textLayerDiv.style.top = "0";
    textLayerDiv.style.left = "0";

    const drawCanvas = document.createElement("canvas");
    drawCanvas.className = "draw-canvas";
    drawCanvas.id = `draw-${docId}-${i}`;
    drawCanvas.width = viewport.width;
    drawCanvas.height = viewport.height;
    
    setupDrawingEvents(
      drawCanvas,
      docId,
      i,
      viewport.width / page.getViewport({ scale: 1 }).width
    );

    const meta = document.createElement("div");
    meta.className = "page-meta";
    meta.innerText = i;

    const controls = document.createElement("div");
    controls.className = "page-controls";

    const isAdded = state.selectedPages.some(
      (p) => p.docId === docId && p.pageNum === i,
    );
    const btn = document.createElement("button");
    btn.className = `add-btn ${isAdded ? "added" : ""}`;
    btn.innerHTML = isAdded ? "✓ Added" : "+ Add Page";
    btn.onclick = () => togglePageSelection(docId, i, docMeta.name, btn);

    controls.appendChild(btn);
    wrapper.appendChild(meta);
    wrapper.appendChild(canvas);
    wrapper.appendChild(textLayerDiv);
    wrapper.appendChild(drawCanvas);
    wrapper.appendChild(controls);
    container.appendChild(wrapper);

    page.render({ canvasContext: ctx, viewport }).promise.then(() => {
      page.getTextContent().then((textContent) => {
        pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport: viewport,
          textDivs: [],
        });
      });
      redrawCanvas(drawCanvas, docId, i);
    });
  }
}

export function redrawCanvas(canvas, docId, pageNum) {
  const key = `${docId}-${pageNum}`;
  const items = state.drawings[key];
  if (!items) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  items.forEach((item) => {
    if (item.type === "text") {
      const fontSize = item.size * h;
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = item.color || "#000000";
      ctx.textBaseline = "top";
      const lines = item.text.split("\n");
      lines.forEach((line, index) => {
        ctx.fillText(line, item.x * w, item.y * h + index * fontSize * 1.2);
      });
    } else {
      const points = item.points || (item.length ? item : null);
      if (!points || points.length < 1) return;
      ctx.strokeStyle = item.color || "#ef4444";
      ctx.beginPath();
      ctx.moveTo(points[0].x * w, points[0].y * h);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * w, points[i].y * h);
      }
      ctx.stroke();
    }
  });
}

export function renderTabs() {
  const track = document.getElementById("tabs-track");
  if (!track) return;
  
  track.innerHTML = "";
  state.docs.forEach((doc) => {
    const el = document.createElement("div");
    el.className = `doc-tab ${doc.id === state.currentDocId ? "active" : ""}`;
    el.innerHTML = `
            <span>${doc.name}</span>
            <div class="close-tab" id="close-${doc.id}">✕</div>
        `;
    
    el.onclick = () => {
      state.currentDocId = doc.id;
      state.scrollTop = 0;
      saveState();
      renderTabs();
      renderViewer(doc.id);
    };

    track.appendChild(el);
    
    // Setup close event separately to avoid closure issues in innerHTML
    const closeBtn = el.querySelector(`#close-${doc.id}`);
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeDoc(doc.id);
    };
  });
}

export function closeDoc(id) {
  state.docs = state.docs.filter((d) => d.id !== id);
  delete pdfFiles[id];
  delete pdfJsDocs[id];
  state.selectedPages = state.selectedPages.filter((p) => p.docId !== id);

  if (state.currentDocId === id) {
    state.currentDocId = state.docs.length ? state.docs[0].id : null;
  }
  saveState();
  renderTabs();
  import('./selection.js').then(m => m.renderBasket());
  renderViewer(state.currentDocId);
}

export function handleScroll() {
  if (state.currentDocId) {
    const container = document.getElementById("viewer-container");
    if (container) state.scrollTop = container.scrollTop;
  }
}
