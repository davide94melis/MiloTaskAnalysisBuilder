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
import { TaskShellEditorEntryComponent } from './task-shell-editor-entry.component';
import { TaskStepsDraftListComponent } from './task-steps-draft-list.component';
import { TaskGuidedPresentPageComponent } from '../present/task-guided-present-page.component';
import { TaskPlaybackPreviewPageComponent } from '../present/task-playback-preview-page.component';

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

  it('registers the authenticated preview and present routes outside the editor path', () => {
    const shellRoute = appRoutes.find((route) => route.path === '');
    const previewRoute = shellRoute?.children?.find((route) => route.path === 'tasks/:taskId/preview');
    const presentRoute = shellRoute?.children?.find((route) => route.path === 'tasks/:taskId/present');

    expect(previewRoute?.component).toBe(TaskPlaybackPreviewPageComponent);
    expect(presentRoute?.component).toBe(TaskGuidedPresentPageComponent);
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
    let previewButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Apri anteprima playback'
    ) as HTMLButtonElement | undefined;
    let presentButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Avvia modalita guidata'
    ) as HTMLButtonElement | undefined;
    expect(previewButton?.disabled).toBeTrue();
    expect(presentButton?.disabled).toBeTrue();
    expect(host.textContent).toContain(
      'Salva prima la task per includere in anteprima e modalita guidata le immagini ancora in bozza.'
    );
    previewButton?.click();
    presentButton?.click();
    expect(router.navigate).not.toHaveBeenCalled();

    stepsList.stepsChange.emit([
      {
        ...baseTask.steps[0],
        uploadState: createIdleUploadState()
      },
      baseTask.steps[1]
    ]);
    fixture.detectChanges();

    previewButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Apri anteprima playback'
    ) as HTMLButtonElement | undefined;
    presentButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Avvia modalita guidata'
    ) as HTMLButtonElement | undefined;
    expect(previewButton?.disabled).toBeFalse();
    expect(presentButton?.disabled).toBeFalse();

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
    const presentButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Avvia modalita guidata'
    ) as HTMLButtonElement | undefined;

    expect(presentButton?.disabled).toBeFalse();

    presentButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'task-2', 'present']);
    expect(router.navigate).not.toHaveBeenCalledWith(['/tasks', 'task-1', 'present']);
    expect(getTaskDetail).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain('Modalita guidata aperta sulla variante salvata corrente.');
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
    expect(host.textContent).toContain('Famiglia varianti');
    expect(host.textContent).toContain('Task base');
    expect(host.textContent).toContain('3 task nella famiglia');
    expect(host.textContent).toContain('Variante · Visivo');

    const familyButtons = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).filter((button) =>
      button.textContent?.includes('Visivo')
    );
    familyButtons[0].click();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'task-2']);

    const createVariantButton = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes('Crea variante da questa task')
    );
    createVariantButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(createVariant).toHaveBeenCalledWith('task-1', { supportLevel: 'Supportato' });
    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'task-4']);
    expect(host.textContent).toContain('Variante creata. Apertura della nuova task in corso.');
  });
});
