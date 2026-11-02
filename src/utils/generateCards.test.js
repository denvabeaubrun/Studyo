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
import { generateCards, cleanNotes } from './generateCards';

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

  // ---------------------------------------------------------------------
  // Messy notes
  // ---------------------------------------------------------------------

  it('turns "Q:" / "A:" pairs and plain question lines into cards', () => {
    const notes = [
      'Q: What organelle makes ATP?',
      'A: The mitochondria',
      'Question 2. Where does photosynthesis happen?',
      'Answer 2. In the chloroplasts',
      'Why is the sky blue?',
      'Short wavelengths scatter more in the atmosphere',
    ].join('\n');

    expect(pairs(generateCards(notes))).toEqual([
      ['What organelle makes ATP?', 'The mitochondria'],
      ['Where does photosynthesis happen?', 'In the chloroplasts'],
      ['Why is the sky blue?', 'Short wavelengths scatter more in the atmosphere'],
    ]);
  });

  it('turns "X is/are ..." sentences into term cards', () => {
    const notes =
      'Mitochondria are the organelles that make most of the cell\u2019s ATP. ' +
      'The cell membrane is a thin layer that controls what enters and exits the cell.';

    expect(pairs(generateCards(notes))).toEqual([
      ['Mitochondria', 'The organelles that make most of the cell\u2019s ATP.'],
      ['Cell membrane', 'A thin layer that controls what enters and exits the cell.'],
    ]);
  });

  it('does not make a card from a sentence that starts with a pronoun', () => {
    const notes = 'It is important to review your notes within a day of class.';
    const fronts = generateCards(notes).map((card) => card.front);
    expect(fronts).not.toContain('It');
  });

  it('keeps Q/A and term lines in the order they were written', () => {
    const notes = [
      'Atom: The smallest unit of matter',
      'Q: What is a molecule?',
      'A: Two or more atoms bonded together',
      'Ion: An atom with an electric charge',
    ].join('\n');

    expect(generateCards(notes).map((card) => card.front)).toEqual([
      'Atom',
      'What is a molecule?',
      'Ion',
    ]);
  });
});

describe('cleanNotes', () => {
  it('joins a word split by a hyphen at the end of a line', () => {
    expect(cleanNotes('Photo-\nsynthesis: How plants make food')).toBe('Photosynthesis: How plants make food\n');
  });

  it('joins a long sentence that wrapped onto the next line', () => {
    const notes =
      'Osmosis: the net movement of water across a selectively permeable\nmembrane from low to high solute concentration';
    expect(cleanNotes(notes)).toContain(
      'Osmosis: the net movement of water across a selectively permeable membrane from low to high solute concentration'
    );
  });

  it('does not join a short term line with a lowercase definition line', () => {
    const notes = 'Mitochondria\nthe powerhouse of the cell';
    expect(cleanNotes(notes)).toContain('Mitochondria\nthe powerhouse of the cell');
  });

  it('removes page numbers and headers/footers that repeat on every page', () => {
    // Pages are separated by a form feed, the way readPdf.js sends them.
    const page = (n, body) => `Biology 101 - Cell Notes\n${body}\nPage ${n}`;
    const notes = [
      page(1, 'Mitochondria: The powerhouse of the cell'),
      page(2, 'Ribosome: Builds proteins from amino acids'),
      page(3, 'Nucleus: Stores the cell DNA'),
    ].join('\f');

    const cleaned = cleanNotes(notes);
    expect(cleaned).not.toContain('Biology 101');
    expect(cleaned).not.toMatch(/Page \d/);
    expect(pairs(generateCards(notes))).toEqual([
      ['Mitochondria', 'The powerhouse of the cell'],
      ['Ribosome', 'Builds proteins from amino acids'],
      ['Nucleus', 'Stores the cell DNA'],
    ]);
  });

  it('removes a bare page number only at the top or bottom of a PDF page', () => {
    const notes = ['Allele: A version of a gene\n7', 'Genotype: The genetic makeup\n8'].join('\f');
    expect(cleanNotes(notes)).not.toMatch(/^[78]$/m);
    // A number alone on a line in the middle of normal notes is kept.
    expect(cleanNotes('Speed of light\n299792458\nGravity: 9.8')).toContain('299792458');
  });

  it('fixes PDF ligatures, odd spaces and invisible characters', () => {
    expect(cleanNotes('Of\uFB01ce:\u00A0a\u200B place')).toBe('Office: a place\n');
  });

  it('drops divider lines', () => {
    expect(cleanNotes('Atom: tiny\n-----\nIon: charged')).not.toContain('-----');
  });
});
