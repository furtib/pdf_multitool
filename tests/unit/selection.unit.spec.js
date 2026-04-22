import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state, resetAppState } from '../../src/modules/state.js';
import { togglePageSelection, removePage, renderBasket } from '../../src/modules/selection.js';

describe('Selection Logic', () => {
  beforeEach(() => {
    globalThis.setupDOM();
    resetAppState();
  });

  it('should add a page to selection', () => {
    const btn = document.createElement('button');
    togglePageSelection('doc1', 1, 'test.pdf', btn);
    expect(state.selectedPages.length).toBe(1);
    expect(state.selectedPages[0].docId).toBe('doc1');
    expect(btn.classList.contains('added')).toBe(true);
  });

  it('should remove a page by index', () => {
    state.selectedPages = [
      { id: 1, docId: 'doc1', pageNum: 1, name: 'p1' },
      { id: 2, docId: 'doc1', pageNum: 2, name: 'p2' }
    ];
    removePage(0);
    expect(state.selectedPages.length).toBe(1);
    expect(state.selectedPages[0].pageNum).toBe(2);
  });

  it('should render basket items for selected pages', () => {
    state.selectedPages = [
      { id: 1, docId: 'doc1', pageNum: 1, name: 'File 1' }
    ];
    
    renderBasket();
    
    const items = document.querySelectorAll('.basket-item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Page 1');
    expect(items[0].textContent).toContain('File 1');
  });
});
