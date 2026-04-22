import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state, resetAppState } from '../../src/modules/state.js';
import { distToSegment, eraseAt, setTool, setColor, setFontSize, clearCurrentPageDraw, setupDrawingEvents } from '../../src/modules/drawing.js';

describe('Drawing & Tools', () => {
  beforeEach(() => {
    globalThis.setupDOM();
    resetAppState();
    vi.clearAllMocks();
  });

  describe('Math Utilities (distToSegment)', () => {
    it('should calculate 0 distance when point is on a horizontal segment', () => {
      const p = { x: 5, y: 10 };
      const v = { x: 0, y: 10 };
      const w = { x: 10, y: 10 };
      expect(distToSegment(p, v, w)).toBe(0);
    });

    it('should calculate distance to a horizontal segment above', () => {
      const p = { x: 5, y: 15 };
      const v = { x: 0, y: 10 };
      const w = { x: 10, y: 10 };
      expect(distToSegment(p, v, w)).toBe(5);
    });

    it('should calculate distance to nearest endpoint when beyond segment', () => {
      const p = { x: 15, y: 10 };
      const v = { x: 0, y: 10 };
      const w = { x: 10, y: 10 };
      expect(distToSegment(p, v, w)).toBe(5);
    });
  });

  describe('Tool State', () => {
    it('should set tool and update UI', () => {
      setTool('draw');
      expect(state.tool).toBe('draw');
      expect(document.getElementById('draw-toggle').classList.contains('active')).toBe(true);
      
      setTool('draw'); // Toggle off
      expect(state.tool).toBe(null);
      expect(document.getElementById('draw-toggle').classList.contains('active')).toBe(false);
    });

    it('should set color and update preview', () => {
      setColor('#00ff00');
      expect(state.color).toBe('#00ff00');
      expect(document.getElementById('color-preview').style.backgroundColor).toBe('rgb(0, 255, 0)');
    });

    it('should set font size', () => {
      setFontSize(24);
      expect(state.fontSize).toBe(24);
    });

    it('should clear all drawings on current document', () => {
      state.currentDocId = 'doc1';
      state.drawings['doc1-1'] = [{}];
      state.drawings['doc1-2'] = [{}];
      state.drawings['doc2-1'] = [{}];
      
      clearCurrentPageDraw();
      
      expect(state.drawings['doc1-1']).toBeUndefined();
      expect(state.drawings['doc1-2']).toBeUndefined();
      expect(state.drawings['doc2-1']).toBeDefined();
    });
  });

  describe('Eraser Logic', () => {
    it('should remove a path when erasing near it', () => {
      const key = 'doc1-1';
      const w = 100, h = 100;
      state.drawings[key] = [{ points: [{x: 0, y: 0.1}, {x: 1, y: 0.1}], color: '#ff0000' }];
      
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      
      eraseAt(50, 10, w, h, key, canvas, 'doc1', 1);
      expect(state.drawings[key].length).toBe(0);
    });

    it('should remove text when erasing near it', () => {
      const key = 'doc1-1';
      const w = 100, h = 100;
      state.drawings[key] = [{ type: 'text', x: 0.5, y: 0.5, text: 'Hello', size: 0.1, color: '#000' }];
      
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      
      eraseAt(55, 55, w, h, key, canvas, 'doc1', 1);
      expect(state.drawings[key].length).toBe(0);
    });

    it('should remove only the targeted item when multiple exist', () => {
      const key = 'doc1-1';
      const w = 100, h = 100;
      state.drawings[key] = [
        { points: [{x: 0, y: 0.1}, {x: 1, y: 0.1}], color: '#ff0000' },
        { points: [{x: 0, y: 0.9}, {x: 1, y: 0.9}], color: '#0000ff' }
      ];
      
      const canvas = document.createElement('canvas');
      eraseAt(50, 10, w, h, key, canvas, 'doc1', 1);
      
      expect(state.drawings[key].length).toBe(1);
      expect(state.drawings[key][0].color).toBe('#0000ff');
    });
  });

  describe('Event Setup', () => {
    it('should setup drawing events on canvas', () => {
      const canvas = document.createElement('canvas');
      setupDrawingEvents(canvas, 'doc1', 1, 1.0);
      
      expect(canvas.onmousedown).toBeDefined();
      expect(canvas.ontouchstart).toBeDefined();
    });
  });
});
