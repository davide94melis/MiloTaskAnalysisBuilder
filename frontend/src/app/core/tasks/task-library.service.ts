import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { TaskDetailRecord, UpdateTaskDetailRequest } from './task-detail.models';
import {
  CreateTaskShellRequest,
  TaskCardRecord,
  TaskDashboardSummary,
  TaskLibraryFilters,
  TaskLibraryResponse
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

  createDraft(request: CreateTaskShellRequest = {}): Observable<TaskCardRecord> {
    return this.http.post<TaskCardRecord>(this.tasksUrl, request);
  }

  duplicateTask(taskId: string): Observable<TaskCardRecord> {
    return this.http.post<TaskCardRecord>(`${this.tasksUrl}/${taskId}/duplicate`, {});
  }
}
