/**
 * Global setup: generates lightweight PDF fixture files used by all tests.
 * Uses pdf-lib (same library the app uses) to create multi-page documents.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function createPDF(pageCount, label) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([612, 792]); // US Letter
    page.drawText(`${label} – Page ${i} of ${pageCount}`, {
      x: 50,
      y: 400,
      size: 28,
      font,
      color: rgb(0.1, 0.1, 0.5),
    });
    page.drawText(`Page ${i}`, {
      x: 50,
      y: 50,
      size: 12,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  return doc.save();
}

export default async function globalSetup() {
  const fixturesDir = join(__dirname, 'fixtures');
  mkdirSync(fixturesDir, { recursive: true });

  // test-doc1.pdf – 2 pages
  const pdf1 = await createPDF(2, 'Document One');
  writeFileSync(join(fixturesDir, 'test-doc1.pdf'), pdf1);

  // test-doc2.pdf – 3 pages
  const pdf2 = await createPDF(3, 'Document Two');
  writeFileSync(join(fixturesDir, 'test-doc2.pdf'), pdf2);

  // test-doc3.pdf – 1 page (used in export tests)
  const pdf3 = await createPDF(1, 'Document Three');
  writeFileSync(join(fixturesDir, 'test-doc3.pdf'), pdf3);
}
