import { describe, it, expect, beforeEach } from 'vitest';
import { state, resetAppState } from '../../src/modules/state.js';
import { toggleSidebar } from '../../src/modules/ui.js';

describe('UI Layout', () => {
  beforeEach(() => {
    globalThis.setupDOM();
    resetAppState();
  });

  it('should toggle sidebar state and visibility', () => {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("sidebar-toggle-btn");
    
    // Initially open
    expect(state.isSidebarOpen).toBe(true);
    
    toggleSidebar();
    expect(state.isSidebarOpen).toBe(false);
    expect(sidebar.style.display).toBe("none");
    expect(toggleBtn.style.display).toBe("block");
    
    toggleSidebar();
    expect(state.isSidebarOpen).toBe(true);
    expect(sidebar.style.display).toBe("flex");
  });

  it('should force sidebar state', () => {
    toggleSidebar(false);
    expect(state.isSidebarOpen).toBe(false);
    
    toggleSidebar(true);
    expect(state.isSidebarOpen).toBe(true);
  });
});
