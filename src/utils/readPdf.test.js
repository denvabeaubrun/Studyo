// readPdf.test.js
//
// Tests for itemsToLines(), which rebuilds readable lines from the loose
// pieces of text that pdf.js returns. The PDF reading itself needs a browser,
// so only this pure function is tested here.
//
// Run with: npm test

import { describe, it, expect } from 'vitest';
import { itemsToLines } from './readPdf';

// Helper: a text piece at position (x, y), like pdf.js returns.
const piece = (str, x, y, width = str.length * 5, height = 10) => ({
  str,
  width,
  height,
  transform: [10, 0, 0, 10, x, y],
});

describe('itemsToLines', () => {
  it('puts pieces on the same height into one line, left to right', () => {
    // Pieces arrive out of order on purpose.
    const items = [piece('cell', 70, 700), piece('The', 20, 700), piece('wall', 100, 700)];
    expect(itemsToLines(items)).toEqual(['The cell wall']);
  });

  it('orders lines from the top of the page down', () => {
    const items = [piece('Second line', 20, 688), piece('First line', 20, 700)];
    expect(itemsToLines(items)).toEqual(['First line', 'Second line']);
  });

  it('does not add a space inside a word split into pieces', () => {
    const items = [piece('Photo', 20, 700, 25), piece('synthesis', 45, 700, 45)];
    expect(itemsToLines(items)).toEqual(['Photosynthesis']);
  });

  it('adds a blank line for a bigger gap between paragraphs', () => {
    const items = [piece('Paragraph one', 20, 700), piece('Paragraph two', 20, 640)];
    expect(itemsToLines(items)).toEqual(['Paragraph one', '', 'Paragraph two']);
  });

  it('ignores empty pieces', () => {
    const items = [piece('  ', 20, 700), piece('Hello', 20, 688)];
    expect(itemsToLines(items)).toEqual(['Hello']);
  });
});
