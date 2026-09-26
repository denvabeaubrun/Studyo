# Studyo

**Studyo** is an AI-assisted study app designed to make studying easier and more organized. Students can organize their coursework by subject and class, upload study notes, and turn those notes into interactive flashcards and quizzes.

🔗 **Live Demo:** https://denvabeaubrun.github.io/Studyo/

## Features

* 📚 **Subject & Class Organization**
  Organize study materials by subject and class.

* 📝 **Study Notes Upload**
  Add study material by uploading notes or entering text.

* 🧠 **AI-Assisted Flashcards**
  Turn study notes into flashcards automatically.

* ❓ **Quiz Mode**
  Generate multiple-choice quizzes from study sets and track quiz scores.

* ⏱️ **Pomodoro Study Sessions**
  Use focused study intervals without leaving the app.

* 📈 **Progress Tracking**
  Track mastery and study progress for individual study sets.

* 🎮 **Additional Study Modes**
  Designed to support additional interactive study formats such as games.

## How It Works

1. **Choose a subject and class**
2. **Add your study notes**
3. **Generate a study set**
4. **Study with flashcards**
5. **Test yourself with a quiz**
6. **Track your progress**

### Example

A student studying for a biology exam can upload notes covering topics such as cell structure and mitosis. Studyo processes the material and can generate flashcards and a mock quiz from the uploaded content. The student can then complete a focused study session and record their quiz results.

## Technology

### Frontend

* React
* Vite
* JavaScript
* CSS

### AI

* Anthropic Claude API

### Deployment

* GitHub Pages

### Version Control

* GitHub

## Project Structure

```text
src/
├── components/
│   ├── UploadModal.jsx
│   ├── FlashcardViewer.jsx
│   └── QuizView.jsx
│
├── utils/
│   └── generateCards.js
│
├── App.jsx
└── index.css
```

### Key Components

**`App.jsx`**
Acts as the central hub of the application and manages the flow between subjects, classes, study sets, flashcards, and quizzes.

**`utils/generateCards.js`**
Processes study notes and generates flashcards. The current implementation uses text-based heuristics as a stand-in for a full AI call.

**`components/UploadModal.jsx`**
Provides the interface for adding study material through pasted notes or uploaded `.txt`/`.md` files.

**`components/FlashcardViewer.jsx`**
Displays study cards one at a time and allows students to mark cards as either "Got it" or "Still learning."

**`components/QuizView.jsx`**
Creates multiple-choice quizzes from study sets, including randomized answer choices and score tracking.

## Development

### Prerequisites

* Node.js
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

## Project Status

Studyo is an ongoing project developed for **CISC 4900**.

Current development includes the core subject/class organization, PDF upload flow, and GitHub Pages deployment. Planned development includes expanded AI generation, quiz mode, Pomodoro functionality, and progress tracking.

## Future Development

* Full AI-powered study material generation
* PDF note processing
* Expanded quiz functionality
* Pomodoro timer
* Progress and mastery tracking
* Game-based study modes
* Additional study formats

## Author

**Denva Beaubrun**

---

*Studyo — making study material easier to create, organize, and use.*
