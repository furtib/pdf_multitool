import { describe, it, expect, beforeEach } from 'vitest';
import { showHelp, hideHelp, showLoader, hideLoader } from '../../src/modules/utils.js';

describe('UI Utilities', () => {
  beforeEach(() => {
    globalThis.setupDOM();
  });

  it('should show help modal', () => {
    const modal = document.getElementById("help-modal");
    showHelp();
    expect(modal.style.display).toBe("flex");
  });

  it('should hide help modal', () => {
    const modal = document.getElementById("help-modal");
    modal.style.display = "flex";
    hideHelp();
    expect(modal.style.display).toBe("none");
  });

  it('should show loader with text', () => {
    const loader = document.getElementById("loader");
    const loaderText = document.getElementById("loader-text");
    showLoader("Test Loading...");
    expect(loader.style.display).toBe("flex");
    expect(loaderText.textContent).toBe("Test Loading...");
  });

  it('should hide loader', () => {
    const loader = document.getElementById("loader");
    loader.style.display = "flex";
    hideLoader();
    expect(loader.style.display).toBe("none");
  });
});
