import { useState } from 'react';
import usePersistentSubjects from './hooks/usePersistentSubjects';
import Critters from './components/Critters';
import Stars from './components/Stars';
import Pomodoro from './components/Pomodoro';
import UploadModal from './components/UploadModal';
import FlashcardViewer from './components/FlashcardViewer';
import QuizView from './components/QuizView';
import MatchGame from './components/MatchGame';
import SiteNav from './components/SiteNav';
import HomeSections from './components/HomeSections';
import { generateCards } from './utils/generateCards';
import './Layout.css';

// True for dark card colors, so their text can switch to white.
function isDark(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

// Formats a set count for display, e.g. 1 -> "1 set", 3 -> "3 sets".
const setCount = (n) => `${n} ${n === 1 ? 'set' : 'sets'}`;

// App.jsx
//
// The main component and central hub of Studyo. It holds all app data
// (subjects -> classes -> study sets -> cards) and decides which screen to show:
//   1. Subjects grid (homepage)
//   2. Classes in the selected subject
//   3. Study sets in the selected class
//   4. Flashcard or quiz mode for the selected set
// The Pomodoro timer stays visible on every screen.
// On the subjects screen the page continues below the grid with HomeSections
// (how it works, progress, the pod). SiteNav is the top bar.
// Each study set has three ways to study: Flashcards, Quiz and Match (a pairing game).
//
// Data is saved in this browser's local storage, so it survives a refresh. It stays
// on this device and browser; there are no accounts or syncing yet.

function App() {
  // All study data. It is saved in this browser (see usePersistentSubjects) and starts
  // from the built-in subjects/classes and two sample biology sets (data/defaultSubjects.js).
  const [subjects, setSubjects, { saveFailed, resetSubjects }] = usePersistentSubjects();

  // Navigation state: which subject, class, set and study mode are open (null = none).
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [activeSetId, setActiveSetId] = useState(null);
  const [activeMode, setActiveMode] = useState(null); // 'flashcards' | 'quiz' | 'match' | null
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [podOpen, setPodOpen] = useState(false); // full-screen timer on phones

  // Look up the full objects for the selected IDs.
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || null;
  const selectedClass = selectedSubject
    ? selectedSubject.classes.find(c => c.id === selectedClassId) || null
    : null;
  const activeSet = selectedClass
    ? selectedClass.sets.find(s => s.id === activeSetId) || null
    : null;

  // Back-navigation helpers: each one clears the selections below its level.
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

  // Top bar and footer links: jump to a section of the homepage.
  // If a class or study screen is open, go back to the subjects first.
  function goToSection(id) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = reduceMotion ? 'auto' : 'smooth';
    const scroll = () => {
      if (id === 'top') {
        window.scrollTo({ top: 0, behavior });
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
      }
    };
    if (selectedSubjectId !== null) {
      goToSubjects();
      setTimeout(scroll, 50); // wait for the homepage to render
    } else {
      scroll();
    }
  }

  // Replaces the study sets of the currently selected class.
  // Copies objects instead of changing them, so React notices the update.
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

  // Called by UploadModal: turns the notes into cards and adds a new set to the class.
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

  // Called by FlashcardViewer when a card is marked mastered/still learning.
  function handleUpdateCards(updatedCards) {
    if (!activeSet) return;
    const newSets = selectedClass.sets.map(s =>
      s.id === activeSet.id ? { ...s, cards: updatedCards } : s
    );
    updateClassSets(newSets);
  }

  // "Reset saved data" in the footer: delete the saved copy and start over from the samples.
  function handleResetData() {
    if (!window.confirm('Reset everything back to the sample data? Your subjects, sets and progress on this device will be erased.')) return;
    resetSubjects();
    goToSubjects();
    window.scrollTo({ top: 0 });
  }

  // Color used for headers and cards: the class color, then subject color, then default blue.
  const accentColor = selectedClass?.color || selectedSubject?.color || '#5BC0EB';

  return (
    <div className="app">
      <SiteNav onNavigate={goToSection} />
      <main className={`main main--wide${selectedSubject === null ? ' has-stars' : ''}`}>
        {saveFailed && (
          <p className="save-warning" role="alert">
            Couldn&rsquo;t save to this browser (storage is full or blocked), so your changes will be lost if you refresh.
          </p>
        )}
        {/* Dome of twinkling stars over the headline, on the homepage only */}
        {selectedSubject === null && <Stars />}
        <h2 className="title">
          Stay{" "}
          <span className="marker-circle">
            studious
            <svg viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">
              <path
                pathLength="1"
                d="M 34 14 C 85 1, 172 3, 192 28 C 206 52, 150 76, 96 75 C 40 74, 2 60, 8 38 C 12 20, 48 9, 78 7"
              />
            </svg>
          </span>{" "}
          with Studyo
        </h2>
        <p className="subtitle">Create flashcards, mock quizzes and more</p>

        <div className="home-layout">
          <section className="subjects-section" id="subjects">
            {selectedSubject === null ? (
              <>
                <div className="subjects-header">
                  <h3 className="subjects-title">My subjects</h3>
                </div>
                <p className="subjects-hint">Pick a subject, add your notes, and start studying.</p>
                <div className="subjects-grid">
                  {subjects.map(subject => {
                    const sets = subject.classes.reduce((n, c) => n + c.sets.length, 0);
                    return (
                      <div
                        key={subject.id}
                        className={`subject-card${isDark(subject.color) ? ' is-dark' : ''}`}
                        style={{ background: subject.color }}
                        onClick={() => setSelectedSubjectId(subject.id)}
                      >
                        <div className="subject-emoji">{subject.emoji}</div>
                        <h4 className="subject-name">{subject.name}</h4>
                        <p className="subject-meta">{setCount(sets)}</p>
                      </div>
                    );
                  })}
                  <button className="subject-card new-subject-tile">
                    <span className="new-subject-plus" aria-hidden="true">+</span>
                    <span className="subject-name">New subject</span>
                  </button>
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
                  {selectedSubject.classes.map(cls => {
                    const color = cls.color || selectedSubject.color;
                    return (
                      <div
                        key={cls.id}
                        className={`subject-card${isDark(color) ? ' is-dark' : ''}`}
                        style={{ background: color }}
                        onClick={() => setSelectedClassId(cls.id)}
                      >
                        <div className="subject-emoji">{cls.emoji}</div>
                        <h4 className="subject-name">{cls.name}</h4>
                        <p className="subject-meta">{setCount(cls.sets.length)}</p>
                      </div>
                    );
                  })}
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
            ) : activeSet && activeMode === 'match' ? (
              <MatchGame set={activeSet} color={accentColor} onExit={goToSets} />
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
                  <button className="pomodoro-button" onClick={() => setPodOpen(true)}>
                    ⏱ Pomodoro Timer
                  </button>
                </div>
                <p className="upload-hint">
                  Upload a .txt, .md or .pdf file, or paste notes and Studyo will generate flashcards and quiz questions.
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
                            <button
                              className="set-action-button"
                              onClick={() => { setActiveSetId(set.id); setActiveMode('match'); }}
                            >
                              Match
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

          {/* Stays on every screen so the timer keeps running while you study */}
          <aside className="home-side">
            <Pomodoro open={podOpen} onOpenChange={setPodOpen} />
          </aside>
        </div>

        {/* Explanation, progress and pod info; the homepage only */}
        {selectedSubject === null && (
          <HomeSections subjects={subjects} onNavigate={goToSection} onReset={handleResetData} />
        )}
      </main>

      <Critters />

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
