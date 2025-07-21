export type AppMode = 'main' | 'edit' | 'play' | 'read';

export interface Blank {
  partOfSpeech: string;
  hint?: string;
  value?: string;
}

export interface Template {
  id: string;
  title: string;
  sentences: TemplateSentence[];
}

export interface TemplateSentence {
  id: string;
  content: TemplateContent;
}

export type TemplateContent = TemplateContentItem[];

export type TemplateContentItem = TemplateContentItemText | TemplateContentItemBlank;

export interface TemplateContentItemText {
  id: string;
  type: 'text';
  textContent: string;
}

export interface TemplateContentItemBlank {
  id: string;
  type: 'blank';
  blank: Blank;
}

export interface SavedStory {
  id: string;
  storyId: string;
  savedAt: Date;
  blankValues: { [itemId: string]: string };
  customTitle?: string;
  authorName?: string;
}

export interface AppState {
  mode: AppMode;
  current: Template | null;
  templates: Template[];
  savedStories: SavedStory[];
}
