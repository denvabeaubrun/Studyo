// storage.test.js
//
// Tests for saving and loading the app's data in the browser's local storage.
// A small fake localStorage is used, so no browser is needed.
//
// Run with: npm test

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  STORAGE_KEY,
  clearSavedData,
  getSaveFailed,
  isValidSubjects,
  loadSubjects,
  saveSubjects,
} from './storage';
import { getDefaultSubjects } from '../data/defaultSubjects';

// A stand-in for localStorage that keeps everything in a plain object.
function fakeStorage() {
  const data = {};
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: (key) => { delete data[key]; },
  };
}

let storage;
beforeEach(() => {
  storage = fakeStorage();
  vi.stubGlobal('localStorage', storage);
  clearSavedData(); // also resets the "save failed" flag
});

describe('loadSubjects / saveSubjects', () => {
  it('returns the sample data when nothing has been saved', () => {
    expect(loadSubjects(getDefaultSubjects)).toEqual(getDefaultSubjects());
  });

  it('gives back exactly what was saved, including mastered cards', () => {
    const subjects = getDefaultSubjects();
    subjects[0].classes[0].sets[0].cards[2].mastered = true; // mark "Nucleus" as mastered
    expect(saveSubjects(subjects)).toBe(true);

    const loaded = loadSubjects(getDefaultSubjects);
    expect(loaded).toEqual(subjects);
    expect(loaded[0].classes[0].sets[0].cards[2].mastered).toBe(true);
  });

  it('keeps a new set that was added', () => {
    const subjects = getDefaultSubjects();
    subjects[1].classes[0].sets.push({
      id: 999, title: 'Triangles', createdAt: '2026-11-02',
      cards: [{ id: 1, front: 'Hypotenuse', back: 'Longest side of a right triangle', mastered: false }],
    });
    saveSubjects(subjects);
    expect(loadSubjects(getDefaultSubjects)[1].classes[0].sets[0].title).toBe('Triangles');
  });

  it('falls back to the sample data when the saved text is not valid JSON', () => {
    storage.setItem(STORAGE_KEY, '{ this is not json');
    expect(loadSubjects(getDefaultSubjects)).toEqual(getDefaultSubjects());
  });

  it('falls back to the sample data when the saved data has the wrong shape', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, subjects: [{ id: 1, name: 'Science' }] }));
    expect(loadSubjects(getDefaultSubjects)).toEqual(getDefaultSubjects());
  });

  it('falls back to the sample data when the saved version is different', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, subjects: getDefaultSubjects() }));
    expect(loadSubjects(getDefaultSubjects)).toEqual(getDefaultSubjects());
  });

  it('falls back to the sample data when reading storage throws (blocked by the browser)', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); } });
    expect(loadSubjects(getDefaultSubjects)).toEqual(getDefaultSubjects());
  });
});

describe('save failures', () => {
  it('does not throw when storage is full, and reports the failure', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError'); },
      removeItem: () => {},
    });
    expect(saveSubjects(getDefaultSubjects())).toBe(false);
    expect(getSaveFailed()).toBe(true);
  });

  it('clears the failure flag after a save works again', () => {
    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('full'); } });
    saveSubjects(getDefaultSubjects());
    expect(getSaveFailed()).toBe(true);

    vi.stubGlobal('localStorage', storage);
    saveSubjects(getDefaultSubjects());
    expect(getSaveFailed()).toBe(false);
  });
});

describe('clearSavedData', () => {
  it('removes the saved copy so the next load uses the sample data', () => {
    const subjects = getDefaultSubjects();
    subjects[0].classes[0].sets = [];
    saveSubjects(subjects);
    clearSavedData();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadSubjects(getDefaultSubjects)).toEqual(getDefaultSubjects());
  });
});

describe('isValidSubjects', () => {
  it('accepts the sample data', () => {
    expect(isValidSubjects(getDefaultSubjects())).toBe(true);
  });

  it('rejects things that are not a list of subjects', () => {
    expect(isValidSubjects(null)).toBe(false);
    expect(isValidSubjects([])).toBe(false);
    expect(isValidSubjects('subjects')).toBe(false);
  });

  it('rejects a card with the wrong types', () => {
    const subjects = getDefaultSubjects();
    subjects[0].classes[0].sets[0].cards[0].mastered = 'yes';
    expect(isValidSubjects(subjects)).toBe(false);
  });

  it('gives a fresh copy each time, so changing one does not change the next', () => {
    const first = getDefaultSubjects();
    first[0].classes[0].sets[0].cards[0].mastered = false;
    expect(getDefaultSubjects()[0].classes[0].sets[0].cards[0].mastered).toBe(true);
  });
});
