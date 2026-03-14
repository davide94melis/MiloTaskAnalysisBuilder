import { TaskCardRecord } from './task-library.models';

export interface TaskStepSymbolRecord {
  library: string;
  key: string;
  label: string;
}

export interface TaskStepImageRecord {
  mediaId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  url: string;
}

export interface TaskStepVisualSupportRecord {
  text: string;
  symbol: TaskStepSymbolRecord | null;
  image: TaskStepImageRecord | null;
}

export type TaskStepUploadStatus = 'idle' | 'uploading' | 'uploaded' | 'error';

export interface TaskStepUploadStateRecord {
  status: TaskStepUploadStatus;
  errorMessage: string;
  localPreviewUrl: string | null;
  pendingPersistence: boolean;
}

export interface TaskMediaUploadRecord extends TaskStepImageRecord {
  taskId: string;
}

export interface TaskStepDraftRecord {
  id: string;
  position: number;
  title: string;
  description: string;
  required: boolean;
  supportGuidance: string;
  reinforcementNotes: string;
  estimatedMinutes: number | null;
  visualSupport: TaskStepVisualSupportRecord;
  uploadState: TaskStepUploadStateRecord | null;
}

export interface RelatedVariantRecord {
  id: string;
  title: string;
  supportLevel: string;
  variantRole: 'root' | 'variant';
  lastUpdatedAt: string;
}

export interface TaskDetailRecord extends TaskCardRecord {
  description: string;
  educationalObjective: string;
  professionalNotes: string;
  difficultyLevel: string;
  environmentLabel: string;
  relatedVariants?: RelatedVariantRecord[];
  steps: TaskStepDraftRecord[];
}

export interface UpdateTaskStepRequestRecord {
  id: string;
  position: number;
  title: string;
  description: string;
  required: boolean;
  supportGuidance: string;
  reinforcementNotes: string;
  estimatedMinutes: number | null;
  visualSupport: TaskStepVisualSupportRecord;
}

export interface UpdateTaskDetailRequest {
  title: string;
  category: string;
  description: string;
  educationalObjective: string;
  professionalNotes: string;
  targetLabel: string;
  difficultyLevel: string;
  environmentLabel: string;
  visibility: string;
  supportLevel: string;
  steps: UpdateTaskStepRequestRecord[];
}

export function createEmptyVisualSupport(): TaskStepVisualSupportRecord {
  return {
    text: '',
    symbol: null,
    image: null
  };
}

export function createIdleUploadState(): TaskStepUploadStateRecord {
  return {
    status: 'idle',
    errorMessage: '',
    localPreviewUrl: null,
    pendingPersistence: false
  };
}
