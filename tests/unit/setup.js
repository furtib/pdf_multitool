import { vi } from 'vitest';

// Consistent Canvas Mock
const mockCtx = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  closePath: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 50 })),
  scale: vi.fn(),
};

// Mock dependencies
globalThis.pdfjsLib = {
  GlobalWorkerOptions: {},
  getDocument: vi.fn(),
  renderTextLayer: vi.fn(),
};
globalThis.PDFLib = {
  PDFDocument: {
    create: vi.fn(() => ({
      copyPages: vi.fn(() => ([])),
      addPage: vi.fn(() => ({
        getSize: vi.fn(() => ({ width: 100, height: 100 })),
        drawImage: vi.fn(),
      })),
      save: vi.fn(() => new Uint8Array()),
      embedPng: vi.fn(),
    })),
    load: vi.fn(),
  },
};
globalThis.localforage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
globalThis.alert = vi.fn();
globalThis.confirm = vi.fn(() => true);
globalThis.Sortable = { create: vi.fn() };

// Mock Blob
globalThis.Blob = vi.fn();
if (globalThis.URL) {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:url');
} else {
  globalThis.URL = {
    createObjectURL: vi.fn(() => 'blob:url'),
  };
}

// Mock Canvas
HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
  if (type === '2d') return mockCtx;
  return null;
});

// Mock slice for ArrayBuffer (used in script.js)
if (!ArrayBuffer.prototype.slice) {
  ArrayBuffer.prototype.slice = function(start, end) {
    return new Uint8Array(this).subarray(start, end).buffer;
  };
}

export const setupDOM = () => {
  document.body.innerHTML = `
    <input type="file" id="file-input" />
    <div id="tabs-track"></div>
    <div id="basket-list"></div>
    <div id="viewer-container"></div>
    <div id="resizer"></div>
    <div id="sidebar"></div>
    <div id="sidebar-toggle-btn"></div>
    <div id="help-modal"></div>
    <div id="zoom-level"></div>
    <button id="btn-undo"></button>
    <button id="btn-redo"></button>
    <button id="draw-toggle"></button>
    <button id="text-toggle"></button>
    <button id="erase-toggle"></button>
    <div id="color-preview"></div>
    <input type="color" id="color-picker" />
    <input type="number" id="font-size" />
    <div id="font-size-group"></div>
    <span id="status-text"></span>
    <span id="queue-count"></span>
    <button id="download-btn"></button>
    <div id="loader"></div>
    <div id="loader-text"></div>
    <div id="empty-state"></div>
    <div id="hover-preview"></div>
  `;
};

globalThis.setupDOM = setupDOM;
globalThis.mockCtx = mockCtx;
