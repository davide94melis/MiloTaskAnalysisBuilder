import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AppConfigService } from '../config/app-config.service';
import { TaskLibraryService } from './task-library.service';

describe('TaskLibraryService', () => {
  let service: TaskLibraryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskLibraryService, AppConfigService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(TaskLibraryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests the dashboard summary', () => {
    service.getDashboard().subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/tasks/dashboard');
    expect(request.request.method).toBe('GET');
    request.flush({
      recentDrafts: [],
      seedTemplates: [],
      stats: { draftCount: 0, templateCount: 0, sharedCount: 0 }
    });
  });

  it('passes only filled filters when loading the library', () => {
    service
      .listLibrary({
        search: 'routine',
        category: '',
        context: 'Casa',
        targetLabel: '',
        author: '',
        status: 'draft',
        supportLevel: ''
      })
      .subscribe();

    const request = httpMock.expectOne((candidate) => candidate.url === 'http://localhost:8080/api/tasks');
    expect(request.request.params.get('search')).toBe('routine');
    expect(request.request.params.get('context')).toBe('Casa');
    expect(request.request.params.get('status')).toBe('draft');
    expect(request.request.params.has('category')).toBeFalse();
    request.flush({
      items: [],
      availableFilters: {
        categories: [],
        contexts: [],
        targetLabels: [],
        authors: [],
        statuses: [],
        supportLevels: []
      }
    });
  });

  it('creates a task shell from a template when templateId is provided', () => {
    service.createDraft({ templateId: 'tpl-1' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/tasks');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ templateId: 'tpl-1' });
    request.flush({
      id: 'task-1',
      title: 'Lavarsi le mani',
      category: 'Autonomia personale',
      contextLabel: 'Bagno',
      targetLabel: 'Bambino',
      supportLevel: 'Guidato',
      visibility: 'private',
      status: 'draft',
      stepCount: 6,
      lastUpdatedAt: '2026-03-13T10:15:30Z',
      authorName: 'teacher@example.com',
      sourceTaskId: 'tpl-1'
    });
  });
});
