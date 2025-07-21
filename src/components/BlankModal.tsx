import React, { useState } from 'react';
import { Blank } from '../types';

interface BlankModalProps {
  onBlankCreated: (blank: Blank) => void;
  onCancel: () => void;
  existingBlank?: Blank;
}

const BlankModal: React.FC<BlankModalProps> = ({ onBlankCreated, onCancel, existingBlank }) => {
  const [partOfSpeech, setPartOfSpeech] = useState(existingBlank?.partOfSpeech || '');
  const [hint, setHint] = useState(existingBlank?.hint || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalPartOfSpeech = partOfSpeech.trim();

    if (!finalPartOfSpeech) {
      alert('Please enter a part of speech');
      return;
    }

    const blank: Blank = {
      partOfSpeech: finalPartOfSpeech,
      hint: hint.trim() || undefined,
    };

    onBlankCreated(blank);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{existingBlank ? 'Edit Blank' : 'Add a Blank'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="partOfSpeech">Part of Speech *</label>
            <input
              type="text"
              id="partOfSpeech"
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              placeholder="e.g., noun, adjective, verb, animal, color, etc."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="hint">Hint (optional)</label>
            <input
              type="text"
              id="hint"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g., something you eat, a scary animal, etc."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {existingBlank ? 'Update Blank' : 'Add Blank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlankModal;
