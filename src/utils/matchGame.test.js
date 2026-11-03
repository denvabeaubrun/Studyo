// matchGame.test.js
//
// Tests for the Match game rules: building a round and checking pairs.
//
// Run with: npm test

import { describe, it, expect } from 'vitest';
import { buildRound, isMatch, formatTime, ROUND_SIZE, MIN_PAIRS } from './matchGame';

const card = (id, front, back) => ({ id, front, back, mastered: false });

const cards = [
  card(1, 'Mitochondria', 'The powerhouse of the cell'),
  card(2, 'Ribosome', 'Builds proteins'),
  card(3, 'Nucleus', 'Stores the DNA'),
  card(4, 'Cell membrane', 'Controls what enters the cell'),
  card(5, 'Chloroplast', 'Where photosynthesis happens'),
  card(6, 'Vacuole', 'Stores water and nutrients'),
  card(7, 'Cytoplasm', 'The jelly-like fluid inside the cell'),
  card(8, 'Lysosome', 'Breaks down waste'),
];

describe('buildRound', () => {
  it('uses at most one round of cards from a big set', () => {
    const round = buildRound(cards);
    expect(round.pairs).toBe(ROUND_SIZE);
    expect(round.terms).toHaveLength(ROUND_SIZE);
    expect(round.definitions).toHaveLength(ROUND_SIZE);
  });

  it('uses every card when the set is small', () => {
    const round = buildRound(cards.slice(0, 3));
    expect(round.pairs).toBe(3);
  });

  it('makes exactly one term tile and one definition tile for each card', () => {
    const round = buildRound(cards.slice(0, 4));
    const termIds = round.terms.map((t) => t.cardId).sort();
    const defIds = round.definitions.map((d) => d.cardId).sort();
    expect(termIds).toEqual([1, 2, 3, 4]);
    expect(defIds).toEqual([1, 2, 3, 4]);
    expect(round.terms.every((t) => t.side === 'term')).toBe(true);
    expect(round.definitions.every((d) => d.side === 'definition')).toBe(true);
  });

  it('puts the card front on the term tile and the card back on the definition tile', () => {
    const round = buildRound([cards[0], cards[1]]);
    const term = round.terms.find((t) => t.cardId === 1);
    const definition = round.definitions.find((d) => d.cardId === 1);
    expect(term.text).toBe('Mitochondria');
    expect(definition.text).toBe('The powerhouse of the cell');
  });

  it('does not change the cards it was given', () => {
    const copy = JSON.parse(JSON.stringify(cards));
    buildRound(cards);
    expect(cards).toEqual(copy);
  });

  it('returns null when there are fewer than 2 cards', () => {
    expect(buildRound([])).toBeNull();
    expect(buildRound([cards[0]])).toBeNull();
    expect(MIN_PAIRS).toBe(2);
  });

  it('never puts two cards with the same front or the same back in one round', () => {
    const tricky = [
      card(1, 'Atom', 'Smallest unit of matter'),
      card(2, 'atom', 'A different back'),            // same front (any capitalization)
      card(3, 'Particle', 'Smallest unit of matter'), // same back
      card(4, 'Molecule', 'Atoms bonded together'),
    ];
    // Rounds are shuffled, so repeat to cover different orders.
    for (let i = 0; i < 100; i++) {
      const round = buildRound(tricky);
      const fronts = round.terms.map((t) => t.text.toLowerCase());
      const backs = round.definitions.map((d) => d.text.toLowerCase());
      expect(new Set(fronts).size).toBe(fronts.length);
      expect(new Set(backs).size).toBe(backs.length);
      expect(round.pairs).toBeGreaterThanOrEqual(2);
    }
  });

  it('returns null when every card clashes with another', () => {
    const same = [card(1, 'Atom', 'Tiny'), card(2, 'Atom', 'Small')];
    expect(buildRound(same)).toBeNull();
  });

  it('ignores cards with an empty front or back', () => {
    const blanks = [card(1, '  ', 'Something'), card(2, 'Term', ''), card(3, 'A', 'B'), card(4, 'C', 'D')];
    expect(buildRound(blanks).pairs).toBe(2);
  });
});

describe('isMatch', () => {
  const term = { cardId: 1, side: 'term' };
  const definition = { cardId: 1, side: 'definition' };

  it('is true for the term and definition of the same card, in either order', () => {
    expect(isMatch(term, definition)).toBe(true);
    expect(isMatch(definition, term)).toBe(true);
  });

  it('is false for tiles from different cards', () => {
    expect(isMatch(term, { cardId: 2, side: 'definition' })).toBe(false);
  });

  it('is false for two tiles on the same side', () => {
    expect(isMatch(term, { cardId: 1, side: 'term' })).toBe(false);
  });
});

describe('formatTime', () => {
  it('shows minutes and seconds', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(7)).toBe('0:07');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(600)).toBe('10:00');
  });
});
