// noteFacts.js
//
// Turns notes written as ongoing sentences into study cards. This is for notes like
//
//   the american revolution was during 1775 to 1783 and it started because of taxes.
//   The Declaration of Independence was written by Thomas Jefferson.
//
// which have no "Term: definition" format. Each sentence (and each "..., and it ..."
// part of a sentence) is checked against common ways facts are written:
//
//   X was during / in / from <date>      ->  When was X?
//   X started / ended / happened in <date> -> When did X start? ...
//   X happened because (of) Y            ->  Why did X happen?          (back: Because of Y)
//   X was caused by Y                    ->  What caused X?
//   X led to / resulted in / caused Y    ->  What did X lead to?
//   X was written / led / invented by Y  ->  Who wrote X?
//   Thomas Edison invented the light bulb -> Who invented the light bulb?
//   X was located / fought / signed in Y ->  Where was X fought?
//   X is a / an / the / one of Y         ->  What is X?
//
// "it", "they", "he", "she" and "this" at the start of a sentence are read as the
// subject of the sentence before, so "...and it started because of taxes" becomes
// "Why did the american revolution start?".
//
// A sentence that matches none of these, but has a key fact in it (a year, a number,
// or a name), becomes a fill-in-the-blank card that hides that key fact.
//
// This is rule-based, not AI: it only understands these patterns, in English.

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const upperFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const trimEnd = (s) => s.replace(/[\s.,;:!]+$/, '').trim();
const words = (s) => s.split(/\s+/).filter(Boolean);

const MONTHS = 'january|february|march|april|may|june|july|august|september|october|november|december';
// Something that looks like a time: a year (1776, 44 BC), a decade (1920s),
// a century (18th century), or a month name.
const TIME = new RegExp(
  `\\b(?:\\d{3,4}s?|\\d{1,2}(?:st|nd|rd|th)\\s+century|(?:${MONTHS})|\\d+\\s*(?:bce?|ce|ad))\\b`,
  'i'
);

const PRONOUN = /^(?:it|they|he|she|this)$/i;
const NOT_A_SUBJECT = /^(?:there|here|which|what|who|we|you|i|one|some|many|most|each|all|both|if|when|because|so|but|then|also|that|these|those|its|their)\b/i;

// Turns "The American Revolution" into "the American Revolution" for use inside
// a question, but leaves names ("Thomas Jefferson") alone.
function subjectInQuestion(subject) {
  return subject.replace(/^(The|A|An)\b/, (w) => w.toLowerCase());
}

// Past-tense verb -> base form, for "Why did X <base>?".
const IRREGULAR = {
  began: 'begin', won: 'win', lost: 'lose', fell: 'fall', rose: 'rise', went: 'go',
  came: 'come', grew: 'grow', broke: 'break', fought: 'fight', led: 'lead', left: 'leave',
  made: 'make', took: 'take', became: 'become', ran: 'run', spread: 'spread', split: 'split',
  sank: 'sink', froze: 'freeze', shook: 'shake', drove: 'drive', gave: 'give', got: 'get',
  had: 'have', did: 'do', built: 'build', sent: 'send', held: 'hold', kept: 'keep',
};
const NEEDS_E = /(?:at|iz|is|uc|ag|ov|in|ur|os|rv|lv|ad|id|ud|us|ar|ir|ok|ng|il|ac|ip|ul|ut|sc|rg)$/;
export function baseForm(verb) {
  const v = verb.toLowerCase();
  if (IRREGULAR[v]) return IRREGULAR[v];
  if (!v.endsWith('ed')) return null;
  if (v.endsWith('ied')) return `${v.slice(0, -3)}y`;                   // tried -> try
  const stem = v.slice(0, -2);
  if (/([bdgklmnprt])\1$/.test(stem) && !/(ll|ss)$/.test(stem)) return stem.slice(0, -1); // stopped -> stop
  if (/ee$/.test(v.slice(0, -1))) return v.slice(0, -1);                // agreed -> agree
  if (NEEDS_E.test(stem) && !/(ain|ein|oin|eat|oat|ard|ord|ird|ourd|end)$/.test(stem)) {
    return `${stem}e`;                                                  // declined -> decline
  }
  return stem;                                                          // started -> start
}

// Past participle -> past tense, for "Who wrote X?" from "X was written by".
const PARTICIPLE_TO_PAST = {
  written: 'wrote', drawn: 'drew', given: 'gave', taken: 'took', begun: 'began', chosen: 'chose',
  sung: 'sang', driven: 'drove', spoken: 'spoke', known: 'knew', shown: 'showed', seen: 'saw',
};
const AGENT_PARTICIPLES = /^(?:led|founded|written|invented|discovered|signed|built|created|started|begun|won|fought|ruled|painted|designed|developed|proposed|written|drawn|composed|established|introduced|passed|defeated|conquered|explored|named|elected|assassinated|killed|formed|organized|organised|launched|ended|given|taken|chosen|issued|declared|published|produced|sung|directed)$/i;
const AGENT_VERBS = /^(?:invented|discovered|wrote|founded|led|signed|created|built|designed|developed|painted|proposed|defeated|ruled|explored|conquered|established|introduced|composed|published|wrote|formed|launched|declared|issued|assassinated|killed|named|directed|started)$/i;

// ---------------------------------------------------------------------------
// Splitting notes into sentences
// ---------------------------------------------------------------------------

// Splits a line into sentences, then splits "..., and it ..." style run-ons
// into separate parts, so each part can be a card.
// A word that makes a part read as its own clause ("and the war ENDED in 1783"),
// as opposed to a list ("between Britain and the colonies").
const HAS_VERB = /\b(?:is|are|was|were|has|have|had|did|does|do|will|can|could|would|\w+ed|began|won|lost|fell|rose|went|came|grew|broke|fought|led|left|made|took|became|ran|built|sent|held|kept|gave|got|takes|happens|occurs|means|causes)\b/i;
// Periods that don't end a sentence: initials ("F. Scott") and short titles ("Dr.").
const SENTENCE_END = /(?<=[.!?;])(?<!\b[A-Z]\.)(?<!\b(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc|Mt|Gen|Col|Lt|Sgt|Capt|No)\.)\s+/;

export function splitSentences(line) {
  return line
    .split(SENTENCE_END)
    .flatMap((s) => {
      const parts = s.split(/,?\s+(?:and|but|so|then)\s+(?=(?:it|they|he|she|this|then|the)\s)/i);
      // Only split where both sides have their own verb. Otherwise the "and" was
      // part of a list ("between Britain and the colonies"), so put the part back.
      const out = [];
      for (const part of parts) {
        const prev = out[out.length - 1];
        if (prev !== undefined && (!HAS_VERB.test(prev) || !HAS_VERB.test(part.replace(/^(?:it|they|he|she|this|then)\s/i, '')))) {
          out[out.length - 1] += ` and ${part}`;
        } else {
          out.push(part);
        }
      }
      return out;
    })
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ---------------------------------------------------------------------------
// Fact patterns
// ---------------------------------------------------------------------------

// Each pattern turns (subject, rest of the sentence) into [front, back], or null.
const SUBJECT = "([\\w'’()\\-][\\w'’()\\- ]{0,60}?)";

const WHEN_VERBS = {
  was: (s) => `When was ${s}?`,
  were: (s) => `When were ${s}?`,
  happened: (s) => `When did ${s} happen?`,
  'took place': (s) => `When did ${s} take place?`,
  occurred: (s) => `When did ${s} occur?`,
  began: (s) => `When did ${s} begin?`,
  started: (s) => `When did ${s} start?`,
  ended: (s) => `When did ${s} end?`,
  lasted: (s) => `When did ${s} take place?`,
  existed: (s) => `When did ${s} exist?`,
  happens: (s) => `When does ${s} happen?`,
  'takes place': (s) => `When does ${s} take place?`,
  occurs: (s) => `When does ${s} occur?`,
  lived: (s) => `When did ${s} live?`,
  ruled: (s) => `When did ${s} rule?`,
};
const WHEN = new RegExp(
  `^${SUBJECT}\\s+(was|were|happened|took place|occurred|began|started|ended|lasted|existed|lived|ruled|happens|takes place|occurs)\\s+((?:during|in|from|on|between|around|by|until|about|circa|c\\.)\\s+.+)$`,
  'i'
);
const WHEN_PASSIVE = new RegExp(
  `^${SUBJECT}\\s+(was|were)\\s+(signed|founded|built|written|invented|discovered|fought|declared|passed|ratified|established|formed|created|published|elected|born)\\s+((?:during|in|on|from|around|by|between)\\s+.+)$`,
  'i'
);
// Why: subject, verb, up to 8 more words, then "because".
const WHY = /^(.+?)\s+because\s+(of\s+)?(.+)$/i;
const ENDS_IN_DETERMINER = /\b(?:the|a|an|this|that|his|her|their|its|our|my|your|some|many)$/i;
const PAST_IRREGULAR = new RegExp(`^(?:${Object.keys(IRREGULAR).join('|')})$`, 'i');

// Splits "the colonists protested the taxes" into subject, verb and the rest,
// and builds "Why did the colonists protest the taxes?". Returns null if unsure.
function whyQuestion(clause) {
  const w = words(clause.replace(/\s+(?:mainly|mostly|partly|probably|only)$/i, ''));
  for (let n = 1; n < w.length && n <= 8; n++) {
    const subject = w.slice(0, n).join(' ');
    if (ENDS_IN_DETERMINER.test(subject)) continue;
    const verb = w[n];
    const rest = w.slice(n + 1);
    if (rest.length > 8) return null;
    const tail = rest.length ? ` ${rest.join(' ')}` : '';
    const s = subjectInQuestion(subject);
    if (/^(?:is|are|was|were)$/i.test(verb)) return { subject, front: `Why ${verb.toLowerCase()} ${s}${tail}?` };
    if (/^(?:has|have|had)$/i.test(verb) && rest[0] && /(?:ed|en|un|wn|ne)$/.test(rest[0])) {
      return { subject, front: `Why ${verb.toLowerCase()} ${s}${tail}?` };
    }
    if (PAST_IRREGULAR.test(verb) || /ed$/i.test(verb)) {
      const base = baseForm(verb);
      if (base) return { subject, front: `Why did ${s} ${base}${tail}?` };
    }
    // Present tense: "Gatsby throws" -> does ... throw; "cells divide" -> do ... divide
    if (n === 1 || /^(?:The|A|An)$/i.test(w[0])) {
      if (/[^s]s$/i.test(verb) && verb.length > 3) {
        const base = /(?:ches|shes|sses|xes|oes)$/i.test(verb) ? verb.slice(0, -2) : verb.slice(0, -1);
        return { subject, front: `Why does ${s} ${base.toLowerCase()}${tail}?` };
      }
      if (/s$/i.test(subject) && !/s$/i.test(verb) && /^[a-z]+$/.test(verb)) {
        return { subject, front: `Why do ${s} ${verb}${tail}?` };
      }
    }
  }
  return null;
}
const CAUSED_BY = new RegExp(`^${SUBJECT}\\s+(?:was|were)\\s+(?:mainly\\s+|mostly\\s+)?caused\\s+by\\s+(.+)$`, 'i');
const LED_TO = new RegExp(`^${SUBJECT}\\s+(led to|resulted in|caused|brought about|helped cause)\\s+(.+)$`, 'i');
const BY_AGENT = new RegExp(`^${SUBJECT}\\s+(?:was|were)\\s+(\\w+)\\s+by\\s+(.+)$`, 'i');
const WHERE = new RegExp(
  `^${SUBJECT}\\s+(is|are|was|were)\\s+(located|found|held|fought|signed|born|built|founded|based)\\s+(in|at|on|near)\\s+(.+)$`,
  'i'
);
const WHERE_EVENT = new RegExp(`^${SUBJECT}\\s+(took place|happened|occurred|takes place|happens|occurs)\\s+(in|at|on|near|inside)\\s+(.+)$`, 'i');
const WHAT_IS = new RegExp(`^${SUBJECT}\\s+(is|are|was|were)\\s+((?:a|an|the|one of the|one of)\\s+.{8,})$`, 'i');
// A name (each word capitalized) doing something: "Thomas Edison invented the light bulb".
const NAME_DID = /^((?:[A-Z][a-z'’.]+|[A-Z]\.)(?:\s+(?:[A-Z][a-z'’.]+|[A-Z]\.|of|de|da|van|von)){0,4})\s+(\w+)\s+(.{3,})$/;

function whenFront(verb, subject) {
  const make = WHEN_VERBS[verb.toLowerCase()];
  return make ? make(subject) : null;
}

// Tries every pattern on one sentence. Returns { subject, pair } or null.
// "subject" is remembered so the next sentence's "it" can refer to it.
export function factFromSentence(sentence, previousSubject) {
  let text = trimEnd(sentence);
  if (text.length < 12 || text.endsWith('?')) return null;

  // "it started because..." -> "<previous subject> started because..."
  const first = words(text)[0] || '';
  let resolved = null;
  if (PRONOUN.test(first)) {
    if (!previousSubject) return null;
    resolved = previousSubject;
    text = `${previousSubject} ${text.slice(first.length).trim()}`;
  } else if (NOT_A_SUBJECT.test(text)) {
    return null;
  }

  const ok = (subject) => {
    const s = subject.trim();
    const n = words(s).length;
    return n >= 1 && n <= 8 && !/[,;:]/.test(s) && !NOT_A_SUBJECT.test(s) && !PRONOUN.test(s);
  };
  const result = (subject, front, back) => ({
    subject: resolved || subject.trim(),
    pair: [upperFirst(front), upperFirst(trimEnd(back))],
  });

  let m;

  // Who: "X was written by Thomas Jefferson"
  if ((m = text.match(BY_AGENT)) && ok(m[1]) && AGENT_PARTICIPLES.test(m[2]) && !/^caused$/i.test(m[2])) {
    const participle = m[2].toLowerCase();
    const past = PARTICIPLE_TO_PAST[participle] || participle;
    if (!TIME.test(m[3]) || /[A-Z]/.test(m[3].charAt(0))) {
      return result(m[1], `Who ${past} ${subjectInQuestion(m[1].trim())}?`, m[3]);
    }
  }

  // What caused: "X was caused by Y"
  if ((m = text.match(CAUSED_BY)) && ok(m[1])) {
    return result(m[1], `What caused ${subjectInQuestion(m[1].trim())}?`, m[2]);
  }

  // Why: "X started because of Y", "Gatsby throws parties because he ..."
  if ((m = text.match(WHY))) {
    const why = whyQuestion(m[1]);
    if (why && ok(why.subject)) return result(why.subject, why.front, `Because ${m[2] ? 'of ' : ''}${m[3]}`);
  }

  // Effects: "X led to Y"
  if ((m = text.match(LED_TO)) && ok(m[1])) {
    const verb = m[2].toLowerCase();
    const ask = { 'led to': 'lead to', 'resulted in': 'result in', caused: 'cause', 'brought about': 'bring about', 'helped cause': 'help cause' }[verb];
    return result(m[1], `What did ${subjectInQuestion(m[1].trim())} ${ask}?`, m[3]);
  }

  // When: "X was during 1775 to 1783", "X was signed in 1776"
  if ((m = text.match(WHEN_PASSIVE)) && ok(m[1]) && TIME.test(m[4])) {
    return result(m[1], `When ${m[2].toLowerCase()} ${subjectInQuestion(m[1].trim())} ${m[3].toLowerCase()}?`, m[4]);
  }
  if ((m = text.match(WHEN)) && ok(m[1]) && TIME.test(m[3])) {
    const front = whenFront(m[2], subjectInQuestion(m[1].trim()));
    if (front) return result(m[1], front, m[3]);
  }

  // Where: "X was fought in Massachusetts"
  if ((m = text.match(WHERE)) && ok(m[1]) && !TIME.test(m[5])) {
    return result(m[1], `Where ${m[2].toLowerCase()} ${subjectInQuestion(m[1].trim())} ${m[3].toLowerCase()}?`, m[5]);
  }
  if ((m = text.match(WHERE_EVENT)) && ok(m[1]) && !TIME.test(m[4]) && /^(?:[A-Z]|the\s|a\s|an\s)/.test(m[4])) {
    const v = m[2].toLowerCase();
    const present = /s$|takes/.test(v);
    const verb = { 'took place': 'take place', happened: 'happen', occurred: 'occur', 'takes place': 'take place', happens: 'happen', occurs: 'occur' }[v];
    return result(m[1], `Where ${present ? 'does' : 'did'} ${subjectInQuestion(m[1].trim())} ${verb}?`, `${m[3]} ${m[4]}`);
  }

  // Who did it: "Thomas Edison invented the light bulb" (names only, from the original text)
  if (!resolved && (m = text.match(NAME_DID)) && AGENT_VERBS.test(m[2]) && words(m[1]).length >= 1 && !/^(The|A|An)$/.test(words(m[1])[0])) {
    return { subject: m[1], pair: [`Who ${m[2].toLowerCase()} ${trimEnd(m[3])}?`, m[1]] };
  }

  // What is: "The Magna Carta was a document that limited the king's power"
  if ((m = text.match(WHAT_IS)) && ok(m[1]) && !TIME.test(m[3].slice(0, 20))) {
    const verb = m[2].toLowerCase();
    return result(m[1], `What ${verb} ${subjectInQuestion(m[1].trim())}?`, m[3]);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Fill-in-the-blank on the key fact
// ---------------------------------------------------------------------------

// Finds the most useful thing to hide in a sentence: a date or number first,
// then a name (capitalized words that aren't the first word). Returns the
// text to hide, or null if there's nothing better than an ordinary word.
export function keyFact(sentence) {
  const year = sentence.match(/\b\d{1,4}\s*(?:bce?|ce|ad)\b|\b\d{3,4}s?\b(?:\s*(?:-|–|to)\s*\d{2,4})?|\b\d{1,2}(?:st|nd|rd|th)\s+century\b/i);
  if (year) return year[0];
  const number = sentence.match(/\b\d[\d,.]*\s*(?:%|percent|million|billion|thousand|km|miles|kg|years|people|soldiers)?/i);
  if (number && number[0].trim().length > 1) return number[0].trim();
  // A name: capitalized words, not counting the first word of the sentence.
  const rest = sentence.replace(/^\S+\s+/, ' ');
  const name = rest.match(/\s((?:[A-Z][a-z'’]+|[A-Z]{2,})(?:\s+(?:of\s+|de\s+|the\s+)?(?:[A-Z][a-z'’]+|[A-Z]{2,}))*)/);
  if (name && name[1].length > 2) return name[1];
  return null;
}

// Makes a fill-in-the-blank card that hides the key fact, or null.
export function blankKeyFact(sentence) {
  const s = trimEnd(sentence);
  if (s.length < 25 || s.length > 240) return null;
  const key = keyFact(s);
  if (!key) return null;
  return [`${upperFirst(s.replace(key, '_____'))}.`, key.trim()];
}
