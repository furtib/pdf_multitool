import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state, resetAppState, saveState, addBlankPage } from '../../src/modules/state.js';

describe('State Management', () => {
  beforeEach(() => {
    globalThis.setupDOM();
    resetAppState();
  });

  it('should reset zoom level to 1.0', () => {
    state.zoom = 2.5;
    resetAppState();
    expect(state.zoom).toBe(1.0);
  });

  it('should clear docs and selectedPages arrays', () => {
    state.docs.push({ id: 'test' });
    state.selectedPages.push({ id: 1 });
    resetAppState();
    expect(state.docs.length).toBe(0);
    expect(state.selectedPages.length).toBe(0);
  });

  it('should call localforage on saveState and update status text', async () => {
    const statusText = document.getElementById("status-text");
    await saveState();
    
    expect(globalThis.localforage.setItem).toHaveBeenCalledWith(expect.any(String), state);
    expect(statusText.innerText).toBe("Saved");
  });

  it('should increment blankPageCount on addBlankPage', async () => {
    state.docs.push({ id: 'doc1', blankPageCount: 0 });
    await addBlankPage('doc1');
    expect(state.docs[0].blankPageCount).toBe(1);
  });
});
