import { useState } from 'react';
function App(){
const [subjects, setSubjects] = useState([
  { 
    id: 1, 
    name: 'Science', 
    emoji: '🧬', 
    color: '#7DD3A0',
    classes: [
      { id: 11, name: 'Biology', emoji: '🧬' },
      { id: 12, name: 'Chemistry', emoji: '🧪', color: '#5BC0EB'},
      { id: 13, name: 'Physics', emoji: '⚛️' , color:'#A78BFA'},
      { id: 14, name: 'Astronomy', emoji: '🔭', color: '#475569' }
    ]
  },
  { 
    id: 2, 
    name: 'Math', 
    emoji: '🔢', 
    color: '#5BC0EB',
    classes: [
      { id: 21, name: 'Geometry', emoji: '📐' },
      { id: 22, name: 'Algebra', emoji: '🔢' },
      { id: 23, name: 'Statistics', emoji: '📊' },
      { id: 24, name: 'Calculus', emoji: '📈' }
    ]
  },
  { 
    id: 3, 
    name: 'Social Studies', 
    emoji: '📜', 
    color: '#FBBF24',
    classes: [
      { id: 31, name: 'History', emoji: '🏛️' },
      { id: 32, name: 'Geography', emoji: '🌍' },
      { id: 33, name: 'Economics', emoji: '💰' },
      { id: 34, name: 'Government', emoji: '🗳️' }
    ]
  },
  { 
    id: 4, 
    name: 'English', 
    emoji: '📖', 
    color: '#bf2222',
    classes: [
      { id: 41, name: 'Literature', emoji: '📚' },
      { id: 42, name: 'Writing', emoji: '✏️' },
      { id: 43, name: 'Grammar', emoji: '🔤' },
      { id: 44, name: 'Vocabulary', emoji: '📖' }
    ]
  },
  { 
    id: 5, 
    name: 'Languages', 
    emoji: '🌍', 
    color: '#842570',
    classes: [
      { id: 51, name: 'Spanish', emoji: '🇪🇸' },
      { id: 52, name: 'French', emoji: '🇫🇷' },
      { id: 53, name: 'Mandarin', emoji: '🇨🇳' },
      { id: 54, name: 'Japanese', emoji: '🇯🇵' }
    ]
  }
]);
const[selectedSubject, setSelectedSubject] = useState(null);
 return(
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
            onClick={() => setSelectedSubject(subject)}
          >
            <div className="subject-emoji">{subject.emoji}</div>
            <h4 className="subject-name">{subject.name}</h4>
          </div>
        ))}
      </div>
    </>
  ) : (
    <>
      <div className="subjects-header">
        <button 
          className="back-button"
          onClick={() => setSelectedSubject(null)}
        >
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
          >
            <div className="subject-emoji">{cls.emoji}</div>
            <h4 className="subject-name">{cls.name}</h4>
          </div>
        ))}
      </div>
    </>
  )}
</section>
    </main>
  </div>
 );
}

export default App
