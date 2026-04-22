export function showHelp() {
  const modal = document.getElementById("help-modal");
  if (modal) modal.style.display = "flex";
}

export function hideHelp() {
  const modal = document.getElementById("help-modal");
  if (modal) modal.style.display = "none";
}

export function showLoader(text) {
  const loader = document.getElementById("loader");
  const loaderText = document.getElementById("loader-text");
  if (loader) loader.style.display = "flex";
  if (loaderText) loaderText.textContent = text;
}

export function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
}
