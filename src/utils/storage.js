// storage.js
//
// Saves and loads the app's data (subjects -> classes -> sets -> cards) in the
// browser's local storage, so study sets and mastered cards survive a refresh.
//
// Everything stays on this device and in this browser. Nothing is sent anywhere.
// Clearing the site's data, using a private window, or switching browsers means
// starting fresh from the sample data.
//
// Safety: saved data is checked before it is used. If it is missing, damaged, or
// from a different version, the app falls back to the sample data instead of
// crashing. Saving can fail (storage full, blocked by the browser); that never
// throws, and getSaveFailed() lets the app show a warning.

export const STORAGE_KEY = 'studyo:data';
export const STORAGE_VERSION = 1;

// Whether the most recent save failed. Kept outside React so a hook can
// subscribe to it (see usePersistentSubjects.js).
let saveFailed = false;
const listeners = new Set();

function setSaveFailed(value) {
  if (saveFailed === value) return;
  saveFailed = value;
  listeners.forEach((listener) => listener());
}

export const getSaveFailed = () => saveFailed;

export function subscribeToSaveStatus(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

function isValidCard(card) {
  return isObject(card) && typeof card.front === 'string' && typeof card.back === 'string'
    && typeof card.mastered === 'boolean' && card.id !== undefined;
}

function isValidSet(set) {
  return isObject(set) && set.id !== undefined && typeof set.title === 'string'
    && Array.isArray(set.cards) && set.cards.every(isValidCard);
}

function isValidClass(cls) {
  return isObject(cls) && cls.id !== undefined && typeof cls.name === 'string'
    && Array.isArray(cls.sets) && cls.sets.every(isValidSet);
}

function isValidSubject(subject) {
  return isObject(subject) && subject.id !== undefined && typeof subject.name === 'string'
    && Array.isArray(subject.classes) && subject.classes.every(isValidClass);
}

// True when "data" has the shape the app expects.
export const isValidSubjects = (data) => Array.isArray(data) && data.length > 0 && data.every(isValidSubject);

// Returns the saved subjects, or the result of getDefaults() if nothing usable is saved.
export function loadSubjects(getDefaults) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaults();
    const saved = JSON.parse(raw);
    if (isObject(saved) && saved.version === STORAGE_VERSION && isValidSubjects(saved.subjects)) {
      return saved.subjects;
    }
  } catch {
    // Storage blocked, or the saved text isn't valid JSON: use the defaults.
  }
  return getDefaults();
}

// Saves the subjects. Returns true if it worked, false if it didn't.
export function saveSubjects(subjects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, subjects }));
    setSaveFailed(false);
    return true;
  } catch {
    setSaveFailed(true); // storage full or blocked
    return false;
  }
}

// Deletes the saved data (used by "Reset saved data").
export function clearSavedData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
  setSaveFailed(false);
}
