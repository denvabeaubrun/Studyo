// generateCards.js
//
// Turns raw notes text into flashcards.
//
// TODO (real AI generation):
// Replace the body of this function with a call to your backend/serverless
// proxy, which itself calls the Anthropic API. Do NOT call
// https://api.anthropic.com directly from this client-side code in the
// deployed app — that would require embedding an API key in the bundle,
// which anyone can read from dev tools. A tiny serverless function
// (Vercel, Netlify, Cloudflare Workers, etc.) that holds the key and
// forwards the notes text is the safe version of this.
//
// Expected real flow:
//   const res = await fetch('/api/generate-cards', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ notes: text })
//   });
//   const { cards } = await res.json();
//   return cards;
//
// For now, this uses two simple heuristics so the app works end-to-end
// without a backend:
//   1. Lines shaped like "Term: definition" become front/back cards.
//   2. If there aren't enough of those, longer sentences get turned into
//      cloze ("fill in the blank") cards by hiding one key word.

export function generateCards(text, maxCards = 12) {
  const cards = [];

  const lines = text
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (cards.length >= maxCards) break;
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0 && colonIndex < line.length - 1) {
      const front = line.slice(0, colonIndex).trim();
      const back = line.slice(colonIndex + 1).trim();
      if (front.length > 1 && back.length > 1 && front.length < 80) {
        cards.push({ front, back });
      }
    }
  }

  if (cards.length < 5) {
    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 25 && s.length < 240);

    for (const sentence of sentences) {
      if (cards.length >= maxCards) break;
      const words = sentence.split(/\s+/).filter(w => w.replace(/[.,!?]/g, '').length > 5);
      if (words.length === 0) continue;
      const targetWord = words[Math.floor(words.length / 2)];
      const cleanTarget = targetWord.replace(/[.,!?]$/, '');
      const clozed = sentence.replace(targetWord, '_____');
      cards.push({ front: clozed, back: cleanTarget });
    }
  }

  return cards.map((c, i) => ({
    id: Date.now() + i,
    front: c.front,
    back: c.back,
    mastered: false
  }));
}
