// FlashcardViewer.jsx
//
// Study mode: shows one card at a time. Click a card to flip it, use Prev/Next
// to move between cards, and mark each card "Got it" or "Still learning".
//
// Props:
//   set           - the study set being studied: { title, cards: [{ id, front, back, mastered }] }
//   color         - the class color, used for the card border and back
//   onExit        - called when the user clicks "Back"
//   onUpdateCards - called with the updated cards array whenever a card is marked,
//                   so App.jsx can save the new mastery status

import { useState } from 'react';

function FlashcardViewer({ set, color, onExit, onUpdateCards }) {
  const [index, setIndex] = useState(0);        // which card is showing
  const [flipped, setFlipped] = useState(false); // false = front, true = back

  const card = set.cards[index];
  const isLast = index === set.cards.length - 1;
  const masteredCount = set.cards.filter(c => c.mastered).length;

  // Move to the next/previous card, always showing its front first.
  function goNext() {
    if (isLast) return;
    setFlipped(false);
    setIndex(i => i + 1);
  }

  function goPrev() {
    if (index === 0) return;
    setFlipped(false);
    setIndex(i => i - 1);
  }

  // Save whether the current card is mastered (true) or still being learned (false),
  // then move on to the next card automatically.
  function markCard(mastered) {
    const updatedCards = set.cards.map((c, i) =>
      i === index ? { ...c, mastered } : c
    );
    onUpdateCards(updatedCards);
    if (!isLast) {
      goNext();
    } else {
      setFlipped(false);
    }
  }

  // Empty set: show a message instead of a card.
  if (!card) {
    return (
      <div className="study-screen">
        <button className="back-button" onClick={onExit}>← Back to {set.title}</button>
        <p className="sets-empty-text" style={{ marginTop: 24 }}>This set has no cards yet.</p>
      </div>
    );
  }

  return (
    <div className="study-screen">
      <div className="study-header">
        <button className="back-button" onClick={onExit}>← Back to {set.title}</button>
        <span className="study-progress-label">
          {index + 1} / {set.cards.length} · {masteredCount} mastered
        </span>
      </div>

      <div
        className={`flashcard ${flipped ? 'flashcard-flipped' : ''}`}
        style={{ borderColor: color }}
        onClick={() => setFlipped(f => !f)}
      >
        <div className="flashcard-face flashcard-front">
          <p className="flashcard-text">{card.front}</p>
          <span className="flashcard-hint">Tap to flip</span>
        </div>
        <div className="flashcard-face flashcard-back" style={{ background: color }}>
          <p className="flashcard-text">{card.back}</p>
        </div>
      </div>

      <div className="flashcard-nav-row">
        <button className="flashcard-nav-button" onClick={goPrev} disabled={index === 0}>
          ← Prev
        </button>
        <button className="flashcard-nav-button" onClick={goNext} disabled={isLast}>
          Next →
        </button>
      </div>

      <div className="flashcard-mark-row">
        <button className="mark-button mark-still-learning" onClick={() => markCard(false)}>
          Still learning
        </button>
        <button className="mark-button mark-got-it" onClick={() => markCard(true)}>
          Got it
        </button>
      </div>
    </div>
  );
}

export default FlashcardViewer;
