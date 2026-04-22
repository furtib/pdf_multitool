import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state, resetAppState } from '../../src/modules/state.js';
import { changeZoom, redrawCanvas, renderTabs, closeDoc, handleScroll, renderViewer } from '../../src/modules/viewer.js';
import { pdfJsDocs } from '../../src/modules/state.js';

describe('Viewer Logic', () => {
  beforeEach(() => {
    globalThis.setupDOM();
    resetAppState();
    vi.clearAllMocks();
  });

  it('should change zoom level within limits', () => {
    state.zoom = 1.0;
    changeZoom(0.2);
    expect(state.zoom).toBe(1.2);
    expect(document.getElementById("zoom-level").textContent).toBe("120%");
    
    changeZoom(5.0); // Should clamp to max 3.0
    expect(state.zoom).toBe(3.0);
    
    changeZoom(-10.0); // Should clamp to min 0.5
    expect(state.zoom).toBe(0.5);
  });

  it('should redraw canvas with text and paths', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100; canvas.height = 100;
    
    state.drawings['doc1-1'] = [
      { type: 'text', x: 0.1, y: 0.1, text: 'Hi', size: 0.1, color: '#000' },
      { points: [{x:0, y:0}, {x:1, y:1}], color: '#f00' }
    ];
    
    redrawCanvas(canvas, 'doc1', 1);
    
    expect(globalThis.mockCtx.fillText).toHaveBeenCalled();
    expect(globalThis.mockCtx.stroke).toHaveBeenCalled();
  });

  it('should render tabs for documents', () => {
    state.docs = [
      { id: 'doc1', name: 'File 1' },
      { id: 'doc2', name: 'File 2' }
    ];
    state.currentDocId = 'doc1';
    
    renderTabs();
    
    const tabs = document.querySelectorAll('.doc-tab');
    expect(tabs.length).toBe(2);
    expect(tabs[0].classList.contains('active')).toBe(true);
    expect(tabs[0].textContent).toContain('File 1');
  });

  it('should close a document and update state', () => {
    state.docs = [{ id: 'doc1', name: 'File 1' }];
    state.currentDocId = 'doc1';
    
    closeDoc('doc1');
    
    expect(state.docs.length).toBe(0);
    expect(state.currentDocId).toBeNull();
  });

  it('should update scrollTop on scroll', () => {
    const container = document.getElementById("viewer-container");
    container.scrollTop = 500;
    state.currentDocId = 'doc1';
    
    handleScroll();
    expect(state.scrollTop).toBe(500);
  });

  it('should render blank pages in renderViewer', async () => {
    const docId = 'doc1';
    state.docs = [{ id: docId, name: 'Test', pageCount: 1, blankPageCount: 1 }];
    
    const mockPage = {
      getViewport: vi.fn(() => ({ width: 100, height: 100 })),
      render: vi.fn(() => ({ promise: Promise.resolve() })),
      getTextContent: vi.fn(() => Promise.resolve({ items: [] })),
    };
    pdfJsDocs[docId] = {
      numPages: 1,
      getPage: vi.fn(() => Promise.resolve(mockPage)),
    };
    
    await renderViewer(docId);
    
    const wrappers = document.querySelectorAll('.page-wrapper');
    expect(wrappers.length).toBe(2); // 1 native + 1 blank
    expect(wrappers[1].dataset.pageNum).toBe('2');
  });
});
