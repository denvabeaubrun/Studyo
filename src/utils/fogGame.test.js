// fogGame.test.js
//
// Tests for the Brain Fog rules: building questions, scoring, the fog level, and the
// game reducer (every rule of how a game moves from question to question).
//
// Run with: npm test

import { describe, it, expect } from 'vitest';
import {
  buildQuestions, pointsFor, clearedPercent, fogTier, createGame, fogReducer,
  QUESTION_COUNT, TIME_LIMIT, MAX_OPTIONS,
} from './fogGame';

const card = (id, front, back) => ({ id, front, back, mastered: false });
const cards = [
  card(1, 'Mitochondria', 'The powerhouse of the cell'),
  card(2, 'Ribosome', 'Builds proteins'),
  card(3, 'Nucleus', 'Stores the DNA'),
  card(4, 'Cell membrane', 'Controls what enters the cell'),
  card(5, 'Chloroplast', 'Where photosynthesis happens'),
  card(6, 'Vacuole', 'Stores water and nutrients'),
];

// A tiny fixed game so the reducer tests don't depend on random shuffling.
// Every question's right answer is option 0.
function fixedGame(n = 4) {
  const questions = Array.from({ length: n }, (_, i) => ({
    id: i + 1, direction: 'term', prompt: `Term ${i + 1}`,
    options: ['right', 'wrong a', 'wrong b', 'wrong c'], correctIndex: 0,
    front: `Term ${i + 1}`, back: 'right',
  }));
  return createGame(questions);
}
const answer = (state, index) => fogReducer(state, { type: 'ANSWER', index });
const next = (state) => fogReducer(state, { type: 'NEXT' });

describe('buildQuestions', () => {
  it('asks about at most 10 cards, and every card at most once', () => {
    const many = Array.from({ length: 15 }, (_, i) => card(i, `Term ${i}`, `Definition ${i}`));
    const questions = buildQuestions(many);
    expect(questions).toHaveLength(QUESTION_COUNT);
    expect(new Set(questions.map((q) => q.id)).size).toBe(QUESTION_COUNT);
  });

  it('gives 4 different options with the right answer in them exactly once', () => {
    for (let i = 0; i < 50; i++) {
      for (const q of buildQuestions(cards)) {
        expect(q.options).toHaveLength(MAX_OPTIONS);
        expect(new Set(q.options.map((o) => o.toLowerCase())).size).toBe(MAX_OPTIONS);
        const answer = q.direction === 'term' ? q.back : q.front;
        expect(q.options[q.correctIndex]).toBe(answer);
        expect(q.options.filter((o) => o === answer)).toHaveLength(1);
      }
    }
  });

  it('shows the front as the prompt for "term" questions and the back for "definition" questions', () => {
    for (const q of buildQuestions(cards)) {
      expect(q.prompt).toBe(q.direction === 'term' ? q.front : q.back);
    }
  });

  it('asks in both directions', () => {
    const directions = new Set();
    for (let i = 0; i < 40; i++) buildQuestions(cards).forEach((q) => directions.add(q.direction));
    expect(directions).toEqual(new Set(['term', 'definition']));
  });

  it('uses fewer options when the set is small', () => {
    const questions = buildQuestions(cards.slice(0, 3));
    expect(questions).toHaveLength(3);
    questions.forEach((q) => expect(q.options).toHaveLength(3));
  });

  it('returns null for fewer than 2 different cards', () => {
    expect(buildQuestions([])).toBeNull();
    expect(buildQuestions([cards[0]])).toBeNull();
    expect(buildQuestions([card(1, 'Atom', 'Tiny'), card(2, 'Atom', 'Small')])).toBeNull();
  });

  it('does not change the cards it was given', () => {
    const copy = JSON.parse(JSON.stringify(cards));
    buildQuestions(cards);
    expect(cards).toEqual(copy);
  });
});

describe('pointsFor', () => {
  it('gives 1000 for an instant first answer and 500 at the buzzer', () => {
    expect(pointsFor(TIME_LIMIT, 1)).toBe(1000);
    expect(pointsFor(0, 1)).toBe(500);
  });

  it('gives about 750 for an answer halfway through the time', () => {
    expect(pointsFor(TIME_LIMIT / 2, 1)).toBe(750);
  });

  it('adds 50 per earlier right answer in the streak, up to +250', () => {
    expect(pointsFor(0, 2)).toBe(550);
    expect(pointsFor(0, 4)).toBe(650);
    expect(pointsFor(0, 6)).toBe(750);
    expect(pointsFor(0, 20)).toBe(750);
  });

  it('never goes outside the allowed range for odd times', () => {
    expect(pointsFor(-5, 1)).toBe(500);
    expect(pointsFor(TIME_LIMIT * 2, 1)).toBe(1000);
  });
});

describe('fog level', () => {
  it('converts fog to percent cleared', () => {
    expect(clearedPercent(100)).toBe(0);
    expect(clearedPercent(0)).toBe(100);
    expect(clearedPercent(33.4)).toBe(67);
  });

  it('gives a message for each range', () => {
    expect(fogTier(100)).toBe('Crystal clear!');
    expect(fogTier(90)).toBe('Crystal clear!');
    expect(fogTier(75)).toBe('Mostly clear');
    expect(fogTier(40)).toBe('Still hazy');
    expect(fogTier(10)).toBe('Thick fog. Try again!');
  });
});

describe('fogReducer', () => {
  it('starts with thick fog, no score, and the timer full', () => {
    const g = fixedGame();
    expect(g).toMatchObject({ phase: 'asking', fog: 100, score: 0, streak: 0, timeLeft: TIME_LIMIT, index: 0 });
  });

  it('scores a right answer by speed, and clears an equal share of fog', () => {
    const g = answer(fixedGame(4), 0);
    expect(g).toMatchObject({ phase: 'revealed', wasCorrect: true, lastPoints: 1000, score: 1000, streak: 1, correct: 1, fog: 75 });
  });

  it('scores less when the answer is slower', () => {
    let g = fixedGame(4);
    for (let i = 0; i < TIME_LIMIT / 2; i++) g = fogReducer(g, { type: 'TICK' });
    expect(answer(g, 0).lastPoints).toBe(750);
  });

  it('scores 0, breaks the streak, and lets half a share of fog creep back on a wrong answer', () => {
    let g = answer(fixedGame(4), 0); // right: fog 75
    g = answer(next(g), 1);          // wrong
    expect(g).toMatchObject({ wasCorrect: false, lastPoints: 0, streak: 0, bestStreak: 1, correct: 1 });
    expect(g.fog).toBeCloseTo(75 + 12.5);
    expect(g.score).toBe(1000);
  });

  it('keeps the best streak and builds the streak bonus', () => {
    let g = fixedGame(4);
    g = answer(g, 0);            // 1000
    g = answer(next(g), 0);      // 1000 + 50
    g = answer(next(g), 0);      // 1000 + 100
    expect(g.score).toBe(1000 + 1050 + 1100);
    expect(g.bestStreak).toBe(3);
  });

  it('counts a question as wrong when time runs out, with no answer picked', () => {
    let g = fixedGame(4);
    for (let i = 0; i < TIME_LIMIT; i++) g = fogReducer(g, { type: 'TICK' });
    expect(g).toMatchObject({ phase: 'revealed', picked: null, wasCorrect: false, lastPoints: 0, timeLeft: 0 });
    expect(g.missed).toHaveLength(1);
  });

  it('keeps a list of the cards that were missed', () => {
    let g = answer(fixedGame(3), 2);
    g = answer(next(g), 0);
    g = answer(next(g), 3);
    expect(g.missed.map((m) => m.id)).toEqual([1, 3]);
  });

  it('ignores answers and clock ticks once the question is finished', () => {
    const g = answer(fixedGame(4), 0);
    expect(answer(g, 1)).toBe(g);
    expect(fogReducer(g, { type: 'TICK' })).toBe(g);
  });

  it('ignores answers that are not one of the options', () => {
    const g = fixedGame(4);
    expect(answer(g, 4)).toBe(g);
    expect(answer(g, -1)).toBe(g);
    expect(answer(g, 1.5)).toBe(g);
  });

  it('does not move on until the answer has been shown', () => {
    const g = fixedGame(4);
    expect(next(g)).toBe(g);
  });

  it('moves to the next question with a full timer, then ends after the last one', () => {
    let g = answer(fixedGame(2), 0);
    g = next(g);
    expect(g).toMatchObject({ index: 1, phase: 'asking', timeLeft: TIME_LIMIT, picked: null });
    g = next(answer(g, 0));
    expect(g.phase).toBe('done');
  });

  it('clears all the fog on a perfect game, and never goes below 0 or above 100', () => {
    let g = fixedGame(3);
    for (let i = 0; i < 3; i++) g = next(answer(g, 0));
    expect(clearedPercent(g.fog)).toBe(100);
    expect(g.fog).toBeGreaterThanOrEqual(0);

    let bad = fixedGame(3);
    for (let i = 0; i < 3; i++) bad = next(answer(bad, 1));
    expect(bad.fog).toBe(100);
  });

  it('can be restarted with new questions', () => {
    const g = next(answer(fixedGame(2), 0));
    const again = fogReducer(g, { type: 'RESTART', questions: fixedGame(5).questions });
    expect(again).toMatchObject({ index: 0, score: 0, fog: 100, phase: 'asking' });
    expect(again.questions).toHaveLength(5);
  });
});
