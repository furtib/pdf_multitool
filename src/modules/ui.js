import { state, saveState } from './state.js';

export function toggleSidebar(forceState) {
  const sidebar = document.getElementById("sidebar");
  const resizer = document.getElementById("resizer");
  const toggleBtn = document.getElementById("sidebar-toggle-btn");
  if (!sidebar || !resizer || !toggleBtn) return;

  const newState = forceState !== undefined ? forceState : !state.isSidebarOpen;
  state.isSidebarOpen = newState;

  if (newState) {
    sidebar.style.display = "flex";
    resizer.style.display = "block";
    toggleBtn.style.display = "none";
  } else {
    sidebar.style.display = "none";
    resizer.style.display = "none";
    toggleBtn.style.display = "block";
  }

  if (forceState === undefined) saveState();
}

(function setupResizer() {
  const resizer = document.getElementById("resizer");
  const sidebar = document.getElementById("sidebar");
  if (!resizer || !sidebar) return;
  
  let isResizing = false;

  resizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    document.body.style.cursor = "col-resize";
    resizer.classList.add("resizing");
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 200 && newWidth < 800) {
      sidebar.style.width = newWidth + "px";
      state.sidebarWidth = newWidth;
    }
  });

  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = "";
      resizer.classList.remove("resizing");
      saveState();
    }
  });
})();
