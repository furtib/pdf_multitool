import { state, saveState } from './state.js';
import { recordHistory } from './undo.js';
import { redrawCanvas, renderViewer } from './viewer.js';

let isDrawing = false;
let currentPath = [];

export function setColor(c) {
  state.color = c;
  const preview = document.getElementById("color-preview");
  if (preview) preview.style.backgroundColor = c;
  saveState();
}

export function setFontSize(size) {
  state.fontSize = parseInt(size);
  saveState();
}

export function setTool(toolName) {
  if (state.tool === toolName) state.tool = null;
  else state.tool = toolName;

  const tools = {
    'draw': 'draw-toggle',
    'erase': 'erase-toggle',
    'text': 'text-toggle'
  };

  Object.entries(tools).forEach(([name, id]) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("active", state.tool === name);
  });

  const fontSizeGroup = document.getElementById("font-size-group");
  if (fontSizeGroup) {
    fontSizeGroup.style.display = state.tool === "text" ? "flex" : "none";
  }

  const wrappers = document.querySelectorAll(".page-wrapper");
  wrappers.forEach((w) => {
    w.classList.remove("draw-mode", "erase-mode", "text-mode");
    if (state.tool) w.classList.add(`${state.tool}-mode`);
  });
  saveState();
}

export function setupDrawingEvents(canvas, docId, pageNum, scaleFactor) {
  const key = `${docId}-${pageNum}`;
  const ctx = canvas.getContext("2d");
  let beforeEraseState = null;

  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const addTextAt = (x, y) => {
    const wrapper = canvas.parentElement;
    const input = document.createElement("textarea");
    const scaledSize = (state.fontSize || 16) * state.zoom;

    input.style.position = "absolute";
    input.style.left = x + "px";
    input.style.top = y + "px";
    input.style.zIndex = "100";
    input.style.background = "transparent";
    input.style.border = "1px solid #3b82f6";
    input.style.color = state.color || "#000000";
    input.style.fontSize = scaledSize + "px";
    input.style.fontFamily = "Arial, sans-serif";
    input.style.minWidth = "150px";
    input.style.minHeight = "40px";
    input.style.padding = "4px";

    wrapper.appendChild(input);
    input.focus();

    const save = () => {
      const text = input.value.trim();
      if (text) {
        const before = JSON.parse(JSON.stringify(state.drawings[key] || []));
        if (!state.drawings[key]) state.drawings[key] = [];
        state.drawings[key].push({
          type: "text",
          x: x / canvas.width,
          y: y / canvas.height,
          text: text,
          size: scaledSize / canvas.height,
          color: state.color || "#000000",
        });
        saveState();

        const after = JSON.parse(JSON.stringify(state.drawings[key]));
        recordHistory(key, before, after);

        redrawCanvas(canvas, docId, pageNum);
      }
      if (input.parentNode) input.parentNode.removeChild(input);
    };

    input.onblur = save;
    input.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        input.blur();
      }
      if (e.key === "Escape") {
        if (input.parentNode) input.parentNode.removeChild(input);
      }
    };
  };

  const start = (e) => {
    if (!state.tool) return;
    if (e.type === "mousedown" && e.button !== 0) return;
    e.preventDefault();

    isDrawing = true;
    const pos = getPos(e);

    if (state.tool === "draw") {
      currentPath = [{ x: pos.x, y: pos.y }];
      ctx.strokeStyle = state.color || "#ef4444";
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else if (state.tool === "erase") {
      beforeEraseState = JSON.parse(JSON.stringify(state.drawings[key] || []));
      eraseAt(pos.x, pos.y, canvas.width, canvas.height, key, canvas, docId, pageNum);
    } else if (state.tool === "text") {
      addTextAt(pos.x, pos.y);
      isDrawing = false;
    }
  };

  const move = (e) => {
    if (!isDrawing || !state.tool) return;
    e.preventDefault();
    const pos = getPos(e);

    if (state.tool === "draw") {
      currentPath.push({ x: pos.x, y: pos.y });
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (state.tool === "erase") {
      eraseAt(pos.x, pos.y, canvas.width, canvas.height, key, canvas, docId, pageNum);
    }
  };

  const end = (e) => {
    if (!isDrawing) return;
    isDrawing = false;

    if (state.tool === "draw") {
      ctx.closePath();
      if (currentPath.length > 0) {
        const before = JSON.parse(JSON.stringify(state.drawings[key] || []));
        if (!state.drawings[key]) state.drawings[key] = [];

        const w = canvas.width;
        const h = canvas.height;
        const normalizedPath = currentPath.map((p) => ({
          x: p.x / w,
          y: p.y / h,
        }));

        state.drawings[key].push({
          points: normalizedPath,
          color: state.color || "#ef4444",
        });
        saveState();

        const after = JSON.parse(JSON.stringify(state.drawings[key]));
        recordHistory(key, before, after);
      }
      currentPath = [];
    } else if (state.tool === "erase") {
      if (beforeEraseState) {
        const after = JSON.parse(JSON.stringify(state.drawings[key] || []));
        if (JSON.stringify(beforeEraseState) !== JSON.stringify(after)) {
          recordHistory(key, beforeEraseState, after);
        }
        beforeEraseState = null;
      }
    }
  };

  canvas.onmousedown = start;
  canvas.onmousemove = move;
  canvas.onmouseup = end;
  canvas.onmouseout = end;
  canvas.ontouchstart = start;
  canvas.ontouchmove = move;
  canvas.ontouchend = end;
}

export const eraseAt = (x, y, w, h, key, canvas, docId, pageNum) => {
  const items = state.drawings[key];
  if (!items) return;

  const threshold = 10;
  const ctx = canvas.getContext("2d");

  const initialLen = items.length;
  state.drawings[key] = items.filter((item) => {
    if (item.type === "text") {
      const tx = item.x * w;
      const ty = item.y * h;
      const fontSize = item.size * h;
      ctx.font = `${fontSize}px Arial`;
      const textWidth = ctx.measureText(item.text.split("\n")[0]).width;

      return !(
        x >= tx - 10 &&
        x <= tx + textWidth + 10 &&
        y >= ty - 10 &&
        y <= ty + fontSize * item.text.split("\n").length + 10
      );
    } else {
      return !item.points.some((p, idx, arr) => {
        if (idx === 0) return false;
        const p1 = { x: arr[idx - 1].x * w, y: arr[idx - 1].y * h };
        const p2 = { x: p.x * w, y: p.y * h };
        return distToSegment({ x, y }, p1, p2) < threshold;
      });
    }
  });

  if (state.drawings[key].length !== initialLen) {
    ctx.clearRect(0, 0, w, h);
    redrawCanvas(canvas, docId, pageNum);
    saveState();
  }
};

export function distToSegment(p, v, w) {
  const sqr = (x) => x * x;
  const dist2 = (v, w) => sqr(v.x - w.x) + sqr(v.y - w.y);
  const l2 = dist2(v, w);
  if (l2 == 0) return Math.sqrt(dist2(p, v));
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt(
    dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) })
  );
}

export function clearCurrentPageDraw() {
  if (!state.currentDocId) return;
  if (confirm("Clear drawings on ALL pages of this document?")) {
    Object.keys(state.drawings).forEach((k) => {
      if (k.startsWith(state.currentDocId)) delete state.drawings[k];
    });
    saveState();
    renderViewer(state.currentDocId);
  }
}
