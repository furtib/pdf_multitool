import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportPDF } from '../../src/modules/export.js';

describe('Export Logic', () => {
  beforeEach(() => {
    globalThis.setupDOM();
  });

  it('should attempt to create a merged PDF', async () => {
    await exportPDF();
    expect(globalThis.PDFLib.PDFDocument.create).toHaveBeenCalled();
  });
});
