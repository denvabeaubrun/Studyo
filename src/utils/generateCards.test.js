// generateCards.test.js
//
// Tests for generateCards(), which turns raw study notes into flashcards.
// Each test gives the function some sample notes (the input) and checks the
// cards it returns (the output). A card looks like:
//   { id, front, back, mastered }
// where "front" is the term or question and "back" is the answer.
//
// Run with: npm test

import { describe, it, expect } from 'vitest';
import { generateCards } from './generateCards';

// Helper: keep only the front/back text so tests can compare cards easily.
const pairs = (cards) => cards.map(({ front, back }) => [front, back]);

describe('generateCards', () => {
  it('turns "Term: definition" lines into one card per line', () => {
    // Input: three lines in the most common note format.
    const notes = [
      'Mitochondria: The powerhouse of the cell',
      'Ribosome: Builds proteins from amino acids',
      'Nucleus: Stores the cell\'s DNA',
    ].join('\n');

    // Expected output: the term on the front, the definition on the back.
    expect(pairs(generateCards(notes))).toEqual([
      ['Mitochondria', 'The powerhouse of the cell'],
      ['Ribosome', 'Builds proteins from amino acids'],
      ['Nucleus', 'Stores the cell\'s DNA'],
    ]);
  });

  it('understands other separators: dash, arrow, equals sign and tab', () => {
    // Input: one line for each separator style.
    const notes = [
      'Allele - A version of a gene',
      'Genotype -> The genetic makeup of an organism',
      'Phenotype = The observable traits of an organism',
      'Gamete\tA reproductive cell',
    ].join('\n');

    // Expected output: every style is split into term and definition.
    expect(pairs(generateCards(notes))).toEqual([
      ['Allele', 'A version of a gene'],
      ['Genotype', 'The genetic makeup of an organism'],
      ['Phenotype', 'The observable traits of an organism'],
      ['Gamete', 'A reproductive cell'],
    ]);
  });

  it('removes bullets, numbering, headings and **bold** markers', () => {
    // Input: notes copied from a document with formatting left in.
    const notes = [
      '# Chapter 3',
      '- **Osmosis**: Movement of water across a membrane',
      '2. Diffusion: Movement from high to low concentration',
      '• Enzyme: A protein that speeds up reactions',
    ].join('\n');

    // Expected output: clean terms with no formatting symbols.
    // The heading has no definition, so it doesn't become a card.
    expect(pairs(generateCards(notes))).toEqual([
      ['Osmosis', 'Movement of water across a membrane'],
      ['Diffusion', 'Movement from high to low concentration'],
      ['Enzyme', 'A protein that speeds up reactions'],
    ]);
  });

  it('handles "Term:" with the definition on the next line', () => {
    // Input: each term ends with a colon, and its definition is on the line below.
    const notes = [
      'Photosynthesis:',
      'How plants turn sunlight into energy',
      'Respiration:',
      'How cells release energy from food',
    ].join('\n');

    expect(pairs(generateCards(notes))).toEqual([
      ['Photosynthesis', 'How plants turn sunlight into energy'],
      ['Respiration', 'How cells release energy from food'],
    ]);
  });

  it('does not split on times or web links', () => {
    // Input: a line with a time (10:30) and a link (https://), neither of
    // which is a "Term: definition" pair.
    const notes = 'Class starts at 10:30 and the slides are at https://example.com/slides';

    // Expected output: no card uses "Class starts at 10" or "https" as a term.
    const fronts = generateCards(notes).map((card) => card.front);
    expect(fronts).not.toContain('Class starts at 10');
    expect(fronts).not.toContain('https');
  });

  it('makes fill-in-the-blank cards when notes are full sentences', () => {
    // Input: plain sentences with no term/definition format.
    const notes =
      'The mitochondria produces energy for the cell through respiration. ' +
      'Chloroplasts capture sunlight so plants can make their own food.';

    const cards = generateCards(notes);

    // Expected output: one card per sentence, with one word blanked out on
    // the front and that same word as the answer on the back.
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card.front).toContain('_____');
      expect(card.back.length).toBeGreaterThan(5);
      expect(card.front.replace('_____', card.back)).not.toContain('_____');
    }
  });

  it('removes duplicate terms, ignoring capital letters', () => {
    // Input: the same term written twice with different capitalization.
    const notes = [
      'Mitosis: Cell division that makes two identical cells',
      'mitosis: Another definition of the same term',
      'Meiosis: Cell division that makes four sex cells',
    ].join('\n');

    // Expected output: only the first "Mitosis" card is kept.
    expect(pairs(generateCards(notes))).toEqual([
      ['Mitosis', 'Cell division that makes two identical cells'],
      ['Meiosis', 'Cell division that makes four sex cells'],
    ]);
  });

  it('respects the maxCards limit', () => {
    // Input: 10 term/definition lines, but a limit of 4 cards.
    const notes = Array.from({ length: 10 }, (_, i) => `Term ${i + 1}: Definition number ${i + 1}`).join('\n');

    // Expected output: only the first 4 cards.
    const cards = generateCards(notes, 4);
    expect(cards).toHaveLength(4);
    expect(cards[3].front).toBe('Term 4');
  });

  it('gives every new card a unique id and starts it as not mastered', () => {
    const notes = 'Atom: The smallest unit of matter\nMolecule: Two or more atoms bonded together';
    const cards = generateCards(notes);

    // Expected output: ids are all different, and mastered is false.
    expect(new Set(cards.map((card) => card.id)).size).toBe(cards.length);
    expect(cards.every((card) => card.mastered === false)).toBe(true);
  });

  it('returns no cards for empty notes', () => {
    // Input: nothing but blank lines and spaces.
    expect(generateCards('   \n\n  ')).toEqual([]);
  });
});
