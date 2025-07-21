import React, { useState, useEffect } from 'react';
import { Template, SavedStory } from '../types';

interface ReadViewProps {
  templates: Template[];
  savedInstances: SavedStory[];
  onBackToMain: () => void;
  onUpdateSavedStory: (updatedStory: SavedStory) => void;
  onPlayTemplate: (template: Template) => void;
  initialTemplateFilter?: string;
}

interface StoryViewProps {
  template: Template;
  savedInstance: SavedStory;
  onBackToRead: () => void;
  onUpdateSavedStory: (updatedStory: SavedStory) => void;
  onPlayTemplate: (template: Template) => void;
}

const ReadView: React.FC<ReadViewProps> = ({
  templates,
  savedInstances,
  onBackToMain,
  onUpdateSavedStory,
  onPlayTemplate,
  initialTemplateFilter,
}) => {
  const [selectedInstance, setSelectedInstance] = useState<SavedStory | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState<string>(
    initialTemplateFilter || 'all',
  );

  const handleViewStory = (instance: SavedStory) => {
    const story = templates.find((s) => s.id === instance.storyId);
    if (story) {
      setSelectedInstance(instance);
      setSelectedTemplate(story);
    }
  };

  const handleBackToRead = () => {
    setSelectedInstance(null);
    setSelectedTemplate(null);
  };

  const handleShareStory = (instance: SavedStory) => {
    const story = templates.find((s) => s.id === instance.storyId);
    if (!story) return;

    // Generate the story content for sharing
    const storyContent = (story.sentences || [])
      .map((sentence) =>
        (sentence.content || [])
          .map((item) => {
            if (item.type === 'text') {
              return item.textContent;
            } else {
              return instance.blankValues[item.id] || '[missing]';
            }
          })
          .join(''),
      )
      .join(' ');

    const shareData = {
      title: instance.customTitle || story.title,
      text: `"${instance.customTitle || story.title}"\n\n${storyContent}`,
      url: window.location.href,
    };

    // Try to use native share API first
    if (navigator.share) {
      navigator.share(shareData).catch((err) => {
        console.log('Error sharing:', err);
        fallbackShare(shareData);
      });
    } else {
      fallbackShare(shareData);
    }
  };

  const fallbackShare = (shareData: { title: string; text: string; url: string }) => {
    // Fallback to copying to clipboard
    const textToShare = `${shareData.text}\n\n${shareData.url}`;

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(textToShare)
        .then(() => {
          alert('Story copied to clipboard! You can now paste it to share.');
        })
        .catch(() => {
          // Final fallback - show text in alert
          alert(`Copy this text to share:\n\n${textToShare}`);
        });
    } else {
      // Final fallback - show text in alert
      alert(`Copy this text to share:\n\n${textToShare}`);
    }
  };

  const handleUpdateSavedStory = (updatedStory: SavedStory) => {
    onUpdateSavedStory(updatedStory);
    // Update the selected instance with the new data
    setSelectedInstance(updatedStory);
  };

  // Update selectedInstance when savedInstances prop changes
  useEffect(() => {
    if (selectedInstance) {
      const updatedInstance = savedInstances.find((story) => story.id === selectedInstance.id);
      if (updatedInstance) {
        setSelectedInstance(updatedInstance);
      }
    }
  }, [savedInstances]);

  if (selectedInstance && selectedTemplate) {
    return (
      <StoryView
        template={selectedTemplate}
        savedInstance={selectedInstance}
        onBackToRead={handleBackToRead}
        onUpdateSavedStory={handleUpdateSavedStory}
        onPlayTemplate={onPlayTemplate}
      />
    );
  }

  // Filter saved instances based on selected template
  const filteredInstances =
    selectedTemplateFilter === 'all'
      ? savedInstances
      : savedInstances.filter((instance) => instance.storyId === selectedTemplateFilter);

  // Create table data with story titles
  const tableData = filteredInstances.map((instance) => {
    const story = templates.find((s) => s.id === instance.storyId);
    return {
      instance,
      storyTitle: instance.customTitle || story?.title || 'Unknown Story',
      templateTitle: story?.title || 'Unknown Template',
    };
  });

  // Get unique templates that have saved stories
  const availableTemplates = templates.filter((template) =>
    savedInstances.some((instance) => instance.storyId === template.id),
  );

  return (
    <div className="read-view">
      <div className="read-header">
        <h2>Saved Stories</h2>
        <div className="read-header-controls">
          <div className="template-filter">
            <label htmlFor="template-filter">Filter by Template:</label>
            <select
              id="template-filter"
              value={selectedTemplateFilter}
              onChange={(e) => setSelectedTemplateFilter(e.target.value)}
              className="template-filter-select"
            >
              <option value="all">All Templates ({savedInstances.length})</option>
              {availableTemplates.map((template) => {
                const count = savedInstances.filter(
                  (instance) => instance.storyId === template.id,
                ).length;
                return (
                  <option key={template.id} value={template.id}>
                    {template.title} ({count})
                  </option>
                );
              })}
            </select>
          </div>
          <button className="back-btn" onClick={onBackToMain}>
            ← Back to Main
          </button>
        </div>
      </div>

      {savedInstances.length === 0 ? (
        <div className="empty-saved-stories">
          <p>You haven't saved any completed stories yet.</p>
          <p>Play a story and save it to see it here!</p>
        </div>
      ) : (
        <>
          {/* Desktop table view */}
          <div className="saved-stories-table-container desktop-only">
            <table className="saved-stories-table">
              <thead>
                <tr>
                  <th>Story Title</th>
                  <th>Template Title</th>
                  <th>Date Saved</th>
                  <th>Time Saved</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map(({ instance, storyTitle, templateTitle }) => (
                  <tr key={instance.id} className="table-row">
                    <td className="story-title-cell">{storyTitle}</td>
                    <td className="template-title-cell">{templateTitle}</td>
                    <td className="date-cell">{instance.savedAt.toLocaleDateString()}</td>
                    <td className="time-cell">
                      {instance.savedAt.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="actions-cell">
                      <button className="view-story-btn" onClick={() => handleViewStory(instance)}>
                        View Story
                      </button>
                      <button
                        className="share-story-btn"
                        onClick={() => handleShareStory(instance)}
                      >
                        Share
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="saved-stories-cards mobile-only">
            {tableData.map(({ instance, storyTitle, templateTitle }) => (
              <div key={instance.id} className="saved-story-card">
                <div className="saved-story-header">
                  <h3 className="saved-story-title">{storyTitle}</h3>
                  <div className="saved-story-template">Template: {templateTitle}</div>
                </div>
                <div className="saved-story-meta">
                  <div className="saved-story-date">
                    {instance.savedAt.toLocaleDateString()} at{' '}
                    {instance.savedAt.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div className="saved-story-actions">
                  <button className="view-story-btn" onClick={() => handleViewStory(instance)}>
                    View Story
                  </button>
                  <button className="share-story-btn" onClick={() => handleShareStory(instance)}>
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const StoryView: React.FC<StoryViewProps> = ({
  template,
  savedInstance,
  onBackToRead,
  onUpdateSavedStory,
  onPlayTemplate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState<{ [itemId: string]: string }>({});
  const [editedTitle, setEditedTitle] = useState(savedInstance.customTitle || template.title);

  // Update local state when savedInstance prop changes
  useEffect(() => {
    setEditedTitle(savedInstance.customTitle || template.title);
  }, [savedInstance, template.title]);

  const handleEdit = () => {
    // Initialize edited values with current values
    setEditedValues({ ...savedInstance.blankValues });
    setEditedTitle(savedInstance.customTitle || template.title);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedStory: SavedStory = {
      ...savedInstance,
      blankValues: editedValues,
      customTitle:
        editedTitle.trim() !== template.title ? editedTitle.trim() : savedInstance.customTitle,
    };

    onUpdateSavedStory(updatedStory);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedValues({});
    setEditedTitle(savedInstance.customTitle || template.title);
    setIsEditing(false);
  };

  const updateBlankValue = (itemId: string, value: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const renderEditableContent = () => {
    return (
      <div className="edit-story-form">
        <div className="edit-title-section">
          <label className="edit-title-label">Story Title:</label>
          <input
            type="text"
            className="edit-title-input"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="Enter story title..."
          />
        </div>

        <div className="edit-blanks-section">
          <h3>Edit Blank Values:</h3>
          <div className="edit-blanks-grid">
            {(template.sentences || [])
              .flatMap((sentence) => sentence.content || [])
              .filter((item) => item.type === 'blank')
              .map((item, index) => {
                const blankItem = item as any;
                return (
                  <div key={item.id} className="edit-blank-item">
                    <label className="edit-blank-label">
                      {index + 1}. {blankItem.blank.partOfSpeech}
                      {blankItem.blank.hint && (
                        <span className="edit-blank-hint"> ({blankItem.blank.hint})</span>
                      )}
                    </label>
                    <input
                      type="text"
                      className={`edit-blank-input ${
                        !editedValues[item.id] || editedValues[item.id].trim() === ''
                          ? 'edit-blank-input-missing'
                          : ''
                      }`}
                      value={editedValues[item.id] || ''}
                      onChange={(e) => updateBlankValue(item.id, e.target.value)}
                      placeholder={`Enter a ${blankItem.blank.partOfSpeech.toLowerCase()}...`}
                    />
                  </div>
                );
              })}
          </div>
        </div>

        <div className="edit-preview-section">
          <h3>Preview:</h3>
          <div className="story-display">
            {(template.sentences || []).map((sentence, sentenceIndex) => (
              <div key={`sentence-${sentenceIndex}`} className="story-sentence">
                {(sentence.content || []).map((item, index) => {
                  if (item.type === 'text') {
                    return (
                      <span key={`text-${index}`} className="story-text">
                        {item.textContent}
                      </span>
                    );
                  } else {
                    const blankValue = editedValues[item.id] || '[missing]';
                    return (
                      <strong key={`blank-${index}`} className="filled-blank">
                        {blankValue}
                      </strong>
                    );
                  }
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStoryContent = () => {
    return (template.sentences || []).map((sentence, sentenceIndex) => (
      <div key={`sentence-${sentenceIndex}`} className="story-sentence">
        {(sentence.content || []).map((item, index) => {
          if (item.type === 'text') {
            return (
              <span key={`text-${index}`} className="story-text">
                {item.textContent}
              </span>
            );
          } else {
            const blankValue = savedInstance.blankValues[item.id] || '[missing]';
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

  const displayTitle = savedInstance.customTitle || template.title;

  // Check for missing blank values
  const getMissingBlanks = () => {
    const allBlanks = (template.sentences || [])
      .flatMap((sentence) => sentence.content || [])
      .filter((item) => item.type === 'blank');

    return allBlanks.filter(
      (blank) =>
        !savedInstance.blankValues[blank.id] || savedInstance.blankValues[blank.id].trim() === '',
    );
  };

  const missingBlanks = getMissingBlanks();
  const hasMissingBlanks = missingBlanks.length > 0;

  return (
    <div className="story-view">
      <div className="story-view-header">
        <h2>{displayTitle}</h2>
        {savedInstance.customTitle && (
          <div className="template-info">
            <span className="template-title">Template: {template.title}</span>
          </div>
        )}
        <div className="story-view-meta">
          <span className="saved-date">
            Saved on {savedInstance.savedAt.toLocaleDateString()} at{' '}
            {savedInstance.savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {hasMissingBlanks && !isEditing && (
          <div className="missing-blanks-warning">
            <div className="warning-content">
              <span className="warning-icon">⚠️</span>
              <span className="warning-text">
                This story has {missingBlanks.length} missing blank value
                {missingBlanks.length !== 1 ? 's' : ''}.
              </span>
              <button className="fix-blanks-btn" onClick={handleEdit}>
                Fix Missing Values
              </button>
            </div>
          </div>
        )}
        <div className="story-view-actions">
          {isEditing ? (
            <>
              <button className="save-edit-btn" onClick={handleSave}>
                Save Changes
              </button>
              <button className="cancel-edit-btn" onClick={handleCancel}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="edit-story-btn" onClick={handleEdit}>
                Edit {savedInstance.customTitle ?? 'Story'}
              </button>
              <button className="play-template-btn" onClick={() => onPlayTemplate(template)}>
                Play {template.title} Again
              </button>
            </>
          )}
          <button className="back-btn" onClick={onBackToRead}>
            ← Back to Saved Stories
          </button>
        </div>
      </div>

      {isEditing ? (
        renderEditableContent()
      ) : (
        <div className="story-display">{renderStoryContent()}</div>
      )}
    </div>
  );
};

export default ReadView;
