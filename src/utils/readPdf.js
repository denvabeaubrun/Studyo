// readPdf.js
//
// Pulls the text out of a PDF in the browser (nothing is uploaded anywhere).
// Uses pdf.js, which is loaded only when someone actually picks a PDF, so it
// doesn't make the rest of the app slower to open.
//
// extractPdfText(file) returns the text with pages separated by a form feed
// character ('\f'), which generateCards() uses to spot page numbers and
// repeating headers/footers. Blank lines mark paragraph gaps.
//
// Limits: only PDFs that contain real text work. A scanned PDF (a picture of
// a page) has no text to read, and a password-protected PDF can't be opened.

import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export const MAX_PDF_MB = 20;
export const MAX_PDF_PAGES = 150;

// Turns pdf.js text pieces into lines. Pieces on the same height join into one
// line, left to right. A bigger vertical gap than usual adds a blank line.
export function itemsToLines(items) {
  const rows = [];
  for (const item of items) {
    if (typeof item.str !== 'string' || !item.str.trim()) continue;
    const [, , , , x, y] = item.transform;
    const height = item.height || Math.abs(item.transform[3]) || 10;
    let row = rows.find((r) => Math.abs(r.y - y) <= height * 0.5);
    if (!row) {
      row = { y, height, parts: [] };
      rows.push(row);
    }
    row.parts.push({ x, width: item.width || 0, str: item.str });
  }

  rows.sort((a, b) => b.y - a.y); // PDF y grows upward, so the top line comes first

  const lines = [];
  let prev = null;
  for (const row of rows) {
    row.parts.sort((a, b) => a.x - b.x);
    let text = '';
    let end = null;
    for (const part of row.parts) {
      const gap = end === null ? 0 : part.x - end;
      const needsSpace = end !== null && gap > row.height * 0.15 && !/\s$/.test(text) && !/^\s/.test(part.str);
      text += (needsSpace ? ' ' : '') + part.str;
      end = part.x + part.width;
    }
    text = text.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (prev && prev.y - row.y > Math.max(prev.height, row.height) * 1.9) lines.push('');
    lines.push(text);
    prev = row;
  }
  return lines;
}

export async function extractPdfText(file) {
  if (file.size > MAX_PDF_MB * 1024 * 1024) {
    throw new Error(`That PDF is bigger than ${MAX_PDF_MB} MB. Try a smaller one, or paste the text you need.`);
  }

  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  // The loading task owns the worker and memory; destroying it at the end frees both.
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  let pdf;
  try {
    pdf = await task.promise;
  } catch (err) {
    task.destroy();
    if (err?.name === 'PasswordException') {
      throw new Error('That PDF is password protected. Remove the password, or paste the text instead.', { cause: err });
    }
    throw new Error('Could not open that PDF. It may be damaged. Try another file, or paste the text.', { cause: err });
  }

  try {
    const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES);
    const pages = [];
    for (let n = 1; n <= pageCount; n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      pages.push(itemsToLines(content.items).join('\n'));
    }

    const text = pages.join('\n\f\n');
    if (text.replace(/\s/g, '').length < 20) {
      throw new Error('No text found in that PDF. It may be a scan (a picture of a page). Try a text-based PDF, or paste the text.');
    }
    return { text, truncated: pdf.numPages > MAX_PDF_PAGES, pageCount: pdf.numPages };
  } finally {
    task.destroy();
  }
}
