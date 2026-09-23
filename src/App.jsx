import { useState } from 'react';
import UploadModal from './components/UploadModal';
import FlashcardViewer from './components/FlashcardViewer';
import QuizView from './components/QuizView';
import { generateCards } from './utils/generateCards';

const sampleBiologyCards1 = [
  { id: 1001, front: 'Mitochondria', back: 'The powerhouse of the cell', mastered: true },
  { id: 1002, front: 'Cell membrane', back: 'Controls what enters and exits the cell', mastered: true },
  { id: 1003, front: 'Nucleus', back: 'Stores the cell\u2019s DNA and controls activity', mastered: false },
  { id: 1004, front: 'Ribosome', back: 'Builds proteins from amino acids', mastered: false },
];

const sampleBiologyCards2 = [
  { id: 2001, front: 'Allele', back: 'A version of a gene', mastered: true },
  { id: 2002, front: 'Genotype', back: 'The genetic makeup of an organism', mastered: false },
  { id: 2003, front: 'Phenotype', back: 'The observable traits of an organism', mastered: false },
];

function App() {
  const [subjects, setSubjects] = useState([
    {
      id: 1,
      name: 'Science',
      emoji: '🧬',
      color: '#7DD3A0',
      classes: [
        {
          id: 11, name: 'Biology', emoji: '🧬',
          sets: [
            { id: 111, title: 'Cell Bio Ch. 3', createdAt: '2026-09-10', cards: sampleBiologyCards1 },
            { id: 112, title: 'Genetics Ch. 5', createdAt: '2026-09-18', cards: sampleBiologyCards2 }
          ]
        },
        { id: 12, name: 'Chemistry', emoji: '🧪', color: '#5BC0EB', sets: [] },
        { id: 13, name: 'Physics', emoji: '⚛️', color: '#A78BFA', sets: [] },
        { id: 14, name: 'Astronomy', emoji: '🔭', color: '#475569', sets: [] }
      ]
    },
    {
      id: 2, name: 'Math', emoji: '🔢', color: '#5BC0EB',
      classes: [
        { id: 21, name: 'Geometry', emoji: '📐', sets: [] },
        { id: 22, name: 'Algebra', emoji: '🔢', sets: [] },
        { id: 23, name: 'Statistics', emoji: '📊', sets: [] },
        { id: 24, name: 'Calculus', emoji: '📈', sets: [] }
      ]
    },
    {
      id: 3, name: 'Social Studies', emoji: '📜', color: '#FBBF24',
      classes: [
        { id: 31, name: 'History', emoji: '🏛️', sets: [] },
        { id: 32, name: 'Geography', emoji: '🌍', sets: [] },
        { id: 33, name: 'Economics', emoji: '💰', sets: [] },
        { id: 34, name: 'Government', emoji: '🗳️', sets: [] }
      ]
    },
    {
      id: 4, name: 'English', emoji: '📖', color: '#bf2222',
      classes: [
        { id: 41, name: 'Literature', emoji: '📚', sets: [] },
        { id: 42, name: 'Writing', emoji: '✏️', sets: [] },
        { id: 43, name: 'Grammar', emoji: '🔤', sets: [] },
        { id: 44, name: 'Vocabulary', emoji: '📖', sets: [] }
      ]
    },
    {
      id: 5, name: 'Languages', emoji: '🌍', color: '#842570',
      classes: [
        { id: 51, name: 'Spanish', emoji: '🇪🇸', sets: [] },
        { id: 52, name: 'French', emoji: '🇫🇷', sets: [] },
        { id: 53, name: 'Mandarin', emoji: '🇨🇳', sets: [] },
        { id: 54, name: 'Japanese', emoji: '🇯🇵', sets: [] }
      ]
    }
  ]);

  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [activeSetId, setActiveSetId] = useState(null);
  const [activeMode, setActiveMode] = useState(null); // 'flashcards' | 'quiz' | null
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || null;
  const selectedClass = selectedSubject
    ? selectedSubject.classes.find(c => c.id === selectedClassId) || null
    : null;
  const activeSet = selectedClass
    ? selectedClass.sets.find(s => s.id === activeSetId) || null
    : null;

  function goToSubjects() {
    setSelectedSubjectId(null);
    setSelectedClassId(null);
    setActiveSetId(null);
    setActiveMode(null);
  }

  function goToClasses() {
    setSelectedClassId(null);
    setActiveSetId(null);
    setActiveMode(null);
  }

  function goToSets() {
    setActiveSetId(null);
    setActiveMode(null);
  }

  function updateClassSets(newSets) {
    setSubjects(prev =>
      prev.map(subject =>
        subject.id !== selectedSubjectId
          ? subject
          : {
              ...subject,
              classes: subject.classes.map(cls =>
                cls.id !== selectedClassId ? cls : { ...cls, sets: newSets }
              )
            }
      )
    );
  }

  function handleGenerate({ title, text }) {
    setIsGenerating(true);
    // Mock generation happens instantly; a real API call would be awaited here.
    // TODO: replace generateCards() with a call to your backend proxy for the
    // Anthropic API (see utils/generateCards.js for why it can't be called
    // directly from this client code).
    const cards = generateCards(text);
    const newSet = {
      id: Date.now(),
      title,
      createdAt: new Date().toISOString().slice(0, 10),
      cards
    };
    updateClassSets([...(selectedClass?.sets || []), newSet]);
    setIsGenerating(false);
    setShowUploadModal(false);
  }

  function handleUpdateCards(updatedCards) {
    if (!activeSet) return;
    const newSets = selectedClass.sets.map(s =>
      s.id === activeSet.id ? { ...s, cards: updatedCards } : s
    );
    updateClassSets(newSets);
  }

  const accentColor = selectedClass?.color || selectedSubject?.color || '#5BC0EB';

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">📚 Studyo</h1>
      </header>
      <main className="main">
        <h2 className="title">Stay studious with studyo</h2>
        <p className="subtitle">Create flascards, mock quizzes and more</p>
        <p className="subtitle">Pick a subject</p>
        <section className="subjects-section">
          {selectedSubject === null ? (
            <>
              <div className="subjects-header">
                <h3 className="subjects-title">My subjects</h3>
                <button className="new-subject-button">+ New Subject</button>
              </div>
              <div className="subjects-grid">
                {subjects.map(subject => (
                  <div
                    key={subject.id}
                    className="subject-card"
                    style={{ background: subject.color }}
                    onClick={() => setSelectedSubjectId(subject.id)}
                  >
                    <div className="subject-emoji">{subject.emoji}</div>
                    <h4 className="subject-name">{subject.name}</h4>
                  </div>
                ))}
              </div>
            </>
          ) : selectedClass === null ? (
            <>
              <div className="subjects-header">
                <button className="back-button" onClick={goToSubjects}>
                  ← Back to subjects
                </button>
              </div>
              <h3 className="subjects-title" style={{ marginBottom: '24px' }}>
                {selectedSubject.name} Classes
              </h3>
              <div className="subjects-grid">
                {selectedSubject.classes.map(cls => (
                  <div
                    key={cls.id}
                    className="subject-card"
                    style={{ background: cls.color || selectedSubject.color }}
                    onClick={() => setSelectedClassId(cls.id)}
                  >
                    <div className="subject-emoji">{cls.emoji}</div>
                    <h4 className="subject-name">{cls.name}</h4>
                  </div>
                ))}
              </div>
            </>
          ) : activeSet && activeMode === 'flashcards' ? (
            <FlashcardViewer
              set={activeSet}
              color={accentColor}
              onExit={goToSets}
              onUpdateCards={handleUpdateCards}
            />
          ) : activeSet && activeMode === 'quiz' ? (
            <QuizView set={activeSet} color={accentColor} onExit={goToSets} />
          ) : (
            <>
              <div className="subjects-header">
                <button className="back-button" onClick={goToClasses}>
                  ← Back to {selectedSubject.name}
                </button>
              </div>

              <div className="class-banner" style={{ background: accentColor }}>
                <div className="class-banner-emoji">{selectedClass.emoji}</div>
                <h3 className="class-banner-name">{selectedClass.name}</h3>
              </div>

              <div className="class-actions-row">
                <button className="upload-notes-button" onClick={() => setShowUploadModal(true)}>
                  ⬆ Upload Notes
                </button>
                <button className="pomodoro-button">
                  ⏱ Pomodoro Timer
                </button>
              </div>
              <p className="upload-hint">
                Upload a .txt/.md file or paste notes and Studyo will generate flashcards and quiz questions.
              </p>

              <div className="sets-header">
                <h4 className="sets-title">Study Sets</h4>
              </div>

              {selectedClass.sets.length === 0 ? (
                <div className="sets-empty">
                  <div className="sets-empty-emoji">📭</div>
                  <p className="sets-empty-text">No sets yet — upload your first notes to get started</p>
                </div>
              ) : (
                <div className="sets-list">
                  {selectedClass.sets.map(set => {
                    const cardCount = set.cards.length;
                    const mastered = set.cards.filter(c => c.mastered).length;
                    const percent = cardCount ? Math.round((mastered / cardCount) * 100) : 0;
                    return (
                      <div key={set.id} className="set-card">
                        <div className="set-card-main">
                          <h5 className="set-card-title">{set.title}</h5>
                          <p className="set-card-meta">
                            {cardCount} cards · {mastered}/{cardCount} mastered
                          </p>
                          <div className="set-progress-track">
                            <div
                              className="set-progress-fill"
                              style={{ width: `${percent}%`, background: accentColor }}
                            />
                          </div>
                        </div>
                        <div className="set-card-actions">
                          <button
                            className="set-action-button"
                            onClick={() => { setActiveSetId(set.id); setActiveMode('flashcards'); }}
                          >
                            Flashcards
                          </button>
                          <button
                            className="set-action-button"
                            onClick={() => { setActiveSetId(set.id); setActiveMode('quiz'); }}
                          >
                            Quiz
                          </button>
                          <button className="set-action-button" disabled title="Coming soon">
                            Game
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {showUploadModal && (
        <UploadModal
          color={accentColor}
          isGenerating={isGenerating}
          onClose={() => setShowUploadModal(false)}
          onGenerate={handleGenerate}
        />
      )}
    </div>
  );
}

export default App;
