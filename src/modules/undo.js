import { state, saveState } from './state.js';

export let undoStack = [];
export let redoStack = [];

export function resetHistory() {
  undoStack.length = 0;
  redoStack.length = 0;
}

export function recordHistory(key, before, after) {
  undoStack.push({ key, before, after });
  redoStack.length = 0; // Clear redo on new action
  updateUndoRedoButtons();
}

export function updateUndoRedoButtons() {
  const btnUndo = document.getElementById("btn-undo");
  const btnRedo = document.getElementById("btn-redo");
  if (!btnUndo || !btnRedo) return;

  btnUndo.disabled = undoStack.length === 0;
  btnUndo.style.opacity = undoStack.length === 0 ? "0.5" : "1";

  btnRedo.disabled = redoStack.length === 0;
  btnRedo.style.opacity = redoStack.length === 0 ? "0.5" : "1";
}

// Circular dependency with redrawCanvas will be handled by main/viewer imports later
// For now we need to be careful with the undo/redo logic needing redraw
let redrawFn = null;
export function setRedrawFunction(fn) {
  redrawFn = fn;
}

export function undo() {
  if (undoStack.length === 0) return;
  const action = undoStack.pop();
  redoStack.push(action);

  state.drawings[action.key] = JSON.parse(JSON.stringify(action.before));
  saveState();

  const lastDash = action.key.lastIndexOf("-");
  const docId = action.key.substring(0, lastDash);
  const pageNum = parseInt(action.key.substring(lastDash + 1));

  const canvas = document.getElementById(`draw-${docId}-${pageNum}`);
  if (canvas && redrawFn) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawFn(canvas, docId, pageNum);
  }
  updateUndoRedoButtons();
}

export function redo() {
  if (redoStack.length === 0) return;
  const action = redoStack.pop();
  undoStack.push(action);

  state.drawings[action.key] = JSON.parse(JSON.stringify(action.after));
  saveState();

  const lastDash = action.key.lastIndexOf("-");
  const docId = action.key.substring(0, lastDash);
  const pageNum = parseInt(action.key.substring(lastDash + 1));

  const canvas = document.getElementById(`draw-${docId}-${pageNum}`);
  if (canvas && redrawFn) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawFn(canvas, docId, pageNum);
  }
  updateUndoRedoButtons();
}
