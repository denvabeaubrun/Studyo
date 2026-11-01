# Changelog

All notable changes to Studyo are listed here, newest first.

## [Unreleased]

### Added
- Top navigation bar (`SiteNav`) with links to Home, Subjects, How it works, and Progress, plus a Timer link. The current section is underlined, and the links work from inside a class or study screen too.
- Homepage sections under the subjects grid (`HomeSections`): How it works, Your progress, Meet the pod, and a slim footer.
- Progress tracker showing cards mastered overall and per subject, based on your actual sets.
- One-line tip under "My subjects".

### Changed
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
