import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupFileHandling, resetApp } from '../../src/modules/file-handler.js';

describe('File Handling', () => {
  beforeEach(() => {
    globalThis.setupDOM();
    // Mock window.location.reload
    globalThis.location = { ...window.location, reload: vi.fn() };
  });

  it('should setup file input listener', () => {
    const fileInput = document.getElementById("file-input");
    setupFileHandling();
    expect(fileInput.onchange).toBeDefined();
  });

  it('should clear storage and reload on resetApp', async () => {
    await resetApp();
    expect(globalThis.localforage.clear).toHaveBeenCalled();
    expect(globalThis.location.reload).toHaveBeenCalled();
  });
});
