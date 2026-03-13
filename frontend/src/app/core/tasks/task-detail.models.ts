import { TaskCardRecord } from './task-library.models';

export interface TaskStepDraftRecord {
  id: string;
  position: number;
  title: string;
  description: string;
  required: boolean;
  supportGuidance: string;
  reinforcementNotes: string;
  estimatedMinutes: number | null;
}

export interface TaskDetailRecord extends TaskCardRecord {
  description: string;
  educationalObjective: string;
  professionalNotes: string;
  difficultyLevel: string;
  environmentLabel: string;
  steps: TaskStepDraftRecord[];
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
  steps: TaskStepDraftRecord[];
}
