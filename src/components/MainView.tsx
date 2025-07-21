import React from 'react';
import { Template, SavedStory } from '../types';

interface MainViewProps {
  stories: Template[];
  savedInstances: SavedStory[];
  onCreateNew: () => void;
  onEditTemplate: (template: Template) => void;
  onPlayTemplate: (template: Template) => void;
  onDeleteTemplate: (id: string) => void;
  onReadStories: (templateId?: string) => void;
}

const MainView: React.FC<MainViewProps> = ({
  stories,
  savedInstances,
  onCreateNew,
  onEditTemplate,
  onPlayTemplate,
  onDeleteTemplate,
  onReadStories,
}) => {
  return (
    <div className="main-view">
      <div className="main-header">
        <h2>Your Templates</h2>
        <div className="main-header-actions">
          <button className="read-all-stories-btn" onClick={() => onReadStories()}>
            Read Saved Stories
          </button>
          <button className="create-new-btn" onClick={onCreateNew}>
            Create New Template
          </button>
        </div>
      </div>

      {stories.length === 0 ? (
        <div className="empty-stories">
          <p>You haven't created any stories yet.</p>
          <p>Click "Create New Template" to get started!</p>
        </div>
      ) : (
        <div className="stories-list">
          {stories.map((story) => (
            <TemplateCard
              key={story.id}
              story={story}
              savedInstances={savedInstances.filter((instance) => instance.storyId === story.id)}
              onEdit={() => onEditTemplate(story)}
              onPlay={() => onPlayTemplate(story)}
              onDelete={() => onDeleteTemplate(story.id)}
              onReadStories={onReadStories}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface TemplateCardProps {
  story: Template;
  savedInstances: SavedStory[];
  onEdit: () => void;
  onPlay: () => void;
  onDelete: () => void;
  onReadStories: (templateId?: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  story,
  savedInstances,
  onEdit,
  onPlay,
  onDelete,
  onReadStories,
}) => {
  const getContentPreview = (): string => {
    if (!story.sentences || story.sentences.length === 0) return 'No content';

    const allContent = story.sentences.flatMap(sentence => sentence.content || []);
    if (allContent.length === 0) return 'No content';
    
    const preview = allContent
      .slice(0, 3)
      .map((item) => {
        if (item.type === 'text') {
          return item.textContent;
        } else {
          return `[${item.blank.partOfSpeech}]`;
        }
      })
      .join(' ');

    return allContent.length > 3 ? preview + '...' : preview;
  };

  const getBlankCount = (): number => {
    if (!story.sentences || story.sentences.length === 0) return 0;
    return story.sentences.flatMap(sentence => sentence.content || []).filter((item) => item.type === 'blank').length;
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${story.title}"?`)) {
      onDelete();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay();
  };


  return (
    <div className="story-card">
      <div className="story-card-header">
        <h3 className="story-title">{story.title}</h3>
        <button className="delete-btn" onClick={handleDelete}>
          ×
        </button>
      </div>

      <div className="story-preview">{getContentPreview()}</div>

      <div className="story-stats">
        <span className="content-count">
          {(story.sentences || []).length} sentence{(story.sentences || []).length !== 1 ? 's' : ''}
        </span>
        <span className="blank-count">
          {getBlankCount()} blank{getBlankCount() !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="story-actions">
        <button className="edit-story-btn" onClick={handleEdit}>
          Edit
        </button>
        <button className="play-story-btn" onClick={handlePlay}>
          Play
        </button>
        {savedInstances.length > 0 && (
          <button
            className="read-stories-btn"
            onClick={(e) => {
              e.stopPropagation();
              onReadStories(story.id);
            }}
          >
            Read ({savedInstances.length})
          </button>
        )}
        <button className="delete-story-btn" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default MainView;
