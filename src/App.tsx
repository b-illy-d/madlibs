import React, { useState, useEffect } from 'react';
import './App.css';
import { AppMode, AppState, Template, SavedStory } from './types';
import EditMode from './components/EditMode';
import MainView from './components/MainView';
import PlayMode from './components/PlayMode';
import ReadView from './components/ReadView';
import mollyTemplate from './stories/molly/template';
import mollySavedStories from './stories/molly/saved.json';

function App() {
  const [appState, setAppState] = useState<AppState>({
    mode: 'main',
    current: null,
    templates: [],
    savedStories: [],
  });

  const [initialTemplateFilter, setInitialTemplateFilter] = useState<string | undefined>(undefined);
  const [viewStoryAfterSave, setViewStoryAfterSave] = useState<SavedStory | null>(null);

  // Load stories and saved instances from localStorage on startup
  useEffect(() => {
    try {
      const savedStories = JSON.parse(localStorage.getItem('madlibs-stories') || '[]');
      
      // Migrate old template structure to new sentence structure
      const migratedTemplates = savedStories.map((template: any) => {
        // Check if template is using old structure (has 'content' instead of 'sentences')
        if (template.content && !template.sentences) {
          return {
            ...template,
            sentences: template.content.length > 0 ? [{
              id: `sentence-${Date.now()}-migrated`,
              content: template.content
            }] : []
          };
        }
        // Template already has new structure or is empty
        return {
          ...template,
          sentences: template.sentences || []
        };
      });

      // Load hard-coded templates and stories
      const hardCodedTemplates = [mollyTemplate as Template];
      const hardCodedSavedStories = mollySavedStories.map((story: any) => ({
        ...story,
        savedAt: new Date(story.savedAt)
      }));

      // De-duplicate templates by ID - localStorage takes precedence over hard-coded
      const allTemplates = [...migratedTemplates];
      hardCodedTemplates.forEach(hardCodedTemplate => {
        const existsInLocalStorage = migratedTemplates.some((t: Template) => t.id === hardCodedTemplate.id);
        if (!existsInLocalStorage) {
          allTemplates.push(hardCodedTemplate);
        }
      });
      
      const savedInstances = JSON.parse(
        localStorage.getItem('madlibs-saved-instances') || '[]',
      ).map((instance: any) => ({
        ...instance,
        savedAt: new Date(instance.savedAt),
      }));

      // Merge hard-coded saved stories with localStorage saved stories
      // De-duplicate by ID - localStorage takes precedence
      const allSavedStories = [...savedInstances];
      hardCodedSavedStories.forEach((hardCodedStory: SavedStory) => {
        const existsInLocalStorage = savedInstances.some((s: SavedStory) => s.id === hardCodedStory.id);
        if (!existsInLocalStorage) {
          allSavedStories.push(hardCodedStory);
        }
      });
      
      // Save merged data back to localStorage if new data was added
      const templatesChanged = allTemplates.length > migratedTemplates.length;
      const storiesChanged = allSavedStories.length > savedInstances.length;
      
      if (templatesChanged) {
        localStorage.setItem('madlibs-stories', JSON.stringify(allTemplates));
      }
      if (storiesChanged) {
        localStorage.setItem('madlibs-saved-instances', JSON.stringify(allSavedStories));
      }
      
      setAppState((prev) => ({
        ...prev,
        templates: allTemplates,
        savedStories: allSavedStories,
      }));
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
    }
  }, []);

  const setMode = (mode: AppMode) => {
    setAppState((prev) => ({ ...prev, mode }));
  };

  const saveStory = (story: Template) => {
    const updatedTemplates = [...appState.templates.filter((s) => s.id !== story.id), story];
    setAppState((prev) => ({
      ...prev,
      templates: updatedTemplates,
      current: story,
    }));
  };

  const createNewStory = () => {
    const newStory: Template = {
      id: Date.now().toString(),
      title: '',
      sentences: [],
    };
    setAppState((prev) => ({
      ...prev,
      mode: 'edit',
      current: newStory,
    }));
  };

  const editTemplate = (template: Template) => {
    setAppState((prev) => ({
      ...prev,
      mode: 'edit',
      current: template,
    }));
  };

  const playTemplate = (template: Template) => {
    setAppState((prev) => ({
      ...prev,
      mode: 'play',
      current: template,
    }));
  };

  const deleteTemplate = (id: string) => {
    try {
      const updatedTemplates = appState.templates.filter((s) => s.id !== id);
      const updatedInstances = appState.savedStories.filter((i) => i.storyId !== id);

      // Update localStorage
      localStorage.setItem('madlibs-stories', JSON.stringify(updatedTemplates));
      localStorage.setItem('madlibs-saved-instances', JSON.stringify(updatedInstances));

      // Update state
      setAppState((prev) => ({
        ...prev,
        templates: updatedTemplates,
        savedStories: updatedInstances,
        current: prev.current?.id === id ? null : prev.current,
      }));
    } catch (error) {
      console.error('Failed to delete story:', error);
      alert('Failed to delete story. Please try again.');
    }
  };

  const saveStoryInstance = (instance: SavedStory) => {
    try {
      const updatedInstances = [...appState.savedStories, instance];

      // Update localStorage
      localStorage.setItem('madlibs-saved-instances', JSON.stringify(updatedInstances));

      // Update state
      setAppState((prev) => ({
        ...prev,
        savedStories: updatedInstances,
      }));

      // Set the story to view and navigate to read mode
      setViewStoryAfterSave(instance);
      setMode('read');
    } catch (error) {
      console.error('Failed to save story instance:', error);
      alert('Failed to save story. Please try again.');
    }
  };

  const updateSavedStory = (updatedStory: SavedStory) => {
    try {
      const updatedInstances = appState.savedStories.map((story) =>
        story.id === updatedStory.id ? updatedStory : story,
      );

      // Update localStorage
      localStorage.setItem('madlibs-saved-instances', JSON.stringify(updatedInstances));

      // Update state
      setAppState((prev) => ({
        ...prev,
        savedStories: updatedInstances,
      }));
    } catch (error) {
      console.error('Failed to update story:', error);
      alert('Failed to update story. Please try again.');
    }
  };

  const deleteSavedStory = (storyId: string) => {
    try {
      const updatedInstances = appState.savedStories.filter((story) => story.id !== storyId);

      // Update localStorage
      localStorage.setItem('madlibs-saved-instances', JSON.stringify(updatedInstances));

      // Update state
      setAppState((prev) => ({
        ...prev,
        savedStories: updatedInstances,
      }));
    } catch (error) {
      console.error('Failed to delete saved story:', error);
      alert('Failed to delete saved story. Please try again.');
    }
  };


  return (
    <div className="App">
      <header className="app-header">
        <h1>Madlibs Creator</h1>
        <nav className="mode-nav">
          <button
            className={appState.mode === 'main' ? 'active' : ''}
            onClick={() => setMode('main')}
          >
            Templates
          </button>
          <button
            className={appState.mode === 'read' ? 'active' : ''}
            onClick={() => {
              setInitialTemplateFilter(undefined);
              setViewStoryAfterSave(null);
              setMode('read');
            }}
          >
            Stories
          </button>
        </nav>
      </header>

      <main className="app-main">
        {appState.mode === 'main' && (
          <MainView
            stories={appState.templates}
            savedInstances={appState.savedStories}
            onCreateNew={createNewStory}
            onEditTemplate={editTemplate}
            onPlayTemplate={playTemplate}
            onDeleteTemplate={deleteTemplate}
            onReadStories={(templateId?: string) => {
              setInitialTemplateFilter(templateId);
              setMode('read');
            }}
          />
        )}
        {appState.mode === 'edit' && appState.current && (
          <EditMode
            story={appState.current}
            onSaveStory={saveStory}
            onBackToMain={() => setMode('main')}
          />
        )}
        {appState.mode === 'play' && appState.current && (
          <PlayMode
            story={appState.current}
            onBackToMain={() => setMode('main')}
            onSaveStoryInstance={saveStoryInstance}
          />
        )}
        {appState.mode === 'read' && (
          <ReadView
            templates={appState.templates}
            savedInstances={appState.savedStories}
            onBackToMain={() => {
              setInitialTemplateFilter(undefined);
              setViewStoryAfterSave(null);
              setMode('main');
            }}
            onUpdateSavedStory={updateSavedStory}
            onDeleteSavedStory={deleteSavedStory}
            onPlayTemplate={playTemplate}
            initialTemplateFilter={initialTemplateFilter}
            viewSpecificStory={viewStoryAfterSave}
          />
        )}
      </main>
    </div>
  );
}

export default App;
