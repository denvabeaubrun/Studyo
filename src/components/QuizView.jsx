import { useMemo, useState } from 'react';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(cards) {
  return cards.map(card => {
    const decoys = shuffle(cards.filter(c => c.id !== card.id))
      .slice(0, 3)
      .map(c => c.back);
    const options = shuffle([card.back, ...decoys]);
    return { id: card.id, prompt: card.front, correct: card.back, options };
  });
}

function QuizView({ set, color, onExit }) {
  const questions = useMemo(() => buildQuestions(set.cards), [set.cards]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length < 2) {
    return (
      <div className="study-screen">
        <button className="back-button" onClick={onExit}>← Back to {set.title}</button>
        <p className="sets-empty-text" style={{ marginTop: 24 }}>
          Need at least 2 cards in this set to build a quiz.
        </p>
      </div>
    );
  }

  const question = questions[index];
  const isLast = index === questions.length - 1;

  function handleSelect(option) {
    if (selected) return;
    setSelected(option);
    if (option === question.correct) setScore(s => s + 1);
  }

  function handleNext() {
    if (isLast) {
      setFinished(true);
      return;
    }
    setSelected(null);
    setIndex(i => i + 1);
  }

  if (finished) {
    return (
      <div className="study-screen">
        <button className="back-button" onClick={onExit}>← Back to {set.title}</button>
        <div className="quiz-results">
          <h3 className="quiz-results-title">Quiz complete!</h3>
          <p className="quiz-results-score">{score} / {questions.length} correct</p>
          <button
            className="upload-notes-button"
            style={{ marginTop: 20 }}
            onClick={() => { setIndex(0); setSelected(null); setScore(0); setFinished(false); }}
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-screen">
      <div className="study-header">
        <button className="back-button" onClick={onExit}>← Back to {set.title}</button>
        <span className="study-progress-label">
          Question {index + 1} / {questions.length} · Score {score}
        </span>
      </div>

      <div className="quiz-question-card" style={{ borderColor: color }}>
        <p className="quiz-question-text">{question.prompt}</p>
      </div>

      <div className="quiz-options">
        {question.options.map(option => {
          let optionClass = 'quiz-option';
          if (selected) {
            if (option === question.correct) optionClass += ' quiz-option-correct';
            else if (option === selected) optionClass += ' quiz-option-wrong';
          }
          return (
            <button
              key={option}
              className={optionClass}
              onClick={() => handleSelect(option)}
              disabled={!!selected}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selected && (
        <button className="upload-notes-button" style={{ marginTop: 20 }} onClick={handleNext}>
          {isLast ? 'See results' : 'Next question →'}
        </button>
      )}
    </div>
  );
}

export default QuizView;
