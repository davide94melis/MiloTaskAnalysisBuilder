import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { TaskDetailRecord, TaskMediaUploadRecord, UpdateTaskDetailRequest } from './task-detail.models';
import {
  CreateTaskShareRequest,
  PublicTaskPresentRecord,
  CreateTaskShellRequest,
  CreateTaskVariantRequest,
  PublicTaskShareRecord,
  TaskCardRecord,
  TaskDashboardSummary,
  TaskLibraryFilters,
  TaskLibraryResponse,
  TaskShareMode,
  TaskShareSummaryRecord
} from './task-library.models';

@Injectable({ providedIn: 'root' })
export class TaskLibraryService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  private get tasksUrl(): string {
    return `${this.config.apiUrl}/tasks`;
  }

  private get templatesUrl(): string {
    return `${this.config.apiUrl}/templates`;
  }

  getDashboard(): Observable<TaskDashboardSummary> {
    return this.http.get<TaskDashboardSummary>(`${this.tasksUrl}/dashboard`);
  }

  listLibrary(filters: TaskLibraryFilters): Observable<TaskLibraryResponse> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        params = params.set(key, value);
      }
    }

    return this.http.get<TaskLibraryResponse>(this.tasksUrl, { params });
  }

  listTemplates(): Observable<TaskCardRecord[]> {
    return this.http.get<TaskCardRecord[]>(this.templatesUrl);
  }

  getTask(taskId: string): Observable<TaskCardRecord> {
    return this.http.get<TaskCardRecord>(`${this.tasksUrl}/${taskId}`);
  }

  getTaskDetail(taskId: string): Observable<TaskDetailRecord> {
    return this.http.get<TaskDetailRecord>(`${this.tasksUrl}/${taskId}`);
  }

  updateTask(taskId: string, request: UpdateTaskDetailRequest): Observable<TaskDetailRecord> {
    return this.http.put<TaskDetailRecord>(`${this.tasksUrl}/${taskId}`, request);
  }

  uploadTaskMedia(taskId: string, file: File): Observable<TaskMediaUploadRecord> {
    const payload = new FormData();
    payload.append('file', file);
    return this.http.post<TaskMediaUploadRecord>(`${this.tasksUrl}/${taskId}/media/uploads`, payload);
  }

  createDraft(request: CreateTaskShellRequest = {}): Observable<TaskCardRecord> {
    return this.http.post<TaskCardRecord>(this.tasksUrl, request);
  }

  duplicateTask(taskId: string): Observable<TaskCardRecord> {
    return this.http.post<TaskCardRecord>(`${this.tasksUrl}/${taskId}/duplicate`, {});
  }

  createVariant(taskId: string, request: CreateTaskVariantRequest): Observable<TaskCardRecord> {
    return this.http.post<TaskCardRecord>(this.tasksUrl, {
      title: request.title,
      variantSourceTaskId: taskId,
      supportLevel: request.supportLevel
    });
  }

  listTaskShares(taskId: string): Observable<TaskShareSummaryRecord[]> {
    return this.http.get<TaskShareSummaryRecord[]>(`${this.tasksUrl}/${taskId}/shares`);
  }

  createTaskShare(taskId: string, request: CreateTaskShareRequest): Observable<TaskShareSummaryRecord> {
    return this.http.post<TaskShareSummaryRecord>(`${this.tasksUrl}/${taskId}/shares`, request);
  }

  regenerateTaskShare(taskId: string, mode: TaskShareMode): Observable<TaskShareSummaryRecord> {
    return this.http.post<TaskShareSummaryRecord>(`${this.tasksUrl}/${taskId}/shares/${mode}/regenerate`, {});
  }

  revokeTaskShare(taskId: string, shareId: string): Observable<TaskShareSummaryRecord> {
    return this.http.delete<TaskShareSummaryRecord>(`${this.tasksUrl}/${taskId}/shares/${shareId}`);
  }

  getPublicTaskShare(token: string): Observable<PublicTaskShareRecord> {
    return this.http.get<PublicTaskShareRecord>(`${this.config.apiUrl}/public/shares/${token}`);
  }

  getPublicPresentTaskShare(token: string): Observable<PublicTaskPresentRecord> {
    return this.http.get<PublicTaskPresentRecord>(`${this.config.apiUrl}/public/shares/${token}/present`);
  }

  duplicateTaskFromShare(token: string): Observable<TaskCardRecord> {
    return this.http.post<TaskCardRecord>(`${this.config.apiUrl}/public/shares/${token}/duplicate`, {});
  }
}
