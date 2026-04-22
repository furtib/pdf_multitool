import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies that script.js expects in the global scope
globalThis.pdfjsLib = {
  GlobalWorkerOptions: {},
  getDocument: vi.fn(),
  renderTextLayer: vi.fn(),
};
globalThis.PDFLib = {
  PDFDocument: {
    create: vi.fn(),
    load: vi.fn(),
  },
};
globalThis.Sortable = {
  create: vi.fn(),
};
globalThis.localforage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
globalThis.alert = vi.fn();
globalThis.confirm = vi.fn(() => true);

// Mock Canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  closePath: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 50 })),
  scale: vi.fn(),
}));

// Setup a basic DOM structure
const setupDOM = () => {
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

setupDOM();

// Load script.js
const script = require('../../script.js');

describe('PDF Multitool Unit Tests', () => {
  beforeEach(() => {
    setupDOM();
    script.resetAppState();
    vi.clearAllMocks();
    
    // Some functions in script.js call other DOM-updating functions.
    // We can spy and mock them if needed to isolate logic.
    vi.spyOn(script, 'redrawCanvas').mockImplementation(() => {});
  });

  describe('Math Utilities (distToSegment)', () => {
    it('should calculate 0 distance when point is on a horizontal segment', () => {
      const p = { x: 5, y: 10 };
      const v = { x: 0, y: 10 };
      const w = { x: 10, y: 10 };
      expect(script.distToSegment(p, v, w)).toBe(0);
    });

    it('should calculate distance to a horizontal segment above', () => {
      const p = { x: 5, y: 15 };
      const v = { x: 0, y: 10 };
      const w = { x: 10, y: 10 };
      expect(script.distToSegment(p, v, w)).toBe(5);
    });
  });

  describe('Undo/Redo System', () => {
    it('should record history and update stacks', () => {
      const key = 'doc1-page1';
      const before = [];
      const after = [{ type: 'draw', points: [] }];
      
      script.recordHistory(key, before, after);
      
      expect(script.undoStack.length).toBe(1);
      expect(script.redoStack.length).toBe(0);
      expect(script.undoStack[0]).toEqual({ key, before, after });
    });

    it('should clear redoStack when new history is recorded', () => {
      script.redoStack.push({ key: 'old', before: [], after: [] });
      script.recordHistory('new', [], []);
      expect(script.redoStack.length).toBe(0);
    });

    it('should undo an action', () => {
      const key = 'doc1-page1';
      const before = [{ type: 'path', points: [{x:0, y:0}] }];
      const after = [{ type: 'path', points: [{x:0, y:0}, {x:1, y:1}] }];
      
      script.state.drawings[key] = after; // Initially has the 'after' state
      script.undoStack.push({ key, before, after });
      
      script.undo();
      
      expect(script.state.drawings[key]).toEqual(before);
      expect(script.undoStack.length).toBe(0);
      expect(script.redoStack.length).toBe(1);
    });

    it('should redo an undone action', () => {
      const key = 'doc1-page1';
      const before = [];
      const after = [{ type: 'path', points: [{x:0, y:0}] }];
      
      script.state.drawings[key] = before;
      script.redoStack.push({ key, before, after });
      
      script.redo();
      
      expect(script.state.drawings[key]).toEqual(after);
      expect(script.undoStack.length).toBe(1);
      expect(script.redoStack.length).toBe(0);
    });
  });

  describe('Selection Logic', () => {
    it('should add a page to selection', () => {
      const docId = 'doc1';
      const pageNum = 1;
      const docName = 'test.pdf';
      const btn = document.createElement('button');
      
      script.togglePageSelection(docId, pageNum, docName, btn);
      
      expect(script.state.selectedPages.length).toBe(1);
      expect(script.state.selectedPages[0].docId).toBe(docId);
    });

    it('should remove a page by index', () => {
      script.state.selectedPages.push({ id: 1, docId: 'doc1', pageNum: 1, name: 'p1' });
      script.state.selectedPages.push({ id: 2, docId: 'doc1', pageNum: 2, name: 'p2' });
      
      script.removePage(0);
      
      expect(script.state.selectedPages.length).toBe(1);
      expect(script.state.selectedPages[0].pageNum).toBe(2);
    });
  });

  describe('Tool & Config State', () => {
    it('should set tool correctly', () => {
      script.setTool('draw');
      expect(script.state.tool).toBe('draw');
      expect(document.getElementById('draw-toggle').classList.contains('active')).toBe(true);
      
      script.setTool('draw');
      expect(script.state.tool).toBe(null);
    });

    it('should set color correctly', () => {
      const color = '#00ff00';
      script.setColor(color);
      expect(script.state.color).toBe(color);
      // JSDOM might return hex or rgb
      const bg = document.getElementById('color-preview').style.backgroundColor;
      expect(bg === 'rgb(0, 255, 0)' || bg === '#00ff00').toBe(true);
    });
  });

  describe('Eraser Logic', () => {
    it('should remove a path when erasing near it', () => {
      const key = 'doc1-1';
      const w = 100, h = 100;
      script.state.drawings[key] = [
        { points: [{x: 0, y: 0.1}, {x: 1, y: 0.1}], color: '#ff0000' }
      ];
      
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      
      const docId = 'doc1', pageNum = 1;
      script.eraseAt(50, 10, w, h, key, canvas, docId, pageNum);
      
      expect(script.state.drawings[key].length).toBe(0);
    });

    it('should remove text when erasing near it', () => {
      const key = 'doc1-1';
      const w = 100, h = 100;
      script.state.drawings[key] = [
        { type: 'text', x: 0.5, y: 0.5, text: 'Hello', size: 0.1, color: '#000' }
      ];
      
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      
      const docId = 'doc1', pageNum = 1;
      script.eraseAt(55, 55, w, h, key, canvas, docId, pageNum);
      
      expect(script.state.drawings[key].length).toBe(0);
    });

    it('should remove only the targeted item when multiple exist', () => {
      const key = 'doc1-1';
      const w = 100, h = 100;
      script.state.drawings[key] = [
        { points: [{x: 0, y: 0.1}, {x: 1, y: 0.1}], color: '#ff0000' }, // item 0
        { points: [{x: 0, y: 0.9}, {x: 1, y: 0.9}], color: '#0000ff' }  // item 1
      ];
      
      const canvas = document.createElement('canvas');
      const docId = 'doc1', pageNum = 1;
      // Erase near item 0
      script.eraseAt(50, 10, w, h, key, canvas, docId, pageNum);
      
      expect(script.state.drawings[key].length).toBe(1);
      expect(script.state.drawings[key][0].color).toBe('#0000ff');
    });
  });
});
