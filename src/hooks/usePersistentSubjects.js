// usePersistentSubjects.js
//
// Works like useState for the app's subjects, but the data is loaded from the
// browser's local storage on first load and saved again after every change.
//
// Returns [subjects, setSubjects, { saveFailed, resetSubjects }]
//   saveFailed      true when the last save didn't work (storage full or blocked)
//   resetSubjects() deletes the saved copy and goes back to the sample data

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getDefaultSubjects } from '../data/defaultSubjects';
import {
  clearSavedData,
  getSaveFailed,
  loadSubjects,
  saveSubjects,
  subscribeToSaveStatus,
} from '../utils/storage';

export default function usePersistentSubjects() {
  const [subjects, setSubjects] = useState(() => loadSubjects(getDefaultSubjects));
  const saveFailed = useSyncExternalStore(subscribeToSaveStatus, getSaveFailed, () => false);

  // Save after every change.
  useEffect(() => {
    saveSubjects(subjects);
  }, [subjects]);

  const resetSubjects = useCallback(() => {
    clearSavedData();
    setSubjects(getDefaultSubjects());
  }, []);

  return [subjects, setSubjects, { saveFailed, resetSubjects }];
}
