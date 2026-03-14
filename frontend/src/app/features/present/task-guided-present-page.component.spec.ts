import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { appRoutes } from '../../app.routes';
import { TaskDetailRecord } from '../../core/tasks/task-detail.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { TaskGuidedPresentPageComponent } from './task-guided-present-page.component';
import { TaskPlaybackPreviewPageComponent } from './task-playback-preview-page.component';

describe('TaskGuidedPresentPageComponent', () => {
  const multiStepTask: TaskDetailRecord = {
    id: 'task-7',
    title: 'Preparare la merenda',
    category: 'Routine',
    description: 'Sequenza per preparare una merenda semplice.',
    educationalObjective: 'Sostenere l autonomia nella preparazione di base.',
    professionalNotes: 'Mantenere il tavolo libero da distrazioni.',
    contextLabel: 'Casa',
    environmentLabel: 'Cucina',
    targetLabel: 'Bambino',
    supportLevel: 'Moderato',
    difficultyLevel: 'Base',
    visibility: 'private',
    status: 'shared',
    stepCount: 2,
    lastUpdatedAt: '2026-03-14T09:00:00Z',
    authorName: 'teacher@example.com',
    sourceTaskId: null,
    steps: [
      {
        id: 'step-2',
        position: 2,
        title: 'Porta il piatto sul tavolo',
        description: 'Appoggialo con calma.',
        required: true,
        supportGuidance: '',
        reinforcementNotes: 'Ottimo lavoro.',
        estimatedMinutes: 1,
        visualSupport: {
          text: '',
          symbol: null,
          image: null
        },
        uploadState: null
      },
      {
        id: 'step-1',
        position: 1,
        title: 'Prendi il piatto',
        description: 'Usa il piatto salvato nella task.',
        required: true,
        supportGuidance: 'Indica il ripiano corretto.',
        reinforcementNotes: '',
        estimatedMinutes: 2,
        visualSupport: {
          text: 'Piatto',
          symbol: {
            library: 'symwriter',
            key: 'plate',
            label: 'Piatto'
          },
          image: {
            mediaId: 'media-1',
            storageKey: 'tasks/task-7/media-1.png',
            fileName: 'piatto.png',
            mimeType: 'image/png',
            fileSizeBytes: 2048,
            width: 600,
            height: 600,
            altText: 'Piatto bianco',
            url: '/api/tasks/task-7/media/media-1/content'
          }
        },
        uploadState: {
          status: 'uploaded',
          errorMessage: '',
          localPreviewUrl: '/draft-only-plate.png',
          pendingPersistence: true
        }
      }
    ]
  };

  const oneStepTask: TaskDetailRecord = {
    ...multiStepTask,
    id: 'task-8',
    title: 'Bere un bicchiere d acqua',
    stepCount: 1,
    steps: [
      {
        id: 'step-1',
        position: 1,
        title: 'Bevi l acqua',
        description: 'Porta il bicchiere alla bocca.',
        required: true,
        supportGuidance: 'Modello fisico leggero se serve.',
        reinforcementNotes: 'Hai finito.',
        estimatedMinutes: 1,
        visualSupport: {
          text: 'Acqua',
          symbol: null,
          image: null
        },
        uploadState: null
      }
    ]
  };

  const zeroStepTask: TaskDetailRecord = {
    ...multiStepTask,
    id: 'task-empty',
    title: 'Task vuota',
    stepCount: 0,
    steps: []
  };

  it('registers a protected present route while keeping the preview route intact', () => {
    const shellRoute = appRoutes.find((route) => route.path === '');
    const presentRoute = shellRoute?.children?.find((route) => route.path === 'tasks/:taskId/present');
    const previewRoute = shellRoute?.children?.find((route) => route.path === 'tasks/:taskId/preview');

    expect(presentRoute?.component).toBe(TaskGuidedPresentPageComponent);
    expect(previewRoute?.component).toBe(TaskPlaybackPreviewPageComponent);
  });

  it('loads saved detail, initializes local session state, and resets it when the route changes', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-7' }));
    const getTaskDetail = jasmine.createSpy('getTaskDetail').and.callFake((taskId: string) => {
      if (taskId === 'task-8') {
        return of(oneStepTask);
      }

      return of(multiStepTask);
    });

    await TestBed.configureTestingModule({
      imports: [TaskGuidedPresentPageComponent],
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
            getTaskDetail
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskGuidedPresentPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      currentStepIndex: () => number;
      completedStepIndexes: () => number[];
      currentStep: () => TaskDetailRecord['steps'][number] | null;
      isFirstStep: () => boolean;
      isLastStep: () => boolean;
      isSessionComplete: () => boolean;
      markCurrentStepCompleted: () => void;
    };
    const host = fixture.nativeElement as HTMLElement;

    expect(getTaskDetail).toHaveBeenCalledWith('task-7');
    expect(component.currentStep()?.title).toBe('Prendi il piatto');
    expect(component.currentStepIndex()).toBe(0);
    expect(component.completedStepIndexes()).toEqual([]);
    expect(component.isFirstStep()).toBeTrue();
    expect(component.isLastStep()).toBeFalse();
    expect(host.textContent).toContain('0 / 2 completati');
    expect(host.querySelector('img')?.getAttribute('src')).toBe('/api/tasks/task-7/media/media-1/content');
    expect(host.textContent).not.toContain('/draft-only-plate.png');

    const completeButton = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes('Completa step corrente')
    );
    completeButton?.click();
    fixture.detectChanges();

    expect(component.completedStepIndexes()).toEqual([0]);
    expect(component.currentStepIndex()).toBe(1);
    expect(component.currentStep()?.title).toBe('Porta il piatto sul tavolo');
    expect(host.textContent).toContain('1 / 2 completati');

    params$.next(convertToParamMap({ taskId: 'task-8' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getTaskDetail).toHaveBeenCalledWith('task-8');
    expect(component.currentStepIndex()).toBe(0);
    expect(component.completedStepIndexes()).toEqual([]);
    expect(component.currentStep()?.title).toBe('Bevi l acqua');
    expect(component.isLastStep()).toBeTrue();
    expect(component.isSessionComplete()).toBeFalse();

    const completeTaskButton = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes('Completa task')
    );
    completeTaskButton?.click();
    fixture.detectChanges();

    expect(component.completedStepIndexes()).toEqual([0]);
    expect(component.isSessionComplete()).toBeTrue();
    expect(host.textContent).toContain('Sequenza completata');
  });

  it('shows a recoverable empty state for tasks with zero saved steps', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-empty' }));

    await TestBed.configureTestingModule({
      imports: [TaskGuidedPresentPageComponent],
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
            getTaskDetail: jasmine.createSpy('getTaskDetail').and.returnValue(of(zeroStepTask))
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskGuidedPresentPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Task senza step');
    expect(host.textContent).toContain('Aggiungi almeno uno step salvato prima di presentare la task');
    expect(host.textContent).not.toContain('Completa step corrente');
    expect(host.textContent).not.toContain('Completa task');
  });

  it('shows an error state when the saved task cannot be loaded', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'missing-task' }));

    await TestBed.configureTestingModule({
      imports: [TaskGuidedPresentPageComponent],
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
            getTaskDetail: jasmine.createSpy('getTaskDetail').and.returnValue(
              throwError(() => new Error('missing task'))
            )
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskGuidedPresentPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Presentazione non disponibile');
    expect(host.textContent).toContain('Impossibile caricare la task salvata per la presentazione guidata.');
  });

  it('keeps session state local and offers restart without persisted writes', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-8' }));
    const getTaskDetail = jasmine.createSpy('getTaskDetail').and.returnValue(of(oneStepTask));

    await TestBed.configureTestingModule({
      imports: [TaskGuidedPresentPageComponent],
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
            getTaskDetail
          }
        }
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = TestBed.createComponent(TaskGuidedPresentPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      completedStepIndexes: () => number[];
      isSessionComplete: () => boolean;
      restartSession: () => void;
    };
    const host = fixture.nativeElement as HTMLElement;

    const completeTaskButton = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes('Completa task')
    );
    completeTaskButton?.click();
    fixture.detectChanges();

    expect(component.completedStepIndexes()).toEqual([0]);
    expect(component.isSessionComplete()).toBeTrue();
    expect(getTaskDetail).toHaveBeenCalledTimes(1);

    const restartButton = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes('Ricomincia la sessione')
    );
    restartButton?.click();
    fixture.detectChanges();

    expect(component.completedStepIndexes()).toEqual([]);
    expect(component.isSessionComplete()).toBeFalse();
    expect(getTaskDetail).toHaveBeenCalledTimes(1);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
