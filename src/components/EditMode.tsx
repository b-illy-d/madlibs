import React, { useState } from 'react';
import { Template, TemplateSentence } from '../types';

interface EditModeProps {
  story: Template;
  onSaveStory: (story: Template) => void;
  onBackToMain?: () => void;
}

const EditMode: React.FC<EditModeProps> = ({ story: _story, onSaveStory, onBackToMain }) => {
  const [story, setStory] = useState<Template>(_story);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStory({ ...story, title: e.target.value });
  };

  const addSentence = () => {
    const newSentence: TemplateSentence = {
      id: `sentence-${Date.now()}`,
      content: [],
    };
    setStory({
      ...story,
      sentences: [...story.sentences, newSentence],
    });
  };

  const deleteSentence = (sentenceId: string) => {
    setStory({
      ...story,
      sentences: story.sentences.filter((s) => s.id !== sentenceId),
    });
  };

  const handleSave = () => {
    // Update localStorage
    try {
      const existingStories = JSON.parse(localStorage.getItem('madlibs-stories') || '[]');
      const updatedStories = existingStories.map((s: Template) => (s.id === story.id ? story : s));
      if (!existingStories.find((s: Template) => s.id === story.id)) {
        updatedStories.push(story);
      }
      localStorage.setItem('madlibs-stories', JSON.stringify(updatedStories));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }

    onSaveStory(story);

    // Navigate back to main view
    if (onBackToMain) {
      onBackToMain();
    }
  };

  return (
    <div className="edit-mode">
      <div className="edit-story">
        <div className="edit-header">
          <input
            type="text"
            value={story.title}
            onChange={handleTitleChange}
            placeholder="Template Title"
            className="title-input"
          />
          <div className="edit-actions">
            <button className="save-btn" onClick={handleSave}>
              Save Template
            </button>
            {onBackToMain && (
              <button className="back-btn" onClick={onBackToMain}>
                ← Back to Templates
              </button>
            )}
          </div>
        </div>

        <div className="instructions-section">
          <div className="instructions-box">
            <h3>How to Create Templates</h3>
            <p>
              <strong>Instructions:</strong> Type your sentences and use square brackets for blanks.
            </p>
            <p>
              <strong>Examples:</strong> [noun], [verb], [adjective:describing color]
            </p>
            <p>
              <strong>Hints:</strong> Add hints after a colon like [animal:farm animal] to help
              players understand what you're looking for.
            </p>
          </div>
        </div>

        <div className="sentences-section">
          <div className="section-header">
            <h3>Sentences</h3>
            <button className="add-sentence-btn" onClick={addSentence}>
              Add Sentence
            </button>
          </div>

          {story.sentences.length === 0 ? (
            <div className="empty-sentences">
              <p>No sentences yet. Click "Add Sentence" to get started!</p>
            </div>
          ) : (
            <div className="sentences-list">
              {story.sentences.map((sentence, index) => (
                <SentenceEditor
                  key={sentence.id}
                  sentence={sentence}
                  index={index}
                  onUpdate={(updatedSentence) => {
                    setStory({
                      ...story,
                      sentences: story.sentences.map((s) =>
                        s.id === sentence.id ? updatedSentence : s,
                      ),
                    });
                  }}
                  onDelete={() => deleteSentence(sentence.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SentenceEditorProps {
  sentence: TemplateSentence;
  index: number;
  onUpdate: (sentence: TemplateSentence) => void;
  onDelete: () => void;
}

const SentenceEditor: React.FC<SentenceEditorProps> = ({ sentence, index, onUpdate, onDelete }) => {
  const [text, setText] = useState(() => {
    // Convert existing content to text representation
    return sentence.content
      .map((item) => {
        if (item.type === 'text') {
          // Escape literal brackets in text
          return item.textContent.replace(/\[/g, '[[').replace(/\]/g, ']]');
        } else {
          return `[${item.blank.partOfSpeech}${item.blank.hint ? `:${item.blank.hint}` : ''}]`;
        }
      })
      .join('');
  });

  const parseText = (inputText: string) => {
    // First handle escaped brackets [[]] -> literal []
    const processedText = inputText
      .replace(/\[\[/g, '\u0001LEFTBRACKET\u0001')
      .replace(/\]\]/g, '\u0001RIGHTBRACKET\u0001');

    // Split on single brackets for blanks
    const parts = processedText.split(/(\[[^\]]+\])/);
    
    // Extract existing blanks to try to preserve their IDs
    const existingBlanks = sentence.content.filter(item => item.type === 'blank');
    let blankIndex = 0;
    
    const content = parts
      .map((part, i) => {
        if (part.match(/^\[.+\]$/)) {
          // This is a blank
          const inner = part.slice(1, -1);
          const [partOfSpeech, hint] = inner.split(':');
          
          // Check if we can reuse an existing blank ID
          const existingBlank = existingBlanks[blankIndex] as any;
          const isSameBlank = existingBlank && 
            existingBlank.blank.partOfSpeech.trim() === partOfSpeech.trim() &&
            (existingBlank.blank.hint || '').trim() === (hint || '').trim();
          
          blankIndex++;
          
          return {
            id: isSameBlank ? existingBlank.id : `blank-${Date.now()}-${i}`,
            type: 'blank' as const,
            blank: {
              partOfSpeech: partOfSpeech.trim(),
              hint: hint?.trim(),
            },
          };
        } else if (part) {
          // This is text, restore escaped brackets
          const restoredText = part
            .replace(/\u0001LEFTBRACKET\u0001/g, '[')
            .replace(/\u0001RIGHTBRACKET\u0001/g, ']');

          if (restoredText) {
            return {
              id: `text-${Date.now()}-${i}`,
              type: 'text' as const,
              textContent: restoredText,
            };
          }
        }
        return null;
      })
      .filter(Boolean) as any[];

    return content;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    const content = parseText(newText);
    onUpdate({
      ...sentence,
      content,
    });
  };

  return (
    <div className="sentence-editor">
      <div className="sentence-header">
        <h4>Sentence {index + 1}</h4>
        <button className="delete-sentence-btn" onClick={onDelete}>
          Delete
        </button>
      </div>
      <div className="sentence-input-section">
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Write your sentence here. Use [noun], [verb], [adjective:hint] for blanks..."
          className="sentence-textarea"
          rows={3}
        />
      </div>
    </div>
  );
};

export default EditMode;
