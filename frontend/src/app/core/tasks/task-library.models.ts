export type TaskStatus = 'draft' | 'template' | 'shared';

export interface TaskCardRecord {
  id: string;
  title: string;
  category: string;
  contextLabel: string;
  targetLabel: string;
  supportLevel: string;
  visibility: string;
  status: TaskStatus;
  stepCount: number;
  lastUpdatedAt: string;
  authorName: string;
  sourceTaskId?: string | null;
}

export interface TaskLibraryFilters {
  search: string;
  category: string;
  context: string;
  targetLabel: string;
  author: string;
  status: string;
  supportLevel: string;
}

export interface TaskLibraryFilterOptions {
  categories: string[];
  contexts: string[];
  targetLabels: string[];
  authors: string[];
  statuses: string[];
  supportLevels: string[];
}

export interface TaskLibraryResponse {
  items: TaskCardRecord[];
  availableFilters: TaskLibraryFilterOptions;
}

export interface TaskDashboardSummary {
  recentDrafts: TaskCardRecord[];
  seedTemplates: TaskCardRecord[];
  stats: {
    draftCount: number;
    templateCount: number;
    sharedCount: number;
  };
}

export interface CreateTaskShellRequest {
  templateId?: string;
}

export const EMPTY_LIBRARY_FILTERS: TaskLibraryFilters = {
  search: '',
  category: '',
  context: '',
  targetLabel: '',
  author: '',
  status: '',
  supportLevel: ''
};

export const EMPTY_LIBRARY_OPTIONS: TaskLibraryFilterOptions = {
  categories: [],
  contexts: [],
  targetLabels: [],
  authors: [],
  statuses: [],
  supportLevels: []
};
