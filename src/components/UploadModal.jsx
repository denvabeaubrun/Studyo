import { useState, useRef } from 'react';

function UploadModal({ color, onClose, onGenerate, isGenerating }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.txt') && !file.name.toLowerCase().endsWith('.md')) {
      setError('Right now only .txt and .md files can be read directly — paste PDF text below instead, or ask Claude to add PDF support.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => setText(reader.result);
    reader.readAsText(file);

    if (!title) {
      setTitle(file.name.replace(/\.(txt|md)$/i, ''));
    }
  }

  function handleSubmit() {
    if (!text.trim()) {
      setError('Add some notes first — paste text or upload a .txt file.');
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
            placeholder={'Paste your notes here — works best as either:\n"Mitochondria: the powerhouse of the cell"\nor full sentences you want turned into study questions.'}
            value={text}
            onChange={e => setText(e.target.value)}
            rows={8}
          />

          <button
            className="modal-file-button"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            📄 Or upload a .txt / .md file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {error && <p className="modal-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-button" onClick={onClose} disabled={isGenerating}>
            Cancel
          </button>
          <button
            className="modal-generate-button"
            onClick={handleSubmit}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating…' : 'Generate Flashcards'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
