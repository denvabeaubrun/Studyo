// FogGame.jsx
//
// Brain Fog: a timed quiz game. A grumpy fog cloud floats over a sunny sky. Answer
// each question before the timer runs out. Right answers earn points (more for fast
// answers and streaks) and clear the fog; wrong answers let it creep back.
// At the end you see your score, accuracy, best streak, and the cards you missed.
//
// Keyboard: press 1, 2, 3 or 4 to pick an answer.
// The game does not change which cards are marked mastered.
//
// Props:
//   set    - the study set: { title, cards: [{ id, front, back }] }
//   color  - the class color (used for the score badge)
//   onExit - called when the user clicks "Back"
//
// All the rules (questions, points, fog, how a game moves along) are in utils/fogGame.js.

import { useEffect, useReducer, useRef, useState } from 'react';
import {
  buildQuestions, clearedPercent, createGame, fogReducer, fogTier, TIME_LIMIT,
} from '../utils/fogGame';

const OPTION_COLORS = ['#7DD3A0', '#5BC0EB', '#FBBF24', '#F5B3E3'];

// The cloud and sky. The thicker the fog (0 to 100), the bigger and more solid the
// cloud, and the dimmer the sun. The cloud's face changes with the fog level.
function FogScene({ fog }) {
  const clarity = 1 - fog / 100;
  const scale = 0.55 + 0.45 * (fog / 100);
  const mood = fog > 66 ? 'grumpy' : fog > 33 ? 'worried' : 'calm';

  // The cloud is drawn twice: once as a thick dark outline, then the fill on top,
  // so the overlapping circles look like one outlined shape.
  const shapes = (fill, stroke) => (
    <g fill={fill} stroke={stroke} strokeWidth={stroke === 'none' ? 0 : 8} strokeLinejoin="round">
      <circle cx="124" cy="92" r="30" />
      <circle cx="160" cy="72" r="40" />
      <circle cx="198" cy="92" r="30" />
      <rect x="124" y="90" width="74" height="32" />
    </g>
  );

  return (
    <svg
      className="fog-svg"
      viewBox="0 0 320 150"
      role="img"
      aria-label={`Fog cloud, ${clearedPercent(fog)} percent cleared`}
    >
      <circle cx="264" cy="48" r="24" fill="#FBBF24" stroke="#1a1a1a" strokeWidth="3" opacity={0.2 + 0.8 * clarity} />
      <g
        className="fog-cloud"
        style={{ opacity: 0.35 + 0.65 * (fog / 100), transform: `translate(160px, 90px) scale(${scale}) translate(-160px, -90px)` }}
      >
        {shapes('#1a1a1a', '#1a1a1a')}
        {shapes('#C9C2E8', 'none')}
        <circle cx="146" cy="88" r="6" fill="#fff" stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="174" cy="88" r="6" fill="#fff" stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="147" cy="89" r="2.5" fill="#1a1a1a" />
        <circle cx="173" cy="89" r="2.5" fill="#1a1a1a" />
        {mood === 'grumpy' && <path d="M136 75 L153 82 M184 75 L167 82 M146 108 Q160 99 174 108" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" fill="none" />}
        {mood === 'worried' && <path d="M137 80 L153 75 M183 80 L167 75 M148 106 L172 106" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" fill="none" />}
        {mood === 'calm' && <path d="M146 102 Q160 113 174 102" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" fill="none" />}
      </g>
    </svg>
  );
}

// One game. It is remounted (see the key in FogGame) to start a new one.
function FogRound({ questions, set, color, onExit, onPlayAgain }) {
  const [game, dispatch] = useReducer(fogReducer, questions, createGame);
  const nextRef = useRef(null);
  const { phase } = game;

  // Run the clock (a tenth of a second at a time) while a question is open.
  useEffect(() => {
    if (phase !== 'asking') return undefined;
    const id = setInterval(() => dispatch({ type: 'TICK' }), 100);
    return () => clearInterval(id);
  }, [phase, game.index]);

  // Keys 1 to 4 pick an answer.
  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) dispatch({ type: 'ANSWER', index: n - 1 });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Move keyboard focus to "Next" once the answer is shown.
  useEffect(() => {
    if (phase === 'revealed') nextRef.current?.focus();
  }, [phase]);

  const total = game.questions.length;
  const cleared = clearedPercent(game.fog);

  if (phase === 'done') {
    return (
      <div className="study-screen">
        <button className="back-button" onClick={onExit}>← Back to {set.title}</button>
        <div className="quiz-results">
          <FogScene fog={game.fog} />
          <h3 className="quiz-results-title">{fogTier(cleared)}</h3>
          <p className="quiz-results-score">{game.score.toLocaleString()} points</p>
          <p className="fog-stats">
            {game.correct}/{total} correct · best streak {game.bestStreak} · {cleared}% of the fog cleared
          </p>

          {game.missed.length > 0 && (
            <div className="fog-review">
              <h4>Review these</h4>
              <ul>
                {game.missed.map((m) => (
                  <li key={m.id}><strong>{m.front}</strong>: {m.back}</li>
                ))}
              </ul>
            </div>
          )}

          <button className="upload-notes-button" style={{ marginTop: 20 }} onClick={onPlayAgain}>
            Play again
          </button>
        </div>
      </div>
    );
  }

  const question = game.questions[game.index];
  const revealed = phase === 'revealed';
  const secondsLeft = Math.ceil(game.timeLeft / 10);
  const rightAnswer = question.options[question.correctIndex];

  let feedback = '';
  if (revealed && game.wasCorrect) feedback = `Correct! +${game.lastPoints} points`;
  else if (revealed && game.picked === null) feedback = `Time's up! The answer was: ${rightAnswer}`;
  else if (revealed) feedback = `Not quite. The answer was: ${rightAnswer}`;

  return (
    <div className="study-screen fog-game">
      <div className="study-header">
        <button className="back-button" onClick={onExit}>← Back to {set.title}</button>
        <span className="study-progress-label">Question {game.index + 1}/{total}</span>
      </div>

      <div className="fog-scene">
        <FogScene fog={game.fog} />
        <div className="fog-meter">
          <span>Fog cleared</span>
          <div
            className="fog-meter-track"
            role="progressbar"
            aria-label="Fog cleared"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={cleared}
          >
            <div className="fog-meter-fill" style={{ width: `${cleared}%` }} />
          </div>
          <span>{cleared}%</span>
        </div>
      </div>

      <div className="fog-stat-row">
        <span className="fog-chip" style={{ background: color }}>{game.score.toLocaleString()} pts</span>
        <span className="fog-chip fog-chip--streak">🔥 Streak {game.streak}</span>
      </div>

      <div className="fog-timer">
        <div
          className={`fog-timer-fill${game.timeLeft <= TIME_LIMIT * 0.3 ? ' is-low' : ''}`}
          style={{ width: `${(game.timeLeft / TIME_LIMIT) * 100}%` }}
        />
        <span className="fog-timer-label">{secondsLeft}s</span>
      </div>

      <p className="fog-prompt-label">
        {question.direction === 'term' ? 'What does this mean?' : 'Which term fits this?'}
      </p>
      <h3 className="fog-prompt">{question.prompt}</h3>

      <div className="fog-options">
        {question.options.map((option, i) => {
          const classes = ['fog-option'];
          if (revealed && i === question.correctIndex) classes.push('is-correct');
          else if (revealed && i === game.picked) classes.push('is-wrong');
          else if (revealed) classes.push('is-dim');
          return (
            <button
              key={option}
              type="button"
              className={classes.join(' ')}
              style={{ background: OPTION_COLORS[i] }}
              disabled={revealed}
              onClick={() => dispatch({ type: 'ANSWER', index: i })}
            >
              <span className="fog-option-num">{i + 1}</span>
              <span className="fog-option-text">{option}</span>
              {revealed && i === question.correctIndex && <span className="fog-option-mark" aria-hidden="true">✓</span>}
              {revealed && i === game.picked && i !== question.correctIndex && <span className="fog-option-mark" aria-hidden="true">✗</span>}
            </button>
          );
        })}
      </div>

      <p className="fog-feedback" role="status" aria-live="polite">{feedback}</p>
      {revealed && (
        <button ref={nextRef} className="upload-notes-button fog-next" onClick={() => dispatch({ type: 'NEXT' })}>
          {game.index + 1 >= total ? 'See results' : 'Next question →'}
        </button>
      )}
    </div>
  );
}

function FogGame({ set, color, onExit }) {
  // "run" changes on Play again, which starts a fresh game with new questions.
  const [setup, setSetup] = useState(() => ({ run: 0, questions: buildQuestions(set.cards) }));

  if (setup.questions === null) {
    return (
      <div className="study-screen">
        <button className="back-button" onClick={onExit}>← Back to {set.title}</button>
        <p className="sets-empty-text" style={{ marginTop: 24 }}>
          Need at least 2 different cards in this set to play Brain Fog.
        </p>
      </div>
    );
  }

  return (
    <FogRound
      key={setup.run}
      questions={setup.questions}
      set={set}
      color={color}
      onExit={onExit}
      onPlayAgain={() => setSetup((s) => ({ run: s.run + 1, questions: buildQuestions(set.cards) }))}
    />
  );
}

export default FogGame;
