import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state, resetAppState } from '../../src/modules/state.js';
import { undoStack, redoStack, recordHistory, undo, redo, resetHistory, setRedrawFunction, updateUndoRedoButtons } from '../../src/modules/undo.js';

describe('Undo/Redo System', () => {
  beforeEach(() => {
    globalThis.setupDOM();
    resetAppState();
    resetHistory();
    setRedrawFunction(vi.fn());
  });

  it('should record history and update stacks', () => {
    recordHistory('test-key', [], [{ id: 1 }]);
    expect(undoStack.length).toBe(1);
    expect(redoStack.length).toBe(0);
  });

  it('should update undo/redo buttons state', () => {
    const btnUndo = document.getElementById("btn-undo");
    const btnRedo = document.getElementById("btn-redo");
    
    // Empty stacks
    updateUndoRedoButtons();
    expect(btnUndo.disabled).toBe(true);
    expect(btnRedo.disabled).toBe(true);
    
    // Item in undo
    undoStack.push({ key: 'a', before: [], after: [] });
    updateUndoRedoButtons();
    expect(btnUndo.disabled).toBe(false);
    expect(btnRedo.disabled).toBe(true);
  });

  it('should clear redoStack when new history is recorded', () => {
    redoStack.push({ key: 'old', before: [], after: [] });
    recordHistory('new', [], []);
    expect(redoStack.length).toBe(0);
  });

  it('should undo an action', () => {
    const key = 'doc1-1';
    const before = [{ id: 'prev' }];
    const after = [{ id: 'curr' }];
    state.drawings[key] = after;
    undoStack.push({ key, before, after });
    
    undo();
    expect(state.drawings[key]).toEqual(before);
    expect(undoStack.length).toBe(0);
    expect(redoStack.length).toBe(1);
  });

  it('should redo an action', () => {
    const key = 'doc1-1';
    const before = [];
    const after = [{ id: 'curr' }];
    state.drawings[key] = before;
    redoStack.push({ key, before, after });
    
    redo();
    expect(state.drawings[key]).toEqual(after);
    expect(undoStack.length).toBe(1);
    expect(redoStack.length).toBe(0);
  });

  it('should reset history stacks', () => {
    undoStack.push({});
    redoStack.push({});
    resetHistory();
    expect(undoStack.length).toBe(0);
    expect(redoStack.length).toBe(0);
  });

  it('should set redraw function', () => {
    const spy = vi.fn();
    setRedrawFunction(spy);
    // undo() calls redrawFn if canvas exists
    const key = 'doc1-1';
    state.drawings[key] = [];
    undoStack.push({ key, before: [], after: [] });
    document.body.innerHTML += `<canvas id="draw-doc1-1"></canvas>`;
    
    undo();
    expect(spy).toHaveBeenCalled();
  });
});
