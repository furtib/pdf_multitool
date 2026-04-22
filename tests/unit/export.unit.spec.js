import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportPDF } from '../../src/modules/export.js';
import { state, pdfFiles } from '../../src/modules/state.js';

describe('Export Logic', () => {
  beforeEach(() => {
    globalThis.setupDOM();
    state.selectedPages = [];
    state.docs = [];
    for (let key in pdfFiles) delete pdfFiles[key];
  });

  it('should attempt to create a merged PDF', async () => {
    await exportPDF();
    expect(globalThis.PDFLib.PDFDocument.create).toHaveBeenCalled();
  });

  it('should handle blank pages during export', async () => {
    const docId = 'doc1';
    state.docs = [{ id: docId, pageCount: 1, blankPageCount: 1 }];
    state.selectedPages = [
      { id: 1, docId: docId, pageNum: 1, name: 'T' },
      { id: 2, docId: docId, pageNum: 2, name: 'T' } // Blank page
    ];
    pdfFiles[docId] = new ArrayBuffer(8);
    
    await exportPDF();
    
    // Check if addPage was called twice
    const createMock = globalThis.PDFLib.PDFDocument.create;
    const docInstance = await createMock.mock.results[createMock.mock.results.length - 1].value;
    expect(docInstance.addPage).toHaveBeenCalledTimes(2);
  });
});
