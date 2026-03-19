import { convertToParamMap, provideRouter, Router, ActivatedRoute } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, of } from 'rxjs';

import { appRoutes } from '../../app.routes';
import {
  TaskDetailRecord,
  TaskStepDraftRecord,
  createEmptyVisualSupport,
  createIdleUploadState
} from '../../core/tasks/task-detail.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { TaskSessionSummaryRecord, TaskShareSummaryRecord } from '../../core/tasks/task-library.models';
import { TaskShellEditorEntryComponent } from './task-shell-editor-entry.component';
import { TaskStepsDraftListComponent } from './task-steps-draft-list.component';
import { TaskGuidedPresentPageComponent } from '../present/task-guided-present-page.component';
import { TaskPlaybackPreviewPageComponent } from '../present/task-playback-preview-page.component';
import { TaskPrintExportPageComponent } from '../present/task-print-export-page.component';

describe('TaskShellEditorEntryComponent', () => {
  const baseTask: TaskDetailRecord = {
    id: 'task-1',
    title: 'Lavarsi le mani',
    category: 'Autonomia personale',
    description: 'Sequenza visiva per il bagno.',
    educationalObjective: 'Consolidare l autonomia in bagno.',
    professionalNotes: 'Usare il supporto visivo vicino al lavabo.',
    contextLabel: 'Bagno',
    environmentLabel: 'Bagno di casa',
    targetLabel: 'Bambino',
    supportLevel: 'Guidato',
    difficultyLevel: 'Base',
    visibility: 'private',
    status: 'draft',
    stepCount: 2,
    lastUpdatedAt: '2026-03-13T10:15:30Z',
    authorName: 'teacher@example.com',
    sourceTaskId: null,
    variantFamilyId: 'task-1',
    variantRootTaskId: 'task-1',
    variantRootTitle: 'Lavarsi le mani',
    variantRole: 'root',
    variantCount: 3,
    relatedVariants: [
      {
        id: 'task-2',
        title: 'Lavarsi le mani',
        supportLevel: 'Visivo',
        variantRole: 'variant',
        lastUpdatedAt: '2026-03-13T10:30:00Z'
      },
      {
        id: 'task-3',
        title: 'Lavarsi le mani',
        supportLevel: 'Autonomo',
        variantRole: 'variant',
        lastUpdatedAt: '2026-03-13T10:45:00Z'
      }
    ],
    steps: [
      {
        id: 'step-1',
        position: 1,
        title: 'Apri il rubinetto',
        description: 'Ruota la manopola.',
        required: true,
        supportGuidance: 'Prompt verbale',
        reinforcementNotes: 'Bravo',
        estimatedMinutes: 1,
        visualSupport: {
          text: 'Apri',
          symbol: {
            library: 'symwriter',
            key: 'tap',
            label: 'Rubinetto'
          },
          image: null
        },
        uploadState: createIdleUploadState()
      },
      {
        id: 'step-2',
        position: 2,
        title: 'Prendi il sapone',
        description: 'Usa il dispenser.',
        required: false,
        supportGuidance: 'Modello visivo',
        reinforcementNotes: '',
        estimatedMinutes: 2,
        visualSupport: {
          text: 'Sapone',
          symbol: null,
          image: {
            mediaId: 'media-2',
            storageKey: 'tasks/task-1/media-2.png',
            fileName: 'sapone.png',
            mimeType: 'image/png',
            fileSizeBytes: 2048,
            width: 512,
            height: 512,
            altText: 'Dispenser del sapone',
            url: '/api/tasks/task-1/media/media-2/content'
          }
        },
        uploadState: createIdleUploadState()
      }
    ]
  };

  const viewShare: TaskShareSummaryRecord = {
    id: 'share-view',
    taskId: 'task-1',
    mode: 'view',
    token: 'sharetokenview',
    shareUrl: '/shared/sharetokenview',
    active: true,
    createdAt: '2026-03-13T10:40:00Z',
    updatedAt: '2026-03-13T10:40:00Z',
    revokedAt: null
  };

  const presentShare: TaskShareSummaryRecord = {
    id: 'share-present',
    taskId: 'task-1',
    mode: 'present',
    token: 'sharetokenpresent',
    shareUrl: '/shared/sharetokenpresent/present',
    active: true,
    createdAt: '2026-03-13T10:45:00Z',
    updatedAt: '2026-03-13T10:45:00Z',
    revokedAt: null
  };

  const recentSessions: TaskSessionSummaryRecord[] = [
    {
      id: 'session-1',
      taskId: 'task-1',
      ownerId: 'owner-1',
      shareId: null,
      accessContext: 'owner_present',
      stepCount: 2,
      completed: true,
      completedAt: '2026-03-14T09:40:00Z'
    },
    {
      id: 'session-2',
      taskId: 'task-1',
      ownerId: 'owner-1',
      shareId: 'share-present',
      accessContext: 'shared_present',
      stepCount: 2,
      completed: true,
      completedAt: '2026-03-14T09:35:00Z'
    },
    {
      id: 'session-3',
      taskId: 'task-1',
      ownerId: 'owner-1',
      shareId: null,
      accessContext: 'owner_present',
      stepCount: 2,
      completed: true,
      completedAt: '2026-03-14T09:30:00Z'
    },
    {
      id: 'session-4',
      taskId: 'task-1',
      ownerId: 'owner-1',
      shareId: null,
      accessContext: 'owner_present',
      stepCount: 2,
      completed: true,
      completedAt: '2026-03-14T09:25:00Z'
    },
    {
      id: 'session-5',
      taskId: 'task-1',
      ownerId: 'owner-1',
      shareId: null,
      accessContext: 'owner_present',
      stepCount: 2,
      completed: true,
      completedAt: '2026-03-14T09:20:00Z'
    },
    {
      id: 'session-6',
      taskId: 'task-1',
      ownerId: 'owner-1',
      shareId: null,
      accessContext: 'owner_present',
      stepCount: 2,
      completed: true,
      completedAt: '2026-03-14T09:15:00Z'
    }
  ];

  function openRailOverlay(fixture: { detectChanges: () => void }, host: HTMLElement, title: string): HTMLElement {
    const trigger = Array.from(host.querySelectorAll<HTMLButtonElement>('.entry__rail-button')).find(
      (button) => button.title === title
    );
    expect(trigger).withContext(`missing rail trigger for ${title}`).toBeDefined();
    trigger?.click();
    fixture.detectChanges();
    const overlay = host.querySelector<HTMLElement>('.entry__overlay');
    expect(overlay).withContext(`missing overlay for ${title}`).not.toBeNull();
    return overlay!;
  }

  function overlayButton(host: HTMLElement, label: string): HTMLButtonElement | undefined {
    return Array.from(host.querySelectorAll<HTMLButtonElement>('.entry__overlay button')).find(
      (button) => button.textContent?.trim() === label
    );
  }

  it('registers the authenticated preview, present, and export routes outside the editor path', () => {
    const shellRoute = appRoutes.find((route) => route.path === '');
    const previewRoute = shellRoute?.children?.find((route) => route.path === 'tasks/:taskId/preview');
    const presentRoute = shellRoute?.children?.find((route) => route.path === 'tasks/:taskId/present');
    const exportRoute = shellRoute?.children?.find((route) => route.path === 'tasks/:taskId/export');

    expect(previewRoute?.component).toBe(TaskPlaybackPreviewPageComponent);
    expect(presentRoute?.component).toBe(TaskGuidedPresentPageComponent);
    expect(exportRoute?.component).toBe(TaskPrintExportPageComponent);
  });

  it('renders a minimal top bar with rail-driven secondary entry points outside the main canvas', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-1' }));

    await TestBed.configureTestingModule({
      imports: [TaskShellEditorEntryComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params$.asObservable(),
            snapshot: { paramMap: params$.value }
          }
        },
        {
          provide: TaskLibraryService,
          useValue: {
            getTaskDetail: jasmine.createSpy('getTaskDetail').and.returnValue(of(baseTask)),
            updateTask: jasmine.createSpy('updateTask'),
            listTaskShares: jasmine.createSpy('listTaskShares').and.returnValue(of([])),
            listTaskSessions: jasmine.createSpy('listTaskSessions').and.returnValue(of([])),
            createTaskShare: jasmine.createSpy('createTaskShare'),
            regenerateTaskShare: jasmine.createSpy('regenerateTaskShare'),
            revokeTaskShare: jasmine.createSpy('revokeTaskShare'),
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask'),
            createVariant: jasmine.createSpy('createVariant')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskShellEditorEntryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const topbar = host.querySelector<HTMLElement>('.entry__topbar');
    const canvas = host.querySelector<HTMLElement>('.entry__canvas');
    const metadataForm = canvas?.querySelector('mtab-task-metadata-form');
    const railButtons = Array.from(host.querySelectorAll<HTMLButtonElement>('.entry__rail-button'));
    const canvasText = canvas?.textContent ?? '';

    expect(topbar?.textContent).toContain('Workspace task');
    expect(topbar?.textContent).toContain('Lavarsi le mani');
    expect(metadataForm).not.toBeNull();
    expect(canvas?.firstElementChild?.tagName.toLowerCase()).toBe('mtab-task-metadata-form');
    expect(host.querySelector('.entry__compatibility')).toBeNull();
    expect(railButtons.length).toBe(5);
    expect(railButtons.map((button) => button.title)).toEqual([
      'Azioni task salvata',
      'Condivisione pubblica',
      'Famiglia varianti',
      'Storico sessioni',
      'Supporto editor'
    ]);
    expect(canvasText).not.toContain('Supporto rapido');
    expect(canvasText).not.toContain('Stato editor');
    expect(canvasText).not.toContain('Azioni task salvata');
    expect(canvasText).not.toContain('Condivisione pubblica');
    expect(canvasText).not.toContain('Storico sessioni');
    expect(canvasText).not.toContain('Famiglia varianti');
  });

  it('tracks compact rail open and closed state through the workspace toggle', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-1' }));

    await TestBed.configureTestingModule({
      imports: [TaskShellEditorEntryComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params$.asObservable(),
            snapshot: { paramMap: params$.value }
          }
        },
        {
          provide: TaskLibraryService,
          useValue: {
            getTaskDetail: jasmine.createSpy('getTaskDetail').and.returnValue(of(baseTask)),
            updateTask: jasmine.createSpy('updateTask'),
            listTaskShares: jasmine.createSpy('listTaskShares').and.returnValue(of([])),
            listTaskSessions: jasmine.createSpy('listTaskSessions').and.returnValue(of([])),
            createTaskShare: jasmine.createSpy('createTaskShare'),
            regenerateTaskShare: jasmine.createSpy('regenerateTaskShare'),
            revokeTaskShare: jasmine.createSpy('revokeTaskShare'),
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask'),
            createVariant: jasmine.createSpy('createVariant')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskShellEditorEntryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const toggle = host.querySelector<HTMLButtonElement>('.entry__rail-toggle');
    const workspace = host.querySelector<HTMLElement>('.entry__workspace');
    const rail = host.querySelector<HTMLElement>('.entry__rail');

    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(toggle?.classList.contains('entry__rail-toggle--open')).toBeFalse();
    expect(workspace?.classList.contains('entry__workspace--rail-open')).toBeFalse();
    expect(rail?.getAttribute('data-state')).toBe('closed');

    toggle?.click();
    fixture.detectChanges();

    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(toggle?.classList.contains('entry__rail-toggle--open')).toBeTrue();
    expect(workspace?.classList.contains('entry__workspace--rail-open')).toBeTrue();
    expect(rail?.getAttribute('data-state')).toBe('open');

    toggle?.click();
    fixture.detectChanges();

    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(toggle?.classList.contains('entry__rail-toggle--open')).toBeFalse();
    expect(workspace?.classList.contains('entry__workspace--rail-open')).toBeFalse();
    expect(rail?.getAttribute('data-state')).toBe('closed');
  });

  it('loads detail data, retains draft upload state, and saves backend-aligned mixed visual support payloads', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-1' }));
    const getTaskDetail = jasmine.createSpy('getTaskDetail').and.returnValues(
      of(baseTask),
      of({
        ...baseTask,
        lastUpdatedAt: '2026-03-13T11:35:00Z',
        steps: [
          {
            ...baseTask.steps[0],
            visualSupport: {
              text: 'Apri bene',
              symbol: {
                library: 'symwriter',
                key: 'tap',
                label: 'Rubinetto'
              },
              image: {
                mediaId: 'media-9',
                storageKey: 'tasks/task-1/media-9.png',
                fileName: 'rubinetto.png',
                mimeType: 'image/png',
                fileSizeBytes: 3000,
                width: 640,
                height: 480,
                altText: 'Foto del rubinetto',
                url: '/api/tasks/task-1/media/media-9/content'
              }
            },
            uploadState: createIdleUploadState()
          },
          {
            ...baseTask.steps[1],
            visualSupport: {
              text: 'Sapone delicato',
              symbol: {
                library: 'symwriter',
                key: 'soap',
                label: 'Sapone'
              },
              image: null
            },
            uploadState: createIdleUploadState()
          }
        ]
      })
    );
    const updateTask = jasmine.createSpy('updateTask').and.callFake(
      (_taskId: string, request: { steps: Array<{ id: string; visualSupport: TaskStepDraftRecord['visualSupport'] }> }) =>
        of({
          ...baseTask,
          title: 'Lavarsi bene le mani',
          lastUpdatedAt: '2026-03-13T11:30:00Z',
          steps: request.steps.map((step, index) => ({
            ...(baseTask.steps.find((candidate) => candidate.id === step.id) ?? {
              description: '',
              supportGuidance: '',
              reinforcementNotes: '',
              estimatedMinutes: null,
              visualSupport: createEmptyVisualSupport(),
              uploadState: createIdleUploadState()
            }),
            ...step,
            position: index + 1,
            uploadState: createIdleUploadState()
          }))
        })
    );

    await TestBed.configureTestingModule({
      imports: [TaskShellEditorEntryComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params$.asObservable(),
            snapshot: { paramMap: params$.value }
          }
        },
        {
          provide: TaskLibraryService,
          useValue: {
            getTaskDetail,
            updateTask,
            listTaskShares: jasmine.createSpy('listTaskShares').and.returnValue(of([])),
            listTaskSessions: jasmine.createSpy('listTaskSessions').and.returnValue(of([])),
            createTaskShare: jasmine.createSpy('createTaskShare'),
            regenerateTaskShare: jasmine.createSpy('regenerateTaskShare'),
            revokeTaskShare: jasmine.createSpy('revokeTaskShare'),
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask'),
            createVariant: jasmine.createSpy('createVariant')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskShellEditorEntryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const titleInput = host.querySelector<HTMLInputElement>('input[formcontrolname="title"]');
    expect(titleInput?.value).toBe('Lavarsi le mani');

    const draftStep: TaskStepDraftRecord = {
      ...baseTask.steps[0],
      visualSupport: {
        text: 'Apri bene',
        symbol: {
          library: 'symwriter',
          key: 'tap',
          label: 'Rubinetto'
        },
        image: {
          mediaId: 'media-9',
          storageKey: 'tasks/task-1/media-9.png',
          fileName: 'rubinetto.png',
          mimeType: 'image/png',
          fileSizeBytes: 3000,
          width: 640,
          height: 480,
          altText: 'Foto del rubinetto',
          url: '/api/tasks/task-1/media/media-9/content'
        }
      },
      uploadState: {
        status: 'uploaded',
        errorMessage: '',
        localPreviewUrl: '/api/tasks/task-1/media/media-9/content',
        pendingPersistence: true
      }
    };

    const stepsList = fixture.debugElement.query(By.directive(TaskStepsDraftListComponent)).componentInstance as TaskStepsDraftListComponent;
    stepsList.stepsChange.emit([
      draftStep,
      {
        ...baseTask.steps[1],
        visualSupport: {
          text: 'Sapone delicato',
          symbol: {
            library: 'symwriter',
            key: 'soap',
            label: 'Sapone'
          },
          image: null
        }
      }
    ]);
    fixture.detectChanges();

    expect(host.textContent).toContain('immagine/i caricate in bozza');

    titleInput!.value = 'Lavarsi bene le mani';
    titleInput!.dispatchEvent(new Event('input'));

    const saveButton = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Salva task'
    );
    saveButton?.click();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(updateTask).toHaveBeenCalled();
    const submittedRequest = updateTask.calls.mostRecent().args[1];
    expect(submittedRequest.title).toBe('Lavarsi bene le mani');
    expect(submittedRequest.steps[0].visualSupport.text).toBe('Apri bene');
    expect(submittedRequest.steps[0].visualSupport.image.mediaId).toBe('media-9');
    expect(submittedRequest.steps[1].visualSupport.text).toBe('Sapone delicato');
    expect(submittedRequest.steps[1].visualSupport.symbol?.key).toBe('soap');
    expect(submittedRequest.steps[0].uploadState).toBeUndefined();
    expect(host.textContent).toContain('Task salvata con i supporti visivi correnti.');

    params$.next(convertToParamMap({ taskId: 'task-1' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const routeComponent = fixture.componentInstance as unknown as { steps: () => TaskStepDraftRecord[] };
    expect(routeComponent.steps()[0].visualSupport.image?.mediaId).toBe('media-9');
    expect(routeComponent.steps()[0].uploadState?.pendingPersistence).toBeFalse();
    expect(routeComponent.steps()[1].visualSupport.text).toBe('Sapone delicato');
    expect(routeComponent.steps()[1].visualSupport.symbol?.key).toBe('soap');
  });

  it('creates a draft and redirects when the route has no task id', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({}));
    const createDraft = jasmine.createSpy('createDraft').and.returnValue(
      of({
        id: 'task-new',
        title: 'Nuova task',
        category: '',
        contextLabel: '',
        targetLabel: '',
        supportLevel: '',
        visibility: 'private',
        status: 'draft',
        stepCount: 0,
        lastUpdatedAt: '2026-03-13T10:15:30Z',
        authorName: 'teacher@example.com',
        sourceTaskId: null
      })
    );

    await TestBed.configureTestingModule({
      imports: [TaskShellEditorEntryComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params$.asObservable(),
            snapshot: { paramMap: params$.value }
          }
        },
        {
          provide: TaskLibraryService,
          useValue: {
            getTaskDetail: jasmine.createSpy('getTaskDetail'),
            updateTask: jasmine.createSpy('updateTask'),
            listTaskShares: jasmine.createSpy('listTaskShares').and.returnValue(of([])),
            listTaskSessions: jasmine.createSpy('listTaskSessions').and.returnValue(of([])),
            createTaskShare: jasmine.createSpy('createTaskShare'),
            regenerateTaskShare: jasmine.createSpy('regenerateTaskShare'),
            revokeTaskShare: jasmine.createSpy('revokeTaskShare'),
            createDraft,
            duplicateTask: jasmine.createSpy('duplicateTask'),
            createVariant: jasmine.createSpy('createVariant')
          }
        }
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = TestBed.createComponent(TaskShellEditorEntryComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(createDraft).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'task-new'], { replaceUrl: true });
  });

  it('opens playback surfaces only for the saved task payload and blocks launch while media is pending persistence', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-1' }));
    const getTaskDetail = jasmine.createSpy('getTaskDetail').and.returnValue(of(baseTask));

    await TestBed.configureTestingModule({
      imports: [TaskShellEditorEntryComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params$.asObservable(),
            snapshot: { paramMap: params$.value }
          }
        },
        {
          provide: TaskLibraryService,
          useValue: {
            getTaskDetail,
            updateTask: jasmine.createSpy('updateTask'),
            listTaskShares: jasmine.createSpy('listTaskShares').and.returnValue(of([])),
            listTaskSessions: jasmine.createSpy('listTaskSessions').and.returnValue(of([])),
            createTaskShare: jasmine.createSpy('createTaskShare'),
            regenerateTaskShare: jasmine.createSpy('regenerateTaskShare'),
            revokeTaskShare: jasmine.createSpy('revokeTaskShare'),
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask'),
            createVariant: jasmine.createSpy('createVariant')
          }
        }
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = TestBed.createComponent(TaskShellEditorEntryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const stepsList = fixture.debugElement.query(By.directive(TaskStepsDraftListComponent)).componentInstance as TaskStepsDraftListComponent;
    stepsList.stepsChange.emit([
      {
        ...baseTask.steps[0],
        visualSupport: {
          ...baseTask.steps[0].visualSupport,
          image: {
            mediaId: 'draft-media',
            storageKey: 'tasks/task-1/draft-media.png',
            fileName: 'bozza.png',
            mimeType: 'image/png',
            fileSizeBytes: 4096,
            width: 800,
            height: 600,
            altText: 'Bozza locale non salvata',
            url: '/api/tasks/task-1/media/draft-media/content'
          }
        },
        uploadState: {
          status: 'uploaded',
          errorMessage: '',
          localPreviewUrl: '/local-only-preview.png',
          pendingPersistence: true
        }
      },
      baseTask.steps[1]
    ]);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    openRailOverlay(fixture, host, 'Azioni task salvata');
    let previewButton = overlayButton(host, 'Verifica anteprima');
    let presentButton = overlayButton(host, 'Avvia modalita guidata');
    let exportButton = overlayButton(host, 'Esporta PDF');
    expect(previewButton?.disabled).toBeTrue();
    expect(presentButton?.disabled).toBeTrue();
    expect(exportButton?.disabled).toBeTrue();
    expect(host.textContent).toContain('Versione salvata da aggiornare');
    expect(host.textContent).toContain(
      'Salva prima la task per includere in anteprima, modalita guidata, export PDF e link pubblici le immagini ancora in bozza.'
    );
    previewButton?.click();
    presentButton?.click();
    exportButton?.click();
    expect(router.navigate).not.toHaveBeenCalled();

    stepsList.stepsChange.emit([
      {
        ...baseTask.steps[0],
        uploadState: createIdleUploadState()
      },
      baseTask.steps[1]
    ]);
    fixture.detectChanges();

    previewButton = overlayButton(host, 'Verifica anteprima');
    presentButton = overlayButton(host, 'Avvia modalita guidata');
    exportButton = overlayButton(host, 'Esporta PDF');
    expect(previewButton?.disabled).toBeFalse();
    expect(presentButton?.disabled).toBeFalse();
    expect(exportButton?.disabled).toBeFalse();
    expect(host.textContent).toContain('Versione salvata pronta');

    previewButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'task-1', 'preview']);
    expect(getTaskDetail).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain('Anteprima aperta sulla versione salvata della task.');

    presentButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'task-1', 'present']);
    expect(host.textContent).toContain('Modalita guidata aperta sulla versione salvata della task.');

    exportButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'task-1', 'export']);
    expect(host.textContent).toContain('Export PDF aperto sulla versione salvata della task.');
  });

  it('launches guided present mode for the currently opened saved variant only', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-2' }));
    const variantTask: TaskDetailRecord = {
      ...baseTask,
      id: 'task-2',
      supportLevel: 'Visivo',
      variantRole: 'variant',
      sourceTaskId: 'task-1',
      variantRootTaskId: 'task-1',
      variantRootTitle: 'Lavarsi le mani'
    };
    const getTaskDetail = jasmine.createSpy('getTaskDetail').and.returnValue(of(variantTask));

    await TestBed.configureTestingModule({
      imports: [TaskShellEditorEntryComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params$.asObservable(),
            snapshot: { paramMap: params$.value }
          }
        },
        {
          provide: TaskLibraryService,
          useValue: {
            getTaskDetail,
            updateTask: jasmine.createSpy('updateTask'),
            listTaskShares: jasmine.createSpy('listTaskShares').and.returnValue(of([])),
            listTaskSessions: jasmine.createSpy('listTaskSessions').and.returnValue(of([])),
            createTaskShare: jasmine.createSpy('createTaskShare'),
            regenerateTaskShare: jasmine.createSpy('regenerateTaskShare'),
            revokeTaskShare: jasmine.createSpy('revokeTaskShare'),
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask'),
            createVariant: jasmine.createSpy('createVariant')
          }
        }
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = TestBed.createComponent(TaskShellEditorEntryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    openRailOverlay(fixture, host, 'Azioni task salvata');
    const presentButton = overlayButton(host, 'Avvia modalita guidata');

    expect(presentButton?.disabled).toBeFalse();

    presentButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'task-2', 'present']);
    expect(router.navigate).not.toHaveBeenCalledWith(['/tasks', 'task-1', 'present']);
    expect(getTaskDetail).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain('Modalita guidata aperta sulla variante salvata corrente.');
  });

  it('shows total completions and the 5 most recent sessions for the opened task only', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-1' }));
    const getTaskDetail = jasmine.createSpy('getTaskDetail').and.returnValue(of(baseTask));
    const listTaskSessions = jasmine.createSpy('listTaskSessions').and.returnValue(of(recentSessions));

    await TestBed.configureTestingModule({
      imports: [TaskShellEditorEntryComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params$.asObservable(),
            snapshot: { paramMap: params$.value }
          }
        },
        {
          provide: TaskLibraryService,
          useValue: {
            getTaskDetail,
            updateTask: jasmine.createSpy('updateTask'),
            listTaskShares: jasmine.createSpy('listTaskShares').and.returnValue(of([])),
            listTaskSessions,
            createTaskShare: jasmine.createSpy('createTaskShare'),
            regenerateTaskShare: jasmine.createSpy('regenerateTaskShare'),
            revokeTaskShare: jasmine.createSpy('revokeTaskShare'),
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask'),
            createVariant: jasmine.createSpy('createVariant')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskShellEditorEntryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const overlay = openRailOverlay(fixture, host, 'Storico sessioni');
    const historyItems = overlay.querySelectorAll('.entry__history-item');

    expect(listTaskSessions).toHaveBeenCalledWith('task-1');
    expect(overlay.textContent).toContain('Storico sessioni');
    expect(overlay.textContent).toContain('Totale completamenti');
    expect(overlay.textContent).toContain('6');
    expect(historyItems.length).toBe(5);
    expect(overlay.textContent).toContain('Modalita guidata autenticata');
    expect(overlay.textContent).toContain('Link condiviso');
    expect(overlay.textContent).not.toContain('Nessuna sessione completata registrata per questa task.');
  });

  it('renders the empty history state when the current task has no recorded sessions', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-1' }));

    await TestBed.configureTestingModule({
      imports: [TaskShellEditorEntryComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params$.asObservable(),
            snapshot: { paramMap: params$.value }
          }
        },
        {
          provide: TaskLibraryService,
          useValue: {
            getTaskDetail: jasmine.createSpy('getTaskDetail').and.returnValue(of(baseTask)),
            updateTask: jasmine.createSpy('updateTask'),
            listTaskShares: jasmine.createSpy('listTaskShares').and.returnValue(of([])),
            listTaskSessions: jasmine.createSpy('listTaskSessions').and.returnValue(of([])),
            createTaskShare: jasmine.createSpy('createTaskShare'),
            regenerateTaskShare: jasmine.createSpy('regenerateTaskShare'),
            revokeTaskShare: jasmine.createSpy('revokeTaskShare'),
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask'),
            createVariant: jasmine.createSpy('createVariant')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskShellEditorEntryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const overlay = openRailOverlay(fixture, host, 'Storico sessioni');
    expect(overlay.textContent).toContain('Totale completamenti');
    expect(overlay.textContent).toContain('0');
    expect(overlay.textContent).toContain('Nessuna sessione completata registrata per questa task.');
  });

  it('renders family context, opens sibling navigation, and creates a new variant from the editor', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-1' }));
    const getTaskDetail = jasmine.createSpy('getTaskDetail').and.returnValue(of(baseTask));
    const createVariant = jasmine.createSpy('createVariant').and.returnValue(
      of({
        ...baseTask,
        id: 'task-4',
        supportLevel: 'Supportato',
        variantRole: 'variant',
        sourceTaskId: 'task-1'
      })
    );

    await TestBed.configureTestingModule({
      imports: [TaskShellEditorEntryComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params$.asObservable(),
            snapshot: { paramMap: params$.value }
          }
        },
        {
          provide: TaskLibraryService,
          useValue: {
            getTaskDetail,
            updateTask: jasmine.createSpy('updateTask'),
            listTaskShares: jasmine.createSpy('listTaskShares').and.returnValue(of([])),
            listTaskSessions: jasmine.createSpy('listTaskSessions').and.returnValue(of([])),
            createTaskShare: jasmine.createSpy('createTaskShare'),
            regenerateTaskShare: jasmine.createSpy('regenerateTaskShare'),
            revokeTaskShare: jasmine.createSpy('revokeTaskShare'),
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask'),
            createVariant
          }
        }
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(window, 'prompt').and.returnValue('Supportato');

    const fixture = TestBed.createComponent(TaskShellEditorEntryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const overlay = openRailOverlay(fixture, host, 'Famiglia varianti');
    expect(overlay.textContent).toContain('Famiglia varianti');
    expect(overlay.textContent).toContain('3 task nella famiglia');
    expect(overlay.textContent).toContain('Variante');
    expect(overlay.textContent).toContain('Visivo');

    const familyButtons = Array.from(overlay.querySelectorAll<HTMLButtonElement>('button')).filter((button) =>
      button.textContent?.includes('Visivo')
    );
    familyButtons[0].click();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'task-2']);

    const createVariantButton = Array.from(overlay.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes('Crea variante da questa task')
    );
    createVariantButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(createVariant).toHaveBeenCalledWith('task-1', { supportLevel: 'Supportato' });
    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'task-4']);
    expect(host.textContent).toContain('Variante creata. Apertura della nuova task in corso.');
  });

  it('renders separate view and present share controls and manages copy, regenerate, and revoke actions', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-1' }));
    const getTaskDetail = jasmine.createSpy('getTaskDetail').and.returnValue(of(baseTask));
    const listTaskShares = jasmine.createSpy('listTaskShares').and.returnValue(of([viewShare, presentShare]));
    const listTaskSessions = jasmine.createSpy('listTaskSessions').and.returnValue(of([]));
    const regenerateTaskShare = jasmine.createSpy('regenerateTaskShare').and.returnValue(
      of({
        ...presentShare,
        token: 'rotatedpresent',
        shareUrl: '/shared/rotatedpresent/present',
        updatedAt: '2026-03-13T11:00:00Z'
      })
    );
    const revokeTaskShare = jasmine.createSpy('revokeTaskShare').and.returnValue(
      of({
        ...viewShare,
        active: false,
        revokedAt: '2026-03-13T11:05:00Z',
        updatedAt: '2026-03-13T11:05:00Z'
      })
    );

    await TestBed.configureTestingModule({
      imports: [TaskShellEditorEntryComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params$.asObservable(),
            snapshot: { paramMap: params$.value }
          }
        },
        {
          provide: TaskLibraryService,
          useValue: {
            getTaskDetail,
            updateTask: jasmine.createSpy('updateTask'),
            listTaskShares,
            listTaskSessions,
            createTaskShare: jasmine.createSpy('createTaskShare'),
            regenerateTaskShare,
            revokeTaskShare,
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask'),
            createVariant: jasmine.createSpy('createVariant')
          }
        }
      ]
    }).compileComponents();

    const clipboard =
      navigator.clipboard ??
      ({
        writeText: async (_value: string) => undefined
      } as Clipboard);
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: clipboard,
        configurable: true
      });
    }
    const writeText = spyOn(clipboard, 'writeText').and.returnValue(Promise.resolve());

    const fixture = TestBed.createComponent(TaskShellEditorEntryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const overlay = openRailOverlay(fixture, host, 'Condivisione pubblica');
    const shareCards = overlay.querySelectorAll<HTMLElement>('.entry__share-card');
    expect(listTaskShares).toHaveBeenCalledWith('task-1');
    expect(overlay.textContent).toContain('Condivisione pubblica');
    expect(shareCards.length).toBe(2);
    expect(shareCards[0].textContent).toContain('Vista');
    expect(shareCards[1].textContent).toContain('Presenta');
    expect(overlay.textContent).toContain('/shared/sharetokenview');
    expect(overlay.textContent).toContain('/shared/sharetokenpresent/present');

    const viewButtons = shareCards[0].querySelectorAll<HTMLButtonElement>('button');
    viewButtons[1].click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith(jasmine.stringMatching('/shared/sharetokenview$') as unknown as string);
    expect(overlay.textContent).toContain('Link vista copiato negli appunti.');

    const presentButtons = shareCards[1].querySelectorAll<HTMLButtonElement>('button');
    presentButtons[2].click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(regenerateTaskShare).toHaveBeenCalledWith('task-1', 'present');
    expect(overlay.textContent).toContain('rotatedpresent/present');
    expect(overlay.textContent).toContain('Il token precedente non e piu valido.');

    viewButtons[3].click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(revokeTaskShare).toHaveBeenCalledWith('task-1', 'share-view');
    expect(shareCards[0].textContent).toContain('Non creato');
    expect(shareCards[0].textContent).not.toContain('/shared/sharetokenview');
    expect(overlay.textContent).toContain('Link vista revocato.');
  });

  it('keeps share actions behind the saved-only boundary and creates missing mode links explicitly', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-1' }));
    const getTaskDetail = jasmine.createSpy('getTaskDetail').and.returnValue(of(baseTask));
    const listTaskShares = jasmine.createSpy('listTaskShares').and.returnValue(of([viewShare]));
    const listTaskSessions = jasmine.createSpy('listTaskSessions').and.returnValue(of([]));
    const createTaskShare = jasmine.createSpy('createTaskShare').and.returnValue(of(presentShare));

    await TestBed.configureTestingModule({
      imports: [TaskShellEditorEntryComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params$.asObservable(),
            snapshot: { paramMap: params$.value }
          }
        },
        {
          provide: TaskLibraryService,
          useValue: {
            getTaskDetail,
            updateTask: jasmine.createSpy('updateTask'),
            listTaskShares,
            listTaskSessions,
            createTaskShare,
            regenerateTaskShare: jasmine.createSpy('regenerateTaskShare'),
            revokeTaskShare: jasmine.createSpy('revokeTaskShare'),
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask'),
            createVariant: jasmine.createSpy('createVariant')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskShellEditorEntryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const stepsList = fixture.debugElement.query(By.directive(TaskStepsDraftListComponent)).componentInstance as TaskStepsDraftListComponent;
    openRailOverlay(fixture, host, 'Condivisione pubblica');
    const shareCards = () => host.querySelectorAll<HTMLElement>('.entry__overlay .entry__share-card');

    stepsList.stepsChange.emit([
      {
        ...baseTask.steps[0],
        uploadState: {
          status: 'uploaded',
          errorMessage: '',
          localPreviewUrl: '/local-only-preview.png',
          pendingPersistence: true
        }
      },
      baseTask.steps[1]
    ]);
    fixture.detectChanges();

    let presentCreateButton = shareCards()[1].querySelectorAll<HTMLButtonElement>('button')[0];
    expect(presentCreateButton.disabled).toBeTrue();
    expect(host.textContent).toContain('Sono presenti immagini ancora in bozza. Salva prima la task per includerle nei link pubblici.');

    stepsList.stepsChange.emit([
      {
        ...baseTask.steps[0],
        uploadState: createIdleUploadState()
      },
      baseTask.steps[1]
    ]);
    fixture.detectChanges();

    presentCreateButton = shareCards()[1].querySelectorAll<HTMLButtonElement>('button')[0];
    expect(presentCreateButton.disabled).toBeFalse();

    presentCreateButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(createTaskShare).toHaveBeenCalledWith('task-1', { mode: 'present' });
    expect(shareCards()[1].textContent).toContain('/shared/sharetokenpresent/present');
    expect(host.textContent).toContain('Link presenta creato sulla versione salvata corrente.');
  });
});
