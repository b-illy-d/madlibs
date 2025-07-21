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
  onLoadTemplate: (template: Template, savedStories: SavedStory[]) => void;
}

const MainView: React.FC<MainViewProps> = ({
  stories,
  savedInstances,
  onCreateNew,
  onEditTemplate,
  onPlayTemplate,
  onDeleteTemplate,
  onReadStories,
  onLoadTemplate,
}) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Validate JSON structure
        if (!jsonData.template || !jsonData.savedStories) {
          alert('Invalid template file format. Please select a valid template export.');
          return;
        }

        // Generate new IDs to avoid conflicts
        const newTemplateId = Date.now().toString();
        const updatedTemplate = {
          ...jsonData.template,
          id: newTemplateId,
          title: jsonData.template.title + ' (Imported)'
        };

        // Update saved stories to reference the new template ID
        const updatedSavedStories = jsonData.savedStories.map((story: any) => ({
          ...story,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          storyId: newTemplateId,
          savedAt: new Date(story.savedAt)
        }));

        onLoadTemplate(updatedTemplate, updatedSavedStories);
        
        // Clear the input for future uploads
        event.target.value = '';
        
      } catch (error) {
        console.error('Error parsing template file:', error);
        alert('Error reading template file. Please make sure it\'s a valid JSON export.');
      }
    };

    reader.readAsText(file);
  };
  return (
    <div className="main-view">
      <div className="main-header">
        <h2>Your Templates</h2>
        <div className="main-header-actions">
          <button className="read-all-stories-btn" onClick={() => onReadStories()}>
            Read Saved Stories
          </button>
          <div className="load-template-container">
            <input
              type="file"
              id="template-upload"
              accept=".json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button 
              className="load-template-btn" 
              onClick={() => document.getElementById('template-upload')?.click()}
            >
              Load Template
            </button>
          </div>
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

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Create export data with template and related saved stories
    const exportData = {
      template: story,
      savedStories: savedInstances,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };

    // Convert to JSON string
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `${story.title || 'template'}-export.json`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        <button className="download-story-btn" onClick={handleDownload}>
          Download
        </button>
        <button className="delete-story-btn" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default MainView;
