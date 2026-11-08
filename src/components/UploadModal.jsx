// UploadModal.jsx
//
// Pop-up window for creating a new study set. The user gives the set a title
// and either pastes notes or uploads a .txt / .md / .pdf file (PDF text is read
// in the browser by readPdf.js). Clicking "Generate
// Flashcards" sends the title and text back to App.jsx, which turns the notes
// into cards with generateCards().
//
// Props:
//   color        - the class color, used for the modal header
//   onClose      - called when the user cancels or clicks outside the modal
//   onGenerate   - called with { title, text } when the form is valid
//   isGenerating - true while cards are being created; disables the buttons

import { useState, useRef } from 'react';
import { extractPdfText } from '../utils/readPdf';

function UploadModal({ color, onClose, onGenerate, isGenerating }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');        // friendly info message, like "Read 12 pages"
  const [isReading, setIsReading] = useState(false); // true while a PDF is being read
  const fileInputRef = useRef(null); // hidden file input, opened by the upload button

  // Reads an uploaded .txt, .md or .pdf file into the notes box so it can be
  // checked and edited before cards are made.
  // If no title has been typed yet, the file name becomes the title.
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be picked again later
    if (!file) return;

    const name = file.name.toLowerCase();
    const isPdf = name.endsWith('.pdf');
    if (!isPdf && !name.endsWith('.txt') && !name.endsWith('.md')) {
      setError('Only .txt, .md and .pdf files can be uploaded. For anything else, copy the text and paste it below.');
      setNote('');
      return;
    }

    setError('');
    setNote('');

    if (isPdf) {
      setIsReading(true);
      try {
        const { text: pdfText, truncated, pageCount } = await extractPdfText(file);
        setText(pdfText);
        setNote(
          truncated
            ? `Read the first part of a ${pageCount}-page PDF. Check the text below, then generate.`
            : 'PDF read. Check the text below and edit anything that looks off, then generate.'
        );
      } catch (err) {
        setError(err.message);
        return;
      } finally {
        setIsReading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => setText(reader.result);
      reader.readAsText(file);
    }

    if (!title) {
      setTitle(file.name.replace(/\.(txt|md|pdf)$/i, ''));
    }
  }

  // Checks that both notes and a title were given, then passes them to App.jsx.
  function handleSubmit() {
    if (!text.trim()) {
      setError('Add some notes first — paste text or upload a .txt, .md or .pdf file.');
      return;
    }
    if (!title.trim()) {
      setError('Give this set a title.');
      return;
    }
    setError('');
    onGenerate({ title: title.trim(), text: text.trim() });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: color }}>
          <h3 className="modal-title">Upload Notes</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <label className="modal-label" htmlFor="set-title">Set title</label>
          <input
            id="set-title"
            className="modal-input"
            type="text"
            placeholder="e.g. Cell Bio Ch. 3"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <label className="modal-label" htmlFor="notes-text">Notes</label>
          <textarea
            id="notes-text"
            className="modal-textarea"
            placeholder={'Paste your notes here. Studyo understands:\n"Mitochondria: the powerhouse of the cell"\n"Q: ... / A: ..." pairs, questions with answers below them,\nor notes written as sentences, like\n"the revolution was during 1775 to 1783 and it started because of taxes"\n(becomes "When was the revolution?" and "Why did the revolution start?").\nMessy notes are fine.'}
            value={text}
            onChange={e => setText(e.target.value)}
            rows={8}
          />

          <button
            className="modal-file-button"
            onClick={() => fileInputRef.current?.click()}
            type="button"
            disabled={isReading}
          >
            {isReading ? '📄 Reading PDF…' : '📄 Or upload a .txt, .md or .pdf file'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf,application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <p className="modal-privacy">
            🔒 Your notes are turned into cards right here in your browser and are never uploaded.
            Cards are made by simple text rules, so check them before you study.
          </p>

          {note && !error && <p className="modal-note" role="status">{note}</p>}
          {error && <p className="modal-error" role="alert">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-button" onClick={onClose} disabled={isGenerating}>
            Cancel
          </button>
          <button
            className="modal-generate-button"
            onClick={handleSubmit}
            disabled={isGenerating || isReading}
          >
            {isGenerating ? 'Generating…' : 'Generate Flashcards'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
