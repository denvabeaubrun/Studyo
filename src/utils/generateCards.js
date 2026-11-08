// generateCards.js
//
// Turns raw notes text into flashcards, with no backend needed.
// It understands several common note formats:
//   Term: definition          Term - definition        Term — definition
//   Term = definition         Term -> definition       Term<TAB>definition
//   Term:                     (definition on the next line)
//   Term                      (short line, then its definition on the next line)
//   definition
//   Q: question               A: answer      (also "Question:" / "Answer:")
//   Why is the sky blue?      (a question line, then its answer on the next line)
//   Mitochondria are the organelles that make ATP.   (becomes Mitochondria -> the organelles...)
//   the revolution was during 1775 to 1783 and it started because of taxes
//                             (ongoing notes: becomes "When was the revolution?" and
//                              "Why did the revolution start?"; see noteFacts.js)
// Bullets, numbering and **bold** markers are ignored.
// Sentences with a date, number or name and no other pattern become fill-in-the-blank
// cards that hide that key fact. If very few cards are found, other long sentences
// become fill-in-the-blank cards too.
//
// Messy text is cleaned first (see cleanNotes): text copied out of a PDF often
// has lines broken in the middle of a sentence, words split with a hyphen at
// the end of a line, page numbers, and headers or footers repeated on every page.
//
// TODO (real AI generation): replace the body with a call to your serverless
// proxy that holds the Anthropic API key. Never put the key in client code.

import { splitSentences, factFromSentence, blankKeyFact } from './noteFacts';

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

// ---------------------------------------------------------------------------
// Cleaning messy text
// ---------------------------------------------------------------------------

// Lines that are only a page number, like "Page 4", "4 / 12" or "- 4 -".
const PAGE_LABEL = /^(?:page\s+\d{1,4}(?:\s*(?:\/|of)\s*\d{1,4})?|\d{1,4}\s*(?:\/|of)\s*\d{1,4}|[-–—]\s*\d{1,4}\s*[-–—])$/i;
// Divider lines such as "-----", "=====" or "* * *".
const DIVIDER = /^[\s_\-=*·.~•]{3,}$/;

// Same line on every page except for its numbers ("Biology 101 | 4" and "Biology 101 | 5").
const shape = (line) => line.toLowerCase().replace(/\d+/g, '#');

// Removes page numbers and any header/footer that repeats on most pages.
// "pages" is an array of pages, each an array of lines. Pages come from '\f'
// characters, which readPdf.js puts between PDF pages.
function dropPageNoise(pages) {
  const edgeLines = (page) => {
    const filled = page.map((line, i) => ({ line, i })).filter(({ line }) => line);
    return [...filled.slice(0, 2), ...filled.slice(-2)];
  };

  // Count how many pages each top/bottom line shape appears on.
  const counts = new Map();
  if (pages.length >= 3) {
    for (const page of pages) {
      const shapes = new Set(edgeLines(page).map(({ line }) => shape(line)));
      shapes.forEach((sh) => counts.set(sh, (counts.get(sh) || 0) + 1));
    }
  }
  const needed = Math.ceil(pages.length * 0.6);

  return pages.map((page) => {
    const drop = new Set();
    for (const { line, i } of edgeLines(page)) {
      if (pages.length >= 3 && line.length <= 90 && counts.get(shape(line)) >= needed) drop.add(i);
      if (pages.length >= 2 && /^\d{1,4}$/.test(line)) drop.add(i); // bare page number
    }
    return page.filter((line, i) => !drop.has(i) && !PAGE_LABEL.test(line) && !DIVIDER.test(line));
  });
}

// Fixes how lines are broken up so each note sits on one line:
//   "photo-" + "synthesis"                     -> "photosynthesis"
//   long line with no ending + lowercase line  -> one line (a sentence that wrapped)
// A wrapped line is about as long as the longest lines in the text (text from a PDF
// wraps at the same width). Typed notes where each line is its own thought, with no
// periods, have lines of different lengths, so they are left alone.
// Blank lines are kept as paragraph breaks.
function joinBrokenLines(lines) {
  const longest = Math.max(0, ...lines.map((l) => l.length));
  const wrapWidth = Math.max(55, longest * 0.8);
  // Quick typed notes ("the war ended in 1918") usually start lowercase and never
  // end with a period. Then each line is its own note, so wrapped lines aren't joined.
  const filled = lines.filter(Boolean);
  const typedNotes = filled.length >= 3 &&
    filled.filter((l) => /^[a-z]/.test(l)).length / filled.length > 0.6 &&
    filled.filter((l) => /[.!?]$/.test(l)).length / filled.length < 0.2;
  const out = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (prev && line) {
      if (/[A-Za-z]-$/.test(prev) && /^[a-z]/.test(line)) {
        out[out.length - 1] = prev.slice(0, -1) + line;
        continue;
      }
      if (!typedNotes && prev.length >= wrapWidth && !/[.!?:;]$/.test(prev) && /^[a-z]/.test(line)) {
        out[out.length - 1] = `${prev} ${line}`;
        continue;
      }
    }
    out.push(line);
  }
  return out;
}

// Cleans up pasted or PDF-extracted notes before cards are made.
export function cleanNotes(text) {
  const normalized = String(text)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')      // invisible characters
    .replace(/[\u00A0\u2007\u202F]/g, ' ')            // odd spaces
    .replace(/\uFB00/g, 'ff').replace(/\uFB01/g, 'fi') // PDF ligatures
    .replace(/\uFB02/g, 'fl').replace(/\uFB03/g, 'ffi').replace(/\uFB04/g, 'ffl')
    .replace(/ {2,}/g, ' ');

  const pages = normalized.split('\f').map((page) => page.split('\n').map((l) => l.trim()));
  const lines = dropPageNoise(pages).flatMap((page) => [...page, '']);
  return joinBrokenLines(lines).join('\n');
}

// ---------------------------------------------------------------------------
// Finding cards. Each finder returns entries like
//   { at: line number, pair: [front, back], idx: [line numbers it used] }
// ---------------------------------------------------------------------------

const QUESTION_LABEL = /^q(?:uestion)?\s*\d{0,3}\s*[:.)]\s*(.+)$/i;
const ANSWER_LABEL = /^a(?:nswer)?\s*\d{0,3}\s*[:.)]\s*(.+)$/i;

// "Q: ..." followed by "A: ...", and "Some question?" followed by its answer.
function findQuestionPairs(lines) {
  const found = [];
  for (let i = 0; i + 1 < lines.length; i++) {
    const q = lines[i].match(QUESTION_LABEL);
    const a = lines[i + 1].match(ANSWER_LABEL);
    if (q && a) {
      found.push({ at: i, pair: [q[1].trim(), a[1].trim()], idx: [i, i + 1] });
      i++;
      continue;
    }
    const line = lines[i];
    const next = lines[i + 1];
    if (
      line.endsWith('?') && line.length >= 6 && !splitLine(line) &&
      !next.endsWith('?') && !QUESTION_LABEL.test(next) && !splitLine(next)
    ) {
      found.push({ at: i, pair: [line, next], idx: [i, i + 1] });
      i++;
    }
  }
  return found;
}

// One-line pairs, plus "Term:" with the definition on the next line.
function findTermPairs(lines, taken) {
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    if (taken.has(i)) continue;
    const line = lines[i];
    const parts = splitLine(line);
    if (parts) {
      found.push({ at: i, pair: parts, idx: [i] });
    } else if (line.endsWith(':') && looksLikeTerm(line.slice(0, -1)) && lines[i + 1] && !taken.has(i + 1)) {
      found.push({ at: i, pair: [line.slice(0, -1).trim(), lines[i + 1]], idx: [i, i + 1] });
      i++;
    }
  }
  return found;
}

// Alternating lines: a short term line, then a longer definition line.
function findAlternatingPairs(lines, taken) {
  const found = [];
  for (let i = 0; i + 1 < lines.length; i++) {
    if (taken.has(i) || taken.has(i + 1)) continue;
    const a = lines[i];
    const b = lines[i + 1];
    // A short line that reads like a sentence ("the war was in 1812") isn't a term.
    const isSentence = wordCount(a) >= 6 ||
      /\b(?:is|are|was|were|has|have|had|did|does|will|because|during|takes|happens|occurs)\b/i.test(a) ||
      (wordCount(a) >= 3 && /\b[a-z]{3,}ed\b/.test(a)); // "the war ended in 1918"
    if (looksLikeTerm(a) && !isSentence && !/[.!?]$/.test(a) && b.length > a.length && !splitLine(b)) {
      found.push({ at: i, pair: [a, b], idx: [i, i + 1] });
      i++;
    }
  }
  return found;
}

// Sentences like "Mitochondria are the organelles that make ATP." become
// front "Mitochondria", back "The organelles that make ATP."
const DEFINITION = /^([A-Z][\w'’()\- ]{1,50}?)\s+(?:is|are|refers to|means|is defined as|is called|are called|consists of)\s+(.{15,})$/;
const NOT_A_TERM = /^(?:it|this|that|these|those|there|here|which|what|who|he|she|they|we|you|i|one|some|many|most|each|all|both|if|when|because)\b/i;
const upperFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Notes written as sentences. For each sentence, in order:
//   1. "X is/are ..."            -> term card (Mitochondria -> The organelles that...)
//   2. a fact pattern            -> question card (When was X? Why did X start? ...)
//   3. a date, number or name    -> fill-in-the-blank that hides it
// "it"/"they" at the start of a sentence means the subject of the sentence before,
// even across lines.
function findProseCards(lines, taken) {
  const found = [];
  let subject = null;
  lines.forEach((line, i) => {
    if (taken.has(i)) return;
    for (const sentence of splitSentences(line)) {
      const def = sentence.match(DEFINITION);
      if (def && !sentence.includes('?') && !NOT_A_TERM.test(def[1])) {
        const term = def[1].trim().replace(/^(?:the|a|an)\s+/i, '');
        if (term && wordCount(term) <= 5 && !/[,;]$/.test(term)) {
          found.push({ at: i, pair: [upperFirst(term), upperFirst(def[2].trim())], idx: [i] });
          subject = def[1].trim();
          continue;
        }
      }
      const fact = factFromSentence(sentence, subject);
      if (fact) {
        found.push({ at: i, pair: fact.pair, idx: [i] });
        subject = fact.subject;
        continue;
      }
      const blank = blankKeyFact(sentence);
      if (blank) found.push({ at: i, pair: blank, idx: [i] });
    }
  });
  return found;
}

// Fill-in-the-blank cards from long sentences.
function findBlankSentences(lines, taken, room) {
  const found = [];
  lines.forEach((line, i) => {
    if (taken.has(i)) return;
    for (const raw of line.split(/(?<=[.?!])\s+/)) {
      const sentence = clean(raw);
      if (found.length >= room) return;
      if (sentence.length <= 25 || sentence.length >= 240) continue;
      const words = sentence.split(/\s+/).filter((w) => w.replace(/[.,!?]/g, '').length > 5);
      if (words.length === 0) continue;
      const target = words[Math.floor(words.length / 2)];
      found.push({ at: i, pair: [sentence.replace(target, '_____'), target.replace(/[.,!?]$/, '')], idx: [i] });
    }
  });
  return found;
}

export function generateCards(text, maxCards = 100) {
  const lines = cleanNotes(text)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map(clean)
    .filter(Boolean);

  // Q/A pairs first, so "Q: ..." isn't mistaken for "Term: definition".
  const qa = findQuestionPairs(lines);
  const qaTaken = new Set(qa.flatMap((e) => e.idx));

  // Term/definition lines. If that finds few cards, try alternating lines
  // instead (only then, so mixed notes don't get mispaired).
  let terms = findTermPairs(lines, qaTaken);
  if (qa.length + terms.length < Math.max(3, lines.length / 4)) {
    const alt = findAlternatingPairs(lines, qaTaken);
    if (alt.length > terms.length) terms = alt;
  }

  let entries = [...qa, ...terms];
  const taken = () => new Set(entries.flatMap((e) => e.idx));

  // Lines written as sentences: definitions, facts, and key-fact blanks.
  entries.push(...findProseCards(lines, taken()));

  // Still thin: other long sentences become fill-in-the-blanks.
  if (entries.length < 5) entries.push(...findBlankSentences(lines, taken(), maxCards - entries.length));

  // Keep notes in the order they were written, drop duplicate fronts, apply the cap.
  entries.sort((a, b) => a.at - b.at);
  const seen = new Set();
  const unique = entries.filter(({ pair: [front] }) => {
    const key = front.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, maxCards).map(({ pair: [front, back] }, i) => ({
    id: Date.now() + i,
    front,
    back,
    mastered: false,
  }));
}
