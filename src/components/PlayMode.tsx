import React, { useState, useEffect } from 'react';
import {
  Template,
  TemplateContentItemBlank as StoryContentItemBlankType,
  SavedStory,
} from '../types';

interface PlayModeProps {
  story: Template;
  onBackToMain: () => void;
  onSaveStoryInstance: (instance: SavedStory) => void;
}

interface BlankValue {
  itemId: string;
  value: string;
}

const PlayMode: React.FC<PlayModeProps> = ({ story, onBackToMain, onSaveStoryInstance }) => {
  const [blankValues, setBlankValues] = useState<BlankValue[]>([]);
  const [showCompletedStory, setShowCompletedStory] = useState(false);

  // Initialize blank values when component mounts
  useEffect(() => {
    const allContent = (story.sentences || []).flatMap(sentence => sentence.content || []);
    const blankItems = allContent.filter(
      (item) => item.type === 'blank',
    ) as StoryContentItemBlankType[];
    const initialValues = blankItems.map((item) => ({
      itemId: item.id,
      value: '',
    }));
    setBlankValues(initialValues);
  }, [story]);

  const updateBlankValue = (itemId: string, value: string) => {
    setBlankValues((prev) =>
      prev.map((blank) => (blank.itemId === itemId ? { ...blank, value } : blank)),
    );
  };

  const getBlankValue = (itemId: string): string => {
    const blank = blankValues.find((b) => b.itemId === itemId);
    return blank ? blank.value : '';
  };

  const areAllBlanksFilled = (): boolean => {
    return blankValues.every((blank) => blank.value.trim() !== '');
  };

  const handlePlayStory = () => {
    if (areAllBlanksFilled()) {
      setShowCompletedStory(true);
    }
  };

  const handleStartOver = () => {
    setShowCompletedStory(false);
    setBlankValues((prev) => prev.map((blank) => ({ ...blank, value: '' })));
  };

  if (showCompletedStory) {
    return (
      <CompletedStory
        story={story}
        blankValues={blankValues}
        onStartOver={handleStartOver}
        onBackToMain={onBackToMain}
        onSaveStoryInstance={onSaveStoryInstance}
      />
    );
  }

  return (
    <div className="play-mode">
      <div className="play-header">
        <h2>{story.title}</h2>
        <button className="back-btn" onClick={onBackToMain}>
          ← Back to Stories
        </button>
      </div>

      <div className="play-instructions">
        <p>Fill in all the blanks below, then click "Read Story" to see your completed madlib!</p>
      </div>

      <div className="blanks-form">
        {(story.sentences || [])
          .flatMap(sentence => sentence.content || [])
          .filter((item) => item.type === 'blank')
          .map((item, index) => {
            const blankItem = item as StoryContentItemBlankType;
            return (
              <BlankInput
                key={blankItem.id}
                itemId={blankItem.id}
                partOfSpeech={blankItem.blank.partOfSpeech}
                hint={blankItem.blank.hint}
                value={getBlankValue(blankItem.id)}
                onChange={(value) => updateBlankValue(blankItem.id, value)}
                number={index + 1}
              />
            );
          })}
      </div>

      <div className="play-actions">
        <button
          className="play-story-btn-large"
          onClick={handlePlayStory}
          disabled={!areAllBlanksFilled()}
        >
          Read Story
        </button>
      </div>
    </div>
  );
};

interface BlankInputProps {
  itemId: string;
  partOfSpeech: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  number: number;
}

const BlankInput: React.FC<BlankInputProps> = ({ partOfSpeech, hint, value, onChange, number }) => {
  return (
    <div className="blank-input-group">
      <label className="blank-label">
        {number}. {partOfSpeech}
        {hint && <span className="blank-hint-text"> ({hint})</span>}
      </label>
      <input
        type="text"
        className="blank-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter a ${partOfSpeech.toLowerCase()}...`}
      />
    </div>
  );
};

interface CompletedStoryProps {
  story: Template;
  blankValues: BlankValue[];
  onStartOver: () => void;
  onBackToMain: () => void;
  onSaveStoryInstance: (instance: SavedStory) => void;
}

const CompletedStory: React.FC<CompletedStoryProps> = ({
  story,
  blankValues,
  onStartOver,
  onBackToMain,
  onSaveStoryInstance,
}) => {
  const getBlankValueById = (itemId: string): string => {
    const blank = blankValues.find((b) => b.itemId === itemId);
    return blank ? blank.value : '';
  };

  const handleSaveStory = () => {
    const customTitle = prompt('Enter a title for your saved story:', story.title);

    // If user cancels or enters empty string, don't save
    if (customTitle === null || customTitle.trim() === '') {
      return;
    }

    const blankValueMap: { [itemId: string]: string } = {};
    blankValues.forEach((blank) => {
      blankValueMap[blank.itemId] = blank.value;
    });

    const savedInstance: SavedStory = {
      id: Date.now().toString(),
      storyId: story.id,
      savedAt: new Date(),
      blankValues: blankValueMap,
      customTitle: customTitle.trim(),
    };

    onSaveStoryInstance(savedInstance);
  };

  const renderStoryContent = () => {
    return (story.sentences || []).map((sentence, sentenceIndex) => (
      <div key={`sentence-${sentenceIndex}`} className="story-sentence">
        {(sentence.content || []).map((item, index) => {
          if (item.type === 'text') {
            return (
              <span key={`text-${index}`} className="story-text">
                {item.textContent}
              </span>
            );
          } else {
            const blankValue = getBlankValueById(item.id);
            return (
              <strong key={`blank-${index}`} className="filled-blank">
                {blankValue}
              </strong>
            );
          }
        })}
      </div>
    ));
  };

  return (
    <div className="completed-story">
      <div className="completed-header">
        <h2>{story.title}</h2>
        <div className="completed-actions">
          <button className="save-story-btn" onClick={handleSaveStory}>
            Save This Story
          </button>
          <button className="start-over-btn" onClick={onStartOver}>
            Start Over
          </button>
          <button className="back-btn" onClick={onBackToMain}>
            ← Back to Stories
          </button>
        </div>
      </div>

      <div className="story-display">{renderStoryContent()}</div>
    </div>
  );
};

export default PlayMode;
