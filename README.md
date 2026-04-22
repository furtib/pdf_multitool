# pdf-multitool

![Tests](https://github.com/Tibi/pdf_multitool/actions/workflows/playwright.yml/badge.svg)

A browser-based PDF multitool to select pages from separate PDF files and concatenate them into a single file.

# This project started as a vibecoded mess

I just needed this tool, and needed it fast

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
