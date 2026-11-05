// fogGame.js
//
// The rules for Brain Fog, a quiz game with a timer on every question.
//
// How it works:
//   - Up to 10 questions come from the study set. Each shows a term and asks for its
//     definition, or shows a definition and asks for its term (chosen at random).
//   - Every question has 4 answers (fewer if the set is small) and 15 seconds.
//   - A right answer scores 500 to 1000 points, more the faster you answer, plus a
//     streak bonus. A wrong answer or running out of time scores 0 and breaks the streak.
//   - The fog starts at 100%. Each right answer clears an equal share of it; each
//     wrong answer lets half a share creep back. At the end, less fog is better.
//
// The game state is handled by a reducer (a function from state + action to a new
// state), so every rule here is a plain function that can be tested without a screen.

import { pickDistinctCards, shuffle } from './matchGame';

export const QUESTION_COUNT = 10;
export const TIME_LIMIT = 150;      // per question, in tenths of a second (15.0 seconds)
export const TICK = 1;              // one tick = one tenth of a second
export const MAX_OPTIONS = 4;
export const MIN_CARDS = 2;         // a game needs at least this many different cards

// Builds the questions for a game from a set's cards.
// Each question: { id, direction, prompt, options, correctIndex, front, back }
//   direction 'term'       -> prompt is the card front, options are card backs
//   direction 'definition' -> prompt is the card back,  options are card fronts
// Returns null if the set has fewer than MIN_CARDS different cards.
export function buildQuestions(cards, count = QUESTION_COUNT) {
  const picked = pickDistinctCards(cards, count);
  if (picked.length < MIN_CARDS) return null;

  return picked.map((card) => {
    const direction = Math.random() < 0.5 ? 'term' : 'definition';
    const textOf = (c) => (direction === 'term' ? c.back : c.front);
    const answer = textOf(card);

    // Wrong answers come from the whole set, with no repeats and never the right answer.
    const seen = new Set([answer.trim().toLowerCase()]);
    const wrong = [];
    for (const other of shuffle(cards)) {
      const text = textOf(other);
      const key = text.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      wrong.push(text);
      if (wrong.length === MAX_OPTIONS - 1) break;
    }

    const options = shuffle([answer, ...wrong]);
    return {
      id: card.id,
      direction,
      prompt: direction === 'term' ? card.front : card.back,
      options,
      correctIndex: options.indexOf(answer),
      front: card.front,
      back: card.back,
    };
  });
}

// Points for a right answer. timeLeft is in tenths of a second; streak counts this
// answer (1 = first right answer in a row).
//   500 to 1000 for speed, plus 50 for each earlier right answer in the streak (up to +250).
export function pointsFor(timeLeft, streak) {
  const fraction = Math.min(1, Math.max(0, timeLeft / TIME_LIMIT));
  const speed = Math.round(500 + 500 * fraction);
  const bonus = 50 * Math.min(Math.max(streak - 1, 0), 5);
  return speed + bonus;
}

// The percent of fog cleared, 0 to 100, for a fog level (100 = thick fog).
export const clearedPercent = (fog) => Math.round(100 - fog);

// A short message for how much fog was cleared.
export function fogTier(cleared) {
  if (cleared >= 90) return 'Crystal clear!';
  if (cleared >= 60) return 'Mostly clear';
  if (cleared >= 30) return 'Still hazy';
  return 'Thick fog. Try again!';
}

// The starting state for a new game.
export function createGame(questions) {
  return {
    questions,
    index: 0,
    phase: 'asking',     // 'asking' (timer running) -> 'revealed' (answer shown) -> 'done'
    timeLeft: TIME_LIMIT,
    picked: null,        // the option chosen, or null (no answer yet or time ran out)
    wasCorrect: null,
    lastPoints: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    fog: 100,
    missed: [],          // cards answered wrong or too slowly: { id, front, back }
  };
}

// Finishes the current question. picked is the option index, or null for "time's up".
function resolveAnswer(state, picked) {
  const question = state.questions[state.index];
  const isCorrect = picked === question.correctIndex;
  const total = state.questions.length;
  const streak = isCorrect ? state.streak + 1 : 0;
  const points = isCorrect ? pointsFor(state.timeLeft, streak) : 0;

  return {
    ...state,
    phase: 'revealed',
    picked,
    wasCorrect: isCorrect,
    lastPoints: points,
    score: state.score + points,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    correct: state.correct + (isCorrect ? 1 : 0),
    fog: isCorrect ? Math.max(0, state.fog - 100 / total) : Math.min(100, state.fog + 50 / total),
    missed: isCorrect ? state.missed : [...state.missed, { id: question.id, front: question.front, back: question.back }],
  };
}

// Actions: { type: 'TICK' } | { type: 'ANSWER', index } | { type: 'NEXT' } | { type: 'RESTART', questions }
export function fogReducer(state, action) {
  switch (action.type) {
    case 'TICK': {
      if (state.phase !== 'asking') return state;
      const timeLeft = state.timeLeft - TICK;
      return timeLeft <= 0 ? resolveAnswer({ ...state, timeLeft: 0 }, null) : { ...state, timeLeft };
    }
    case 'ANSWER': {
      const question = state.questions[state.index];
      if (state.phase !== 'asking' || !Number.isInteger(action.index)
        || action.index < 0 || action.index >= question.options.length) return state;
      return resolveAnswer(state, action.index);
    }
    case 'NEXT': {
      if (state.phase !== 'revealed') return state;
      if (state.index + 1 >= state.questions.length) return { ...state, phase: 'done' };
      return {
        ...state,
        index: state.index + 1,
        phase: 'asking',
        timeLeft: TIME_LIMIT,
        picked: null,
        wasCorrect: null,
        lastPoints: 0,
      };
    }
    case 'RESTART':
      return createGame(action.questions);
    default:
      return state;
  }
}
