// SiteNav.jsx
//
// The sticky top bar. It has the logo, links that jump to sections of the
// homepage, and a Timer link that jumps to the pod section.
//
// Props:
//   onNavigate(id) - called with a section id ('top', 'subjects', 'how-it-works',
//                    'progress' or 'meet-the-pod'). App.jsx handles the scrolling,
//                    because it also has to leave a class or study screen first.
//
// The link for the section you are viewing is underlined. The bar gets a
// faint bottom line once the page has scrolled.
// The sun/moon button switches between light and dark mode (see hooks/useTheme.js).

import { useEffect, useState } from 'react';
import useTheme from '../hooks/useTheme';
import './SiteNav.css';

const LINKS = [
  { id: 'top', label: 'Home' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'progress', label: 'Progress' },
];

function SiteNav({ onNavigate }) {
  const [active, setActive] = useState('top');
  const [scrolled, setScrolled] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const dark = theme === 'dark';

  useEffect(() => {
    function update() {
      setScrolled(window.scrollY > 8);

      // The last section whose top has passed this line is the current one.
      const line = window.innerHeight * 0.35;
      let current = 'top';
      for (const { id } of LINKS.slice(1)) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      // The pod section has no link of its own (the Timer button points to it).
      const pod = document.getElementById('meet-the-pod');
      if (pod && pod.getBoundingClientRect().top <= line) current = '';
      setActive(current);
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <header className={`header${scrolled ? ' is-scrolled' : ''}`}>
      <nav className="snav" aria-label="Main">
        <h1 className="snav-brand">
          <button type="button" className="snav-logo" onClick={() => onNavigate('top')}>
            📚 Studyo
          </button>
        </h1>
        <div className="snav-links">
          {LINKS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`snav-link${active === id ? ' is-active' : ''}`}
              aria-current={active === id ? 'true' : undefined}
              onClick={() => onNavigate(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="snav-timer"
          aria-label="Go to the study timer"
          onClick={() => onNavigate('meet-the-pod')}
        >
          <span className="snav-dot" aria-hidden="true" />
          <span>Timer</span>
        </button>
        <button
          type="button"
          className="snav-theme"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={dark ? 'Light mode' : 'Dark mode'}
          onClick={toggleTheme}
        >
          <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
        </button>
      </nav>
    </header>
  );
}

export default SiteNav;
