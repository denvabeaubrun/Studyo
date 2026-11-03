# Changelog

All notable changes to Studyo are listed here, newest first.

## [Unreleased]

### Added
- Match game, a third way to study next to Flashcards and Quiz. Pair terms with definitions against a timer; up to 6 cards per round, with time and mistakes shown at the end and a "Play again" button. It replaces the disabled "Game" button. Works with keyboard and screen readers, and respects reduced-motion settings.
- 13 new tests for the Match rules (`matchGame.test.js`).
- Saved progress. Subjects, sets, and mastered cards are saved in the browser (local storage) and are still there after a refresh. Saved data is checked on load and falls back to the sample data if it is damaged. If saving fails (storage full or blocked), a warning is shown. A "Reset saved data" button in the footer clears it.
- 14 new tests for saving and loading (`storage.test.js`).
- README Requirements section: user needs, a requirements table (need, feature, input and output, how it is checked), measurable targets, use cases including a bad-input case, and assumptions.
- PDF upload. The text is read in the browser and shown in the notes box so it can be checked and edited before cards are made. Handles up to 20 MB and 150 pages; scanned or password-protected PDFs get a clear message.
- Messy-notes cleanup (`cleanNotes`): rejoins words split by a hyphen at the end of a line, rejoins sentences broken across lines, removes page numbers and headers/footers that repeat on every PDF page, and fixes ligatures and odd spaces.
- New card formats: `Q:` / `A:` pairs, a question line followed by its answer, and "X is/are ..." sentences.
- Tests for the new behavior (`generateCards.test.js`, `readPdf.test.js`).
- Top navigation bar (`SiteNav`) with links to Home, Subjects, How it works, and Progress, plus a Timer link. The current section is underlined, and the links work from inside a class or study screen too.
- Homepage sections under the subjects grid (`HomeSections`): How it works, Your progress, Meet the pod, and a slim footer.
- Progress tracker showing cards mastered overall and per subject, based on your actual sets.
- One-line tip under "My subjects".

### Changed
- The starting data moved from `App.jsx` into `data/defaultSubjects.js`.
- The deploy workflow uses Node 22 (required by the PDF library, `pdfjs-dist`).
- The header is now a flat bar that blends into the page, replacing the plain logo header.

## [0.1.0] - 2026-10-26

### Added
- Automated tests for flashcard generation (`src/utils/generateCards.test.js`), run with `npm test`.
- Comments explaining the purpose, props, and main functions of `App.jsx`, `FlashcardViewer.jsx`, `QuizView.jsx`, and `UploadModal.jsx`.
- This changelog.

### Changed
- README rewritten with accurate features, project structure, project status, and known limitations.
- Clearer error message when a non-`.txt`/`.md` file is uploaded.

### Fixed
- Notes with fewer than 5 term/definition pairs no longer produce an extra garbled fill-in-the-blank card made from the whole set of notes.

### Removed
- Unused template files: `App.css`, `react.svg`, `vite.svg`, `hero.png`, and `icons.svg`.

## 2026-10-07

### Added
- Flashcard front/back styles.

### Changed
- `generateCards` rewritten to understand more note formats (colons, dashes, arrows, equals signs, tabs, and term/definition line pairs) and to drop duplicate terms.

## 2026-10-06

### Added
- Decorative `Stars` and `Critters` components on the homepage.
- Hand-drawn marker circle around "studious" in the title.
- New song in the Pomodoro playlist.

## 2026-10-04 – 2026-10-05

### Added
- Pomodoro timer with focus, short break, and long break modes.
- Music player for the Pomodoro timer, including YouTube songs.
- Shared page layout (`Layout.css`).

### Changed
- Pomodoro sound controls and styles improved.
- New background color.

## 2026-09-21 – 2026-09-25

### Added
- Study sets inside subjects and classes.
- Notes upload with flashcard generation.
- Flashcard and quiz modes.
- Automatic deployment to GitHub Pages with GitHub Actions.
- Project README.

### Fixed
- CSS syntax error in the quiz results styles.

## 2026-05-01

### Added
- Initial React + Vite project setup.
