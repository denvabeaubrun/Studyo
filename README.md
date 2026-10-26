# Studyo

**Studyo** is a study app designed to make studying easier and more organized. Students can organize their coursework by subject and class, upload study notes, and turn those notes into interactive flashcards and quizzes.

🔗 **Live Demo:** https://denvabeaubrun.github.io/Studyo/

## Features

* 📚 **Subject & Class Organization**
  Organize study sets by subject and class, each with its own color and emoji.

* 📝 **Study Notes Upload**
  Paste notes or upload `.txt` / `.md` files.

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
Provides the interface for adding study material through pasted notes or uploaded `.txt`/`.md` files.

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

**Working now:** subject/class organization, notes upload (`.txt`/`.md` or pasted text), automatic flashcard generation, flashcard study mode with mastery tracking, quiz mode, Pomodoro timer, and GitHub Pages deployment.

**Known limitations:**

* Flashcards are generated with text-pattern rules, not AI yet.
* PDF files can't be uploaded directly; paste the text instead.
* Data isn't saved yet: refreshing the page resets subjects, sets, and progress.

## Future Development

* AI-powered flashcard and quiz generation (Claude API via a secure server-side proxy)
* Direct PDF upload
* Saving data between sessions (localStorage or a database)
* Quiz score history over time
* Game-based study modes

## Author

**Denva Beaubrun**

---

*Studyo — making study material easier to create, organize, and use.*
