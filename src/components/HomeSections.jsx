// HomeSections.jsx
//
// The sections under the subjects grid on the homepage:
//   1. How it works  - three short steps
//   2. Your progress - cards mastered, overall and per subject (from real data)
//   3. Meet the pod  - what the Pomodoro timer does
//   4. A slim footer with links back up the page
//
// Props:
//   subjects          - the subjects array from App.jsx (subjects -> classes -> sets -> cards)
//   onNavigate(id)    - scrolls to a section; same function the top bar uses
//   onReset()         - the footer's "Reset saved data" button
//   onDownload()      - the footer's "Download my data" button

import { useEffect, useRef } from 'react';
import './HomeSections.css';

const STEPS = [
  { emoji: '📝', title: 'Upload your notes', text: 'Paste notes or drop in a .txt or .md file for any class.' },
  { emoji: '🃏', title: 'Get flashcards', text: 'Studyo turns your notes into a set of flashcards and quiz questions.' },
  { emoji: '🎯', title: 'Study your way', text: 'Flip cards, take a quiz, and track what you\u2019ve mastered.' },
];

const POD_FEATURES = [
  { emoji: '⏱', text: '25-minute focus sessions with short and long breaks' },
  { emoji: '🌧', text: 'Rain, brown noise, or your own songs' },
  { emoji: '🔄', text: 'Drag around the click wheel to change the volume' },
];

// Fades each .reveal element in the first time it scrolls into view.
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const items = ref.current ? ref.current.querySelectorAll('.reveal') : [];
    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return ref;
}

// Small drawing of the pod for the "Meet the pod" section.
function MiniPod() {
  return (
    <svg className="mini-pod" viewBox="0 0 160 250" aria-hidden="true">
      <rect x="6" y="6" width="148" height="238" rx="22" fill="#1a1a1a" />
      <rect x="2" y="2" width="148" height="238" rx="22" fill="#5bc0eb" stroke="#1a1a1a" strokeWidth="3" />
      <rect x="18" y="20" width="116" height="88" rx="8" fill="#d7e3dc" stroke="#1a1a1a" strokeWidth="3" />
      <text x="76" y="72" textAnchor="middle" fontSize="30" fontWeight="800" fill="#18261f" fontFamily="inherit">25:00</text>
      <rect x="30" y="86" width="92" height="7" rx="3.5" fill="none" stroke="#18261f" strokeWidth="2" />
      <rect x="30" y="86" width="38" height="7" rx="3.5" fill="#18261f" />
      <circle cx="80" cy="178" r="48" fill="#1a1a1a" />
      <circle cx="76" cy="174" r="48" fill="#ffffff" stroke="#1a1a1a" strokeWidth="3" />
      <circle cx="76" cy="174" r="17" fill="#fff8f0" stroke="#1a1a1a" strokeWidth="3" />
      <path d="M 71 166 L 84 174 L 71 182 Z" fill="#1a1a1a" />
      <text x="76" y="143" textAnchor="middle" fontSize="9" fontWeight="800" fill="#1a1a1a" fontFamily="inherit">MENU</text>
    </svg>
  );
}

// Cards mastered per subject, only for subjects that have cards.
function getProgress(subjects) {
  return subjects
    .map(subject => {
      const cards = subject.classes.flatMap(cls => cls.sets.flatMap(set => set.cards));
      return {
        id: subject.id,
        name: subject.name,
        emoji: subject.emoji,
        color: subject.color,
        done: cards.filter(card => card.mastered).length,
        total: cards.length,
      };
    })
    .filter(row => row.total > 0);
}

const percent = (done, total) => Math.round((done / total) * 100);

function HomeSections({ subjects, onNavigate, onReset, onDownload }) {
  const ref = useReveal();
  const rows = getProgress(subjects);
  const totalDone = rows.reduce((sum, row) => sum + row.done, 0);
  const totalCards = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="home-sections" ref={ref}>
      <section className="hs-section hs-plain" aria-labelledby="how-it-works">
        <p className="hs-kicker reveal">How it works</p>
        <h3 className="hs-heading reveal" id="how-it-works">From notes to studying in three steps</h3>
        <ol className="hs-steps">
          {STEPS.map((step, i) => (
            <li className="hs-step reveal" style={{ '--i': i }} key={step.title}>
              <span className="hs-step-num">{i + 1}</span>
              <span className="hs-step-emoji" aria-hidden="true">{step.emoji}</span>
              <h4>{step.title}</h4>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="hs-section hs-plain" aria-labelledby="progress">
        <p className="hs-kicker reveal">Your progress</p>
        <h3 className="hs-heading reveal" id="progress">What you&rsquo;ve mastered so far</h3>
        {totalCards === 0 ? (
          <div className="hs-track-empty">
            No cards yet. Upload notes to a class and your progress shows up here.
          </div>
        ) : (
          <div className="hs-track-wrap">
            <div className="hs-track-total">
              <div className="hs-track-big">
                <strong>{percent(totalDone, totalCards)}%</strong>
                <span>{totalDone} of {totalCards} cards mastered</span>
              </div>
              <div
                className="hs-prog-track"
                role="progressbar"
                aria-label="Overall cards mastered"
                aria-valuemin={0}
                aria-valuemax={totalCards}
                aria-valuenow={totalDone}
              >
                <div className="hs-prog-fill" style={{ width: `${percent(totalDone, totalCards)}%`, background: '#7dd3a0' }} />
              </div>
            </div>
            <div className="hs-prog-list">
              {rows.map(row => (
                <div className="hs-prog" key={row.id}>
                  <div className="hs-prog-top">
                    <span className="hs-prog-name">{row.emoji} {row.name}</span>
                    <span className="hs-prog-count">{row.done}/{row.total} mastered</span>
                  </div>
                  <div className="hs-prog-track">
                    <div className="hs-prog-fill" style={{ width: `${percent(row.done, row.total)}%`, background: row.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="hs-band hs-band--blue">
        <section className="hs-section hs-pod" aria-labelledby="meet-the-pod">
          <div className="hs-pod-art reveal reveal-left">
            <MiniPod />
          </div>
          <div className="hs-pod-text">
            <p className="hs-kicker reveal">Meet the pod</p>
            <h3 className="hs-heading reveal" id="meet-the-pod">A study timer that plays your music</h3>
            <ul className="hs-pod-list">
              {POD_FEATURES.map((item, i) => (
                <li className="reveal" style={{ '--i': i + 1 }} key={item.text}>
                  <span aria-hidden="true">{item.emoji}</span> {item.text}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <footer className="hs-footer">
        <span className="hs-footer-logo">📚 Studyo</span>
        <nav className="hs-footer-links" aria-label="Footer">
          <button type="button" onClick={() => onNavigate('subjects')}>Subjects</button>
          <button type="button" onClick={() => onNavigate('how-it-works')}>How it works</button>
          <button type="button" onClick={() => onNavigate('progress')}>Progress</button>
          <button type="button" onClick={() => onNavigate('meet-the-pod')}>The pod</button>
          <button type="button" onClick={onDownload}>Download my data</button>
          <button type="button" onClick={onReset}>Reset saved data</button>
        </nav>
        <p className="hs-privacy">
          🔒 <b>Your privacy:</b> Studyo has no accounts, ads or tracking. Your subjects, notes and
          progress are saved only in this browser on this device and are never sent to us. On a shared
          computer, use &ldquo;Reset saved data&rdquo; when you&rsquo;re done. YouTube songs in the timer
          load from YouTube in privacy-enhanced mode; Rain and Brown Noise are made in your browser.
        </p>
      </footer>
    </div>
  );
}

export default HomeSections;
