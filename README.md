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

* 🎮 **Match Game**
  Pair each term with its definition against the clock. Each round uses up to 6 cards from a set, and shows your time and mistakes at the end.

* 🌫️ **Brain Fog Game**
  A timed quiz game. Answer before the 15-second timer runs out (the timer can be turned off): faster answers and streaks score more points, and right answers clear a fog cloud. Wrong or late answers let the fog creep back. At the end you see your score, accuracy, best streak, and the cards you missed. Press 1 to 4 to answer.

* ⏱️ **Pomodoro Timer**
  Focus (25 min), short break (5 min), and long break (15 min) modes, with a built-in music player (ad-free piano, violin and rain tracks, plus rain and brown noise).

* 🌙 **Dark Mode**
  A sun/moon switch in the top bar. It follows your device's light or dark setting until you pick one, then remembers your choice.

* 📈 **Mastery Tracking**
  Mark cards "Got it" or "Still learning" and see a mastery progress bar for each set.

## How It Works

1. **Choose a subject and class**
2. **Add your study notes**
3. **Generate a study set**
4. **Study with flashcards**
5. **Test yourself with a quiz, or play Match or Brain Fog**
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
| R10 | Keep my work between visits | Saving in the browser (`storage.js`) | Any change -> still there after a refresh; "Reset saved data" returns to the samples | Automated tests + manual |
| R11 | Use it without installing anything | GitHub Pages deploy | Merge to `main` -> live site updates | GitHub Actions run is green |
| R12 | Practice without it feeling repetitive | Match game (`MatchGame.jsx`, `matchGame.js`) | A set with 2 or more different cards -> timed pairing of terms and definitions, with time and mistakes shown | Automated tests + manual |
| R13 | Practice under pressure, with quick feedback | Brain Fog game (`FogGame.jsx`, `fogGame.js`) | A set with 2 or more different cards -> up to 10 timed questions, points for speed and streaks, a score, and a list of missed cards | Automated tests + manual |
| R14 | Keep control of my own data | Privacy notice, "Download my data", "Reset saved data" | Click -> a `.json` copy of all data, or all saved data erased after a confirmation | Manual |
| R15 | Practice without time pressure | Brain Fog timer on/off switch | Timer off -> no time limit and no speed bonus (500 points per right answer); the choice is remembered | Automated tests + manual |

### Measurable targets

* **M1.** Every "Term: definition" line in pasted notes becomes exactly one card. Checked by automated tests.
* **M2.** The 3-page messy test PDF produces 8 cards, with no cards made from the repeated header or page numbers.
* **M3.** An upload that is over 20 MB, password protected, damaged, or has no text creates 0 cards and shows a message.
* **M4.** Mastery % always equals cards marked "Got it" divided by total cards, shown overall and per subject.
* **M5.** After a refresh, subjects, sets, and mastered cards are exactly as they were. Saved data that is damaged or out of date never crashes the app; it falls back to the sample data. Checked by automated tests and in a browser.
* **M6.** In Match, every card in a round appears once as a term and once as a definition, no two cards share the same front or back, and a round can be completed by pairing every tile. Checked by automated tests and in a browser.
* **M7.** In Brain Fog, every question has the right answer exactly once among its options, a right answer scores 500 to 1000 points plus a streak bonus, a wrong or late answer scores 0, and fog cleared never goes below 0% or above 100%. Checked by automated tests and in a browser.
* **M8.** With the Brain Fog timer off, a question never times out and a right answer scores exactly 500 points plus the streak bonus, never more than with the timer on. Checked by automated tests.
* **M9.** All automated tests (85 now) pass and the build succeeds before a pull request is merged.

### Use cases

1. **Quick study set (expected input):** a student pastes "Term: definition" lines for a biology unit and gets one card per line.
2. **Messy PDF (expected input):** a student uploads a PDF with page numbers, a header on every page, and words split across lines. The text is cleaned, shown for editing, and turned into cards.
3. **Study session:** a student runs a 25-minute Pomodoro, flips cards, marks the ones they know, and sees the progress percentage go up.
4. **Bad upload (unexpected input):** a student uploads a scan of a page. Studyo explains that no text was found and asks for a text-based PDF or pasted text instead of making empty cards.

### Assumptions and constraints

* Notes are mostly text. Scanned pages and images aren't supported yet.
* Everything runs in the browser. Data is saved in this browser on this device only (local storage), with no accounts. It doesn't sync between devices, and clearing the site's data or using a private window starts fresh.
* An API key can't be kept safely in browser code, so AI generation needs a small server-side proxy first.

## Responsible Design

### Who is affected

* **Students (main users):** high school and college students studying for classes. Some may be under 13 if a teacher shares the site, so Studyo is built to collect nothing about anyone.
* **Students who need extra support:** people who use a keyboard or screen reader, who read more slowly or are learning English, who are sensitive to motion, or who get anxious under time pressure.
* **People sharing a device:** students on a family, school, or library computer, where the next person could see saved notes.
* **Teachers and classmates:** indirectly, through how well the cards match the real course material and whether students rely on them too much.
* **Content owners:** notes and PDFs often come from professors or textbooks, and the songs in the timer belong to their artists.

### Privacy and data collection

* There are **no accounts, no ads, no analytics, and no tracking**. Studyo has no server and collects no personal information.
* Notes, PDFs, cards, and progress are processed and saved **only in the browser on that device** (local storage). The original notes aren't saved, only the cards made from them.
* PDFs are read in the browser (`readPdf.js`); files are never uploaded.
* **Nothing loads from outside services.** The timer's music is a set of files served from the site itself (`public/music`), with no ads or tracking. Music is off by default, and Rain and Brown Noise are generated in the browser. The code can still play YouTube songs (in privacy-enhanced mode, `youtube-nocookie.com`), but none are listed, because YouTube embeds can show ads.
* This is explained in plain words in the site footer and in the upload box.
* **If AI card generation is added later**, notes would be sent to an outside service for the first time. Before that ships, students must be told clearly and choose it themselves, with the current in-browser generator kept as the default, and the API key kept on a server, not in the browser.

### Choices students have about their data

* **Download my data:** saves a `.json` copy of all subjects, sets, and progress, so students own their work without needing an account.
* **Reset saved data:** erases everything on this device. It asks for confirmation first and says exactly what will be erased.
* **Music is opt-in:** no music plays until a student picks a track.
* **Brain Fog timer on or off:** the choice is remembered on that device.

### No misleading or manipulative design

* No streak-loss guilt messages, notifications, countdown sales, ads, or "are you sure you want to stop studying?" screens. Leaving is always one click ("Back").
* Game rewards (points, streaks, fog cleared) are only about answering correctly, never about time spent in the app.
* Results are honest: the end screens show accuracy, mistakes, and missed cards, not only the wins.
* Turning the Brain Fog timer off removes the speed bonus, so the score stays fair and the switch can't be used to inflate it.
* The games are labeled as practice and **don't change mastery**. Only the student marking a card "Got it" does that, so the progress tracker isn't inflated by games.

### Communicating consequences

* Erasing data asks for confirmation and states what will be lost.
* If saving fails (storage full or blocked), a warning says changes will be lost on refresh.
* Bad uploads (scanned, password protected, too large) get a clear message instead of empty cards.
* Brain Fog shows the correct answer after every miss, explains on screen what the timer switch changes, and says the game doesn't change mastery.

### Bias and limitations

* **Card generation is rule-based** and tuned to English-style notes ("Term: definition", "Q: / A:", "X is ..."). Notes in other languages, math with symbols, diagrams, and very informal notes can produce missing or wrong cards. The upload box tells students to check their cards.
* **Wrong answer choices** in Quiz and Brain Fog come from other cards in the same set, so a small set gives fewer, easier choices, and similar cards can make a question confusingly hard.
* **Mastery is self-reported.** A student can mark "Got it" too early; the tracker shows what they marked, not what they know.
* **Timers favor fast readers.** That's why the Brain Fog timer can be turned off, and Match only measures time without a limit.
* **PDF reading** can jumble two-column layouts and can't read scanned pages.
* **Device only:** data is lost if site data is cleared, and doesn't move between devices except through "Download my data".

### Protecting vulnerable users

* **Younger students:** no sign-up, no personal information, no chat or sharing features, and no ads.
* **Disabilities:** the games work with the keyboard (keys 1-4 in Brain Fog, Tab and Enter in Match), have screen-reader labels and spoken status updates, and respect the device's reduced-motion setting.
* **Test anxiety:** the Brain Fog timer can be turned off, every game starts fresh, and a low score leads to a review list, not a punishment.
* **Shared computers:** the footer reminds students to use "Reset saved data" when done.

### Ethical and social considerations

* **Academic integrity:** Studyo is for studying a student's own notes, not for completing graded work. Generated cards are a starting point to review, not a source of truth.
* **Over-reliance:** cards are only as good as the notes they come from. The upload box and this README ask students to check them.
* **Copyright:** students should only upload material they have the right to use for their own study. Studyo keeps it on their device and never shares or publishes it. The timer's music is from Pixabay under the Pixabay Content License, which allows use in a project like this; the artists are credited on the pod's screen anyway. Downloaded copies of commercial songs are never used.
* **Wellbeing:** the Pomodoro timer builds in breaks, and the games avoid features designed to keep students in the app longer than they need.
* **Access:** the app is free, works in any modern browser, and needs no account, so students without paid tools can use it.

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
│   ├── MatchGame.jsx         # Match game: pair terms with definitions
│   ├── FogGame.jsx           # Brain Fog game: timed quiz with a fog cloud
│   ├── Pomodoro.jsx          # Study timer + music player (tracks in public/music)
│   ├── Stars.jsx             # Decorative star field (homepage)
│   └── Critters.jsx          # Decorative animated characters
├── data/
│   └── defaultSubjects.js    # Starting subjects, classes, and sample sets
├── hooks/
│   ├── usePersistentSubjects.js  # Loads and saves data in the browser
│   └── useTheme.js           # Light/dark mode switch
├── utils/
│   ├── generateCards.js      # Notes → flashcards logic
│   ├── fogGame.js            # Brain Fog rules (questions, scoring, game state)
│   ├── matchGame.js          # Match game rules (build a round, check a pair)
│   ├── readPdf.js            # PDF text extraction
│   └── storage.js            # Saves/loads data in local storage
├── theme.css                 # Light and dark mode colors
├── App.jsx                   # Main app: subjects, classes, sets, navigation
├── Layout.css
└── index.css
```

### Key Components

**`App.jsx`**
Acts as the central hub of the application and manages the flow between subjects, classes, study sets, flashcards, and quizzes.

**`utils/generateCards.js`**
Processes study notes and generates flashcards using text-pattern rules. It recognizes common note formats (colons, dashes, arrows, equals signs, tabs, and term/definition line pairs) and removes duplicate terms.

**`utils/storage.js` and `hooks/usePersistentSubjects.js`**
Save all subjects, sets, and mastered cards in the browser's local storage after every change, and load them on startup. Saved data is checked first; if it is missing, damaged, or from a different version, the app falls back to the sample data in `data/defaultSubjects.js`. A "Reset saved data" button in the footer clears it.

**`components/UploadModal.jsx`**
Provides the interface for adding study material through pasted notes or uploaded `.txt`/`.md`/`.pdf` files. PDF text is read in the browser (`src/utils/readPdf.js`) and shown in the notes box so it can be edited before cards are made.

**`components/FlashcardViewer.jsx`**
Displays study cards one at a time and allows students to mark cards as either "Got it" or "Still learning."

**`components/MatchGame.jsx` and `utils/matchGame.js`**
The Match game. `matchGame.js` builds a round (up to 6 cards, skipping cards that share a front or back) and checks pairs; `MatchGame.jsx` is the screen with the timer, mistake count, and results. It doesn't change which cards are marked mastered.

**`components/FogGame.jsx` and `utils/fogGame.js`**
The Brain Fog game. `fogGame.js` builds the questions, scores answers (500 to 1000 points by speed, plus a streak bonus), tracks the fog level, and runs the whole game as a reducer so it can be tested without a screen. `FogGame.jsx` is the screen: the cloud, timer, answer buttons, and results. It doesn't change which cards are marked mastered.

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

**Working now:** subject/class organization, notes upload (`.txt`/`.md`/`.pdf` or pasted text), messy-notes cleanup, automatic flashcard generation, flashcard study mode with mastery tracking, the Match and Brain Fog games, saved progress between visits, quiz mode, Pomodoro timer, and GitHub Pages deployment.

**Known limitations:**

* Flashcards are generated with text-pattern rules, not AI yet.
* PDF upload only works for PDFs that contain real text. Scanned PDFs (pictures of pages) and password-protected PDFs can't be read, and only the first 150 pages of a PDF are used. PDFs with two columns can come out in a jumbled order, so check the text before generating.
* Data is saved in your browser only. It doesn't sync between devices, clearing site data erases it, and very large sets can fill the browser's storage (the app shows a warning if saving fails).

## Future Development

* AI-powered flashcard and quiz generation (Claude API via a secure server-side proxy)
* Reading scanned PDFs and images (OCR)
* Syncing data across devices (accounts and a database)
* Quiz score history over time
* More game modes (memory flip, speed round)

## Author

**Denva Beaubrun**

---

*Studyo — making study material easier to create, organize, and use.*
