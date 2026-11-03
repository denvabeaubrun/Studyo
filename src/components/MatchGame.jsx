// MatchGame.jsx
//
// Match game: pair each term with its definition as fast as you can.
// A round has up to 6 cards from the study set. Terms are in the left column and
// definitions in the right. Click one tile, then a tile on the other side:
//   - right pair: both tiles turn green and stay matched
//   - wrong pair: both flash red for a moment and a mistake is counted
// The timer starts at the first click. The round ends when every pair is matched,
// and the time and mistakes are shown. "Play again" picks a new random round.
//
// The game does not change which cards are marked mastered.
//
// Props:
//   set    - the study set: { title, cards: [{ id, front, back }] }
//   color  - the class color, used to outline the selected tile
//   onExit - called when the user clicks "Back"
//
// Rules for building rounds and checking pairs are in utils/matchGame.js.

import { useEffect, useRef, useState } from 'react';
import { buildRound, isMatch, formatTime } from '../utils/matchGame';

const WRONG_FLASH_MS = 700;

function MatchGame({ set, color, onExit }) {
  const [round, setRound] = useState(() => buildRound(set.cards));
  const [selected, setSelected] = useState(null);      // the tile clicked first, or null
  const [matched, setMatched] = useState(() => new Set()); // card ids already paired
  const [wrong, setWrong] = useState(null);            // ids of two tiles flashing red, or null
  const [mistakes, setMistakes] = useState(0);
  const [started, setStarted] = useState(false);       // true after the first click
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState('');          // read aloud by screen readers
  const wrongTimer = useRef(null);

  const finished = round !== null && matched.size === round.pairs;

  // Count seconds while the round is running.
  useEffect(() => {
    if (!started || finished) return undefined;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [started, finished]);

  // Don't leave a pending timeout behind if the player leaves mid-flash.
  useEffect(() => () => clearTimeout(wrongTimer.current), []);

  if (round === null) {
    return (
      <div className="study-screen">
        <button className="back-button" onClick={onExit}>← Back to {set.title}</button>
        <p className="sets-empty-text" style={{ marginTop: 24 }}>
          Need at least 2 different cards in this set to play Match.
        </p>
      </div>
    );
  }

  function handleTile(tile) {
    if (wrong || matched.has(tile.cardId)) return; // ignore clicks while red tiles flash
    if (!started) setStarted(true);

    if (!selected) {
      setSelected(tile);
    } else if (selected.id === tile.id) {
      setSelected(null);                // clicking the same tile again un-selects it
    } else if (selected.side === tile.side) {
      setSelected(tile);                // switched to another tile on the same side
    } else if (isMatch(selected, tile)) {
      setMatched((prev) => new Set(prev).add(tile.cardId));
      setSelected(null);
      setMessage('Matched!');
    } else {
      setMistakes((m) => m + 1);
      setWrong([selected.id, tile.id]);
      setSelected(null);
      setMessage('Not a match, try again.');
      wrongTimer.current = setTimeout(() => setWrong(null), WRONG_FLASH_MS);
    }
  }

  function playAgain() {
    clearTimeout(wrongTimer.current);
    setRound(buildRound(set.cards));
    setSelected(null);
    setMatched(new Set());
    setWrong(null);
    setMistakes(0);
    setStarted(false);
    setSeconds(0);
    setMessage('');
  }

  if (finished) {
    return (
      <div className="study-screen">
        <button className="back-button" onClick={onExit}>← Back to {set.title}</button>
        <div className="quiz-results">
          <h3 className="quiz-results-title">All matched!</h3>
          <p className="quiz-results-score">
            {formatTime(seconds)} with {mistakes} {mistakes === 1 ? 'mistake' : 'mistakes'}
          </p>
          <button className="upload-notes-button" style={{ marginTop: 20 }} onClick={playAgain}>
            Play again
          </button>
        </div>
      </div>
    );
  }

  const renderTile = (tile) => {
    const isMatched = matched.has(tile.cardId);
    const isSelected = selected?.id === tile.id;
    const isWrong = wrong?.includes(tile.id);
    const classes = ['match-tile'];
    if (isMatched) classes.push('is-matched');
    if (isSelected) classes.push('is-selected');
    if (isWrong) classes.push('is-wrong');
    return (
      <button
        key={tile.id}
        type="button"
        className={classes.join(' ')}
        style={isSelected ? { borderColor: color, boxShadow: `0 0 0 3px ${color}` } : undefined}
        aria-pressed={isSelected}
        disabled={isMatched}
        onClick={() => handleTile(tile)}
      >
        {tile.text}
      </button>
    );
  };

  return (
    <div className="study-screen">
      <div className="study-header">
        <button className="back-button" onClick={onExit}>← Back to {set.title}</button>
        <span className="study-progress-label">
          {formatTime(seconds)} · {mistakes} {mistakes === 1 ? 'mistake' : 'mistakes'} · {matched.size}/{round.pairs} matched
        </span>
      </div>

      <p className="match-hint">Pick a term, then pick its definition.</p>

      <div className="match-board">
        <div className="match-column" aria-label="Terms">
          {round.terms.map(renderTile)}
        </div>
        <div className="match-column" aria-label="Definitions">
          {round.definitions.map(renderTile)}
        </div>
      </div>

      <p className="match-status" role="status" aria-live="polite">{message}</p>
    </div>
  );
}

export default MatchGame;
