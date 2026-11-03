// matchGame.js
//
// The rules for the Match game, kept apart from the screen so they are easy to test.
//
// A round picks a few cards from a study set and turns each one into two tiles:
// a "term" tile (the card front) and a "definition" tile (the card back). The
// player pairs each term with its definition.
//
// Cards that would make a confusing round are skipped: two cards with the same
// front or the same back could be paired in more than one way.

export const ROUND_SIZE = 6;  // pairs per round (a smaller set uses all of its cards)
export const MIN_PAIRS = 2;   // a round needs at least this many different cards

// Returns a shuffled copy of an array (Fisher–Yates). The original isn't changed.
export function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Builds a round from a set's cards.
// Returns { pairs, terms, definitions }:
//   pairs        how many cards are in the round
//   terms        term tiles, in random order:       { id, cardId, side: 'term', text }
//   definitions  definition tiles, in random order: { id, cardId, side: 'definition', text }
// Returns null if the set doesn't have enough different cards (see MIN_PAIRS).
export function buildRound(cards, size = ROUND_SIZE) {
  const seenFronts = new Set();
  const seenBacks = new Set();
  const picked = [];

  for (const card of shuffle(cards)) {
    const front = card.front.trim().toLowerCase();
    const back = card.back.trim().toLowerCase();
    if (!front || !back || seenFronts.has(front) || seenBacks.has(back)) continue;
    seenFronts.add(front);
    seenBacks.add(back);
    picked.push(card);
    if (picked.length === size) break;
  }

  if (picked.length < MIN_PAIRS) return null;

  const tile = (card, side) => ({
    id: `${card.id}-${side}`,
    cardId: card.id,
    side,
    text: side === 'term' ? card.front : card.back,
  });

  return {
    pairs: picked.length,
    terms: shuffle(picked.map((card) => tile(card, 'term'))),
    definitions: shuffle(picked.map((card) => tile(card, 'definition'))),
  };
}

// True when the two tiles belong to the same card and are on opposite sides.
export function isMatch(a, b) {
  return a.cardId === b.cardId && a.side !== b.side;
}

// Seconds -> "m:ss", e.g. 65 -> "1:05".
export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
