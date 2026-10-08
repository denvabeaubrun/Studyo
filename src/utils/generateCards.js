// generateCards.js
//
// Turns raw notes text into flashcards, with no backend needed.
// It understands several common note formats:
//   Term: definition          Term - definition        Term — definition
//   Term = definition         Term -> definition       Term<TAB>definition
//   Term:                     (definition on the next line)
//   Term                      (short line, then its definition on the next line)
//   definition
// Bullets, numbering and **bold** markers are ignored.
// If very few cards are found, long sentences become fill-in-the-blank cards.
//
// TODO (real AI generation): replace the body with a call to your serverless
// proxy that holds the Anthropic API key. Never put the key in client code.

const BULLET = /^\s*(?:[-*•▪◦●‣]|\d{1,3}[.)])\s+/;
const SEPARATORS = [
  /\s[—–]\s/,        // Term — definition
  /\s-\s/,           // Term - definition
  /\s->\s|\s→\s/,    // Term -> definition
  /\s=\s/,           // Term = definition
  /\t+/,             // Term<TAB>definition
];

const wordCount = (s) => s.split(/\s+/).filter(Boolean).length;
const looksLikeTerm = (s) => s.length > 1 && s.length <= 80 && wordCount(s) <= 10;

function clean(line) {
  return line
    .replace(BULLET, '')
    .replace(/\*\*|__/g, '')
    .replace(/^#+\s*/, '')
    .trim();
}

// Try to split one line into [term, definition].
function splitLine(line) {
  // Colon: skip times (10:30) and links (https://...)
  const colon = line.search(/:(?!\/\/)(?!\d)/);
  if (colon > 0 && colon < line.length - 1) {
    const term = line.slice(0, colon).trim();
    const def = line.slice(colon + 1).trim();
    if (looksLikeTerm(term) && def.length > 1) return [term, def];
  }
  for (const sep of SEPARATORS) {
    const m = line.match(sep);
    if (m && m.index > 0) {
      const term = line.slice(0, m.index).trim();
      const def = line.slice(m.index + m[0].length).trim();
      if (looksLikeTerm(term) && def.length > 1) return [term, def];
    }
  }
  return null;
}

export function generateCards(text, maxCards = 100) {
  const raw = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const lines = raw.map(clean).filter(Boolean);
  const pairs = [];

  // Pass 1: one-line pairs, plus "Term:" with the definition on the next line.
  const used = new Set();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = splitLine(line);
    if (parts) {
      pairs.push(parts);
      used.add(i);
    } else if (line.endsWith(':') && looksLikeTerm(line.slice(0, -1)) && lines[i + 1]) {
      pairs.push([line.slice(0, -1).trim(), lines[i + 1]]);
      used.add(i);
      used.add(i + 1);
      i++;
    }
  }

  // Pass 2: alternating lines (short term line, then a longer definition line).
  // Only used when pass 1 found few cards, so mixed notes don't get mispaired.
  if (pairs.length < Math.max(3, lines.length / 4)) {
    const alt = [];
    for (let i = 0; i + 1 < lines.length; i++) {
      const a = lines[i];
      const b = lines[i + 1];
      if (looksLikeTerm(a) && !/[.!?]$/.test(a) && b.length > a.length && !splitLine(b)) {
        alt.push([a, b]);
        i++;
      }
    }
    if (alt.length > pairs.length) {
      pairs.length = 0;
      pairs.push(...alt);
    }
  }

  // Pass 3: fill-in-the-blank cards from long sentences, only if still thin.
  if (pairs.length < 5) {
    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map((s) => clean(s))
      .filter((s) => s.length > 25 && s.length < 240);
    for (const sentence of sentences) {
      if (pairs.length >= maxCards) break;
      const words = sentence.split(/\s+/).filter((w) => w.replace(/[.,!?]/g, '').length > 5);
      if (words.length === 0) continue;
      const target = words[Math.floor(words.length / 2)];
      pairs.push([sentence.replace(target, '_____'), target.replace(/[.,!?]$/, '')]);
    }
  }

  // Drop duplicate terms, then apply the cap.
  const seen = new Set();
  const unique = pairs.filter(([front]) => {
    const key = front.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, maxCards).map(([front, back], i) => ({
    id: Date.now() + i,
    front,
    back,
    mastered: false,
  }));
}
