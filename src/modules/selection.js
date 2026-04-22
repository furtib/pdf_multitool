import { state, pdfJsDocs, saveState } from './state.js';
import { redrawCanvas, renderViewer } from './viewer.js';

export function togglePageSelection(docId, pageNum, docName, btnElement) {
  const existingIdx = state.selectedPages.findIndex(
    (p) => p.docId === docId && p.pageNum === pageNum,
  );

  if (existingIdx > -1) {
    state.selectedPages.splice(existingIdx, 1);
    btnElement.classList.remove("added");
    btnElement.innerText = "+ Add Page";
  } else {
    state.selectedPages.push({
      id: Date.now() + Math.random(),
      docId,
      pageNum,
      name: docName,
    });
    btnElement.classList.add("added");
    btnElement.innerText = "✓ Added";
  }
  saveState();
  renderBasket();
}

export function renderBasket() {
  const list = document.getElementById("basket-list");
  if (!list) return;
  
  list.innerHTML = "";
  const queueCount = document.getElementById("queue-count");
  if (queueCount) queueCount.innerText = `${state.selectedPages.length} Pages`;
  
  const downloadBtn = document.getElementById("download-btn");
  if (downloadBtn) downloadBtn.disabled = state.selectedPages.length === 0;

  state.selectedPages.forEach((item, index) => {
    const el = document.createElement("div");
    el.className = "basket-item";

    el.onmouseenter = (e) => showHoverPreview(e, item);
    el.onmouseleave = hideHoverPreview;

    el.innerHTML = `
            <div class="basket-thumb"></div>
            <div class="basket-info">
                <div class="page-num">Page ${item.pageNum}</div>
                <div class="doc-name">${item.name}</div>
            </div>
            <button class="remove-btn" id="remove-${index}">✕</button>
        `;
    list.appendChild(el);
    
    const removeBtn = el.querySelector(`#remove-${index}`);
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removePage(index);
    };
  });
}

export function removePage(index) {
  const item = state.selectedPages[index];
  state.selectedPages.splice(index, 1);
  saveState();
  renderBasket();
  if (state.currentDocId === item.docId) {
    renderViewer(state.currentDocId);
  }
}

async function showHoverPreview(e, item) {
  const preview = document.getElementById("hover-preview");
  if (!preview) return;
  
  preview.style.display = "block";
  positionPreview(e, preview);
  preview.innerHTML = '<div style="padding:10px; font-size:12px;">Loading...</div>';

  if (pdfJsDocs[item.docId]) {
    const page = await pdfJsDocs[item.docId].getPage(item.pageNum);
    const scale = 0.6;
    const viewport = page.getViewport({ scale: scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

    redrawCanvas(canvas, item.docId, item.pageNum);

    preview.innerHTML = "";
    preview.appendChild(canvas);
    positionPreview(e, preview, viewport.width, viewport.height);
  }
}

function positionPreview(e, preview, width = 200, height = 300) {
  const x = e.clientX;
  const y = e.clientY;
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const gap = 20;

  if (x > winW / 2) {
    preview.style.left = "auto";
    preview.style.right = winW - x + gap + "px";
  } else {
    preview.style.right = "auto";
    preview.style.left = x + gap + "px";
  }

  let top = y - 50;
  if (top + height > winH) {
    top = winH - height - gap;
    if (top < gap) top = gap;
  }

  preview.style.top = top + "px";
  preview.style.bottom = "auto";
}

function hideHoverPreview() {
  const preview = document.getElementById("hover-preview");
  if (preview) preview.style.display = "none";
}
