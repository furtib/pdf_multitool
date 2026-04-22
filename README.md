# pdf-multitool

![Tests](https://github.com/furtib/pdf_multitool/actions/workflows/tests.yml/badge.svg)

A browser-based PDF multitool to select pages from separate PDF files and concatenate them into a single file.

## Features

- **Merge PDFs:** Open multiple PDF files and select individual pages to combine.
- **Annotate:** Draw, add text, and erase annotations directly on PDF pages.
- **Reorder:** Drag and drop to reorder files and selected pages.
- **Persistent State:** Automatic session saving using IndexedDB (localforage).

## Project Structure

The project has been refactored into a modern, modular architecture:

- `src/main.js`: Application entry point and initialization.
- `src/modules/`:
  - `state.js`: Global state management and persistence.
  - `drawing.js`: Annotation tools and canvas logic.
  - `viewer.js`: PDF rendering and viewer interactions.
  - `selection.js`: Page selection queue management.
  - `undo.js`: Undo/redo history system.
  - `export.js`: PDF generation and merging.
  - `file-handler.js`: File input processing.
  - `ui.js`: Layout and sidebar interactions.
  - `utils.js`: Shared UI helpers.

## Testing

This project uses both unit tests and end-to-end tests to ensure reliability.

### Unit Tests

We use [Vitest](https://vitest.dev/) for fast unit testing of core logic (math utilities, undo/redo, state management).

To run unit tests:

```bash
npm run test:unit
```

### End-to-End Tests

We use [Playwright](https://playwright.dev/) for verifying user workflows in the browser.

To run end-to-end tests:

```bash
npm test
```

### Prerequisites

Ensure you have dependencies and browsers installed:

```bash
npm install
npx playwright install
```
