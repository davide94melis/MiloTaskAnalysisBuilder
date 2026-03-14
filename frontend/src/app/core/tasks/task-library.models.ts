export type TaskStatus = 'draft' | 'template' | 'shared';
export type TaskVariantRole = 'standalone' | 'root' | 'variant';
export type TaskShareMode = 'view' | 'present';

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
  variantFamilyId?: string | null;
  variantRootTaskId?: string | null;
  variantRootTitle?: string | null;
  variantRole?: TaskVariantRole;
  variantCount?: number;
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
  title?: string;
}

export interface CreateTaskVariantRequest {
  supportLevel: string;
  title?: string;
}

export interface CreateTaskShareRequest {
  mode: TaskShareMode;
}

export interface TaskShareSummaryRecord {
  id: string;
  taskId: string;
  mode: TaskShareMode;
  token: string;
  shareUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}

export interface PublicTaskShareVisualSupportRecord {
  text: string;
  symbol: {
    library: string;
    key: string;
    label: string;
  } | null;
  image: {
    mediaId: string;
    storageKey: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    width: number | null;
    height: number | null;
    altText: string | null;
    url: string;
  } | null;
}

export interface PublicTaskShareStepRecord {
  id: string;
  position: number;
  title: string;
  description: string;
  required: boolean;
  supportGuidance: string;
  reinforcementNotes: string;
  estimatedMinutes: number | null;
  visualSupport: PublicTaskShareVisualSupportRecord;
}

export interface PublicTaskShareRecord {
  token: string;
  mode: TaskShareMode;
  title: string;
  description: string;
  educationalObjective: string;
  supportLevel: string;
  steps: PublicTaskShareStepRecord[];
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
