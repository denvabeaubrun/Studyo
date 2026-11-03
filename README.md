# Studyo

**Studyo** is a study app designed to make studying easier and more organized. Students can organize their coursework by subject and class, upload study notes, and turn those notes into interactive flashcards and quizzes.

🔗 **Live Demo:** https://denvabeaubrun.github.io/Studyo/

## Features

* 📚 **Subject & Class Organization**
  Organize study sets by subject and class, each with its own color and emoji.

* 📝 **Study Notes Upload**
  Paste notes or upload `.txt`, `.md` or `.pdf` files.

* 🧠 **Automatic Flashcards**
  Turns notes into flashcards by detecting formats like `Term: definition`, `Term - definition`, and term/definition line pairs. Falls back to fill-in-the-blank cards from longer sentences.

* ❓ **Quiz Mode**
  Multiple-choice quizzes built from a study set, with randomized answer choices and a score.

* ⏱️ **Pomodoro Timer**
  Focus (25 min), short break (5 min), and long break (15 min) modes, with a built-in music player.

* 📈 **Mastery Tracking**
  Mark cards "Got it" or "Still learning" and see a mastery progress bar for each set.

## How It Works

1. **Choose a subject and class**
2. **Add your study notes**
3. **Generate a study set**
4. **Study with flashcards**
5. **Test yourself with a quiz**
6. **Track your progress**

### Example

A student studying for a biology exam can paste notes such as:

```text
Mitochondria: The powerhouse of the cell
Ribosome - Builds proteins from amino acids
```

Studyo turns each line into a flashcard (front: the term, back: the definition). The student can then flip through the cards, mark which ones they've mastered, take a multiple-choice quiz, and use the Pomodoro timer to stay focused.

## Requirements

### Who it's for and what they need

Studyo is for students who keep notes in messy formats (typed notes, copied text, PDFs from a professor) and want to practice from them without retyping everything. Their needs:

* Keep material for different classes organized in one place.
* Turn notes into practice material quickly, whatever format the notes are in.
* Study in more than one way (flip cards, quiz) and see what they've mastered.
* Stay focused while studying.
* Get a clear message, not a broken result, when an upload doesn't work.

### Requirements

| ID | User need | Feature | Input -> output | How it's checked |
|----|-----------|---------|-----------------|------------------|
| R1 | Keep classes organized | Subjects, classes, and study sets | Names and colors -> subject grid with classes and sets inside | Manual |
| R2 | Make cards from notes | Card generation (`generateCards.js`) | Pasted text or `.txt`/`.md` -> flashcards | Automated tests |
| R3 | Use messy notes as they are | Notes cleanup (`cleanNotes`) | Split words, wrapped lines, page numbers, repeated headers -> clean card text | Automated tests |
| R4 | Use PDFs from class | PDF reader (`readPdf.js`) | Text PDF up to 20 MB and 150 pages -> editable text in the notes box | Manual + automated tests for line rebuilding |
| R5 | Not get broken results | Upload error messages | Scanned, password-protected, damaged, or oversized file -> clear message, no cards | Manual |
| R6 | Study by flipping cards | Flashcard viewer | A set -> cards marked "Got it" or "Still learning" | Manual |
| R7 | Test myself | Quiz mode | A set -> multiple-choice quiz | Manual |
| R8 | Stay focused | Pomodoro timer (always visible) | Start/pause -> 25-minute focus sessions with breaks and music | Manual |
| R9 | See what I've mastered | Progress tracker | Marked cards -> overall and per-subject mastery % | Manual |
| R10 | Use it without installing anything | GitHub Pages deploy | Merge to `main` -> live site updates | GitHub Actions run is green |

### Measurable targets

* **M1.** Every "Term: definition" line in pasted notes becomes exactly one card. Checked by automated tests.
* **M2.** The 3-page messy test PDF produces 8 cards, with no cards made from the repeated header or page numbers.
* **M3.** An upload that is over 20 MB, password protected, damaged, or has no text creates 0 cards and shows a message.
* **M4.** Mastery % always equals cards marked "Got it" divided by total cards, shown overall and per subject.
* **M5.** All automated tests (26 now) pass and the build succeeds before a pull request is merged.

### Use cases

1. **Quick study set (expected input):** a student pastes "Term: definition" lines for a biology unit and gets one card per line.
2. **Messy PDF (expected input):** a student uploads a PDF with page numbers, a header on every page, and words split across lines. The text is cleaned, shown for editing, and turned into cards.
3. **Study session:** a student runs a 25-minute Pomodoro, flips cards, marks the ones they know, and sees the progress percentage go up.
4. **Bad upload (unexpected input):** a student uploads a scan of a page. Studyo explains that no text was found and asks for a text-based PDF or pasted text instead of making empty cards.

### Assumptions and constraints

* Notes are mostly text. Scanned pages and images aren't supported yet.
* Everything runs in the browser. There are no accounts and no saving between visits yet.
* An API key can't be kept safely in browser code, so AI generation needs a small server-side proxy first.

## Technology

### Frontend

* React
* Vite
* JavaScript
* CSS

### Deployment

* GitHub Pages (via GitHub Actions)

### Version Control

* Git & GitHub

### Planned

* Anthropic Claude API for AI-powered card generation

## Project Structure

```text
src/
├── components/
│   ├── UploadModal.jsx       # Paste or upload notes
│   ├── FlashcardViewer.jsx   # Flip through cards, mark mastery
│   ├── QuizView.jsx          # Multiple-choice quiz
│   ├── Pomodoro.jsx          # Study timer + music player
│   ├── Stars.jsx             # Decorative star field (homepage)
│   └── Critters.jsx          # Decorative animated characters
├── utils/
│   └── generateCards.js      # Notes → flashcards logic
├── App.jsx                   # Main app: subjects, classes, sets, navigation
├── Layout.css
└── index.css
```

### Key Components

**`App.jsx`**
Acts as the central hub of the application and manages the flow between subjects, classes, study sets, flashcards, and quizzes.

**`utils/generateCards.js`**
Processes study notes and generates flashcards using text-pattern rules. It recognizes common note formats (colons, dashes, arrows, equals signs, tabs, and term/definition line pairs) and removes duplicate terms.

**`components/UploadModal.jsx`**
Provides the interface for adding study material through pasted notes or uploaded `.txt`/`.md`/`.pdf` files. PDF text is read in the browser (`src/utils/readPdf.js`) and shown in the notes box so it can be edited before cards are made.

**`components/FlashcardViewer.jsx`**
Displays study cards one at a time and allows students to mark cards as either "Got it" or "Still learning."

**`components/QuizView.jsx`**
Creates multiple-choice quizzes from study sets, including randomized answer choices and score tracking.

**`components/Pomodoro.jsx`**
A study timer with focus and break modes, plus a music player for focused sessions.

## Development

### Prerequisites

* Node.js (version 20 or later recommended)
* npm

### Installation

Clone the repository:

```bash
git clone https://github.com/DenvaBeaubrun/Studyo.git
```

Navigate into the project:

```bash
cd Studyo
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will provide a local development URL in the terminal.

## Build

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Deployment

Every push to `main` automatically builds the app and deploys it to GitHub Pages through the workflow in `.github/workflows/deploy.yml`.

## Project Status

Studyo is an ongoing project developed for **CISC 4900**.

**Working now:** subject/class organization, notes upload (`.txt`/`.md`/`.pdf` or pasted text), messy-notes cleanup, automatic flashcard generation, flashcard study mode with mastery tracking, quiz mode, Pomodoro timer, and GitHub Pages deployment.

**Known limitations:**

* Flashcards are generated with text-pattern rules, not AI yet.
* PDF upload only works for PDFs that contain real text. Scanned PDFs (pictures of pages) and password-protected PDFs can't be read, and only the first 150 pages of a PDF are used. PDFs with two columns can come out in a jumbled order, so check the text before generating.
* Data isn't saved yet: refreshing the page resets subjects, sets, and progress.

## Future Development

* AI-powered flashcard and quiz generation (Claude API via a secure server-side proxy)
* Reading scanned PDFs and images (OCR)
* Saving data between sessions (localStorage or a database)
* Quiz score history over time
* Game-based study modes

## Author

**Denva Beaubrun**

---

*Studyo — making study material easier to create, organize, and use.*
