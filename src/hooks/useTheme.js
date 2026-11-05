// useTheme.js
//
// Light or dark mode. Returns [theme, toggleTheme] where theme is 'light' or 'dark'.
//
//   - With no saved choice, it follows the device's setting and updates if the
//     device switches (for example, automatic dark mode at night).
//   - Using the switch saves the choice in this browser (local storage), and from
//     then on the device setting is ignored.
//
// The theme is applied as data-theme on <html>; the colors are in theme.css.
// index.html applies the same rule before React loads, so there is no flash.

import { useCallback, useEffect, useState } from 'react';

const KEY = 'studyo-theme';

function readSaved() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null; // storage blocked
  }
}

const deviceTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export default function useTheme() {
  const [saved, setSaved] = useState(readSaved);
  const [device, setDevice] = useState(deviceTheme);
  const theme = saved || device;

  // Follow the device setting while there is no saved choice.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setDevice(media.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setSaved(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Not saved; the switch still works until the page is closed.
    }
  }, [theme]);

  return [theme, toggleTheme];
}
