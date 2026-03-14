import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { appRoutes } from '../../app.routes';
import { TaskDetailRecord } from '../../core/tasks/task-detail.models';
import { PublicTaskPresentRecord } from '../../core/tasks/task-library.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { TaskGuidedPresentPageComponent } from './task-guided-present-page.component';
import { TaskPlaybackPreviewPageComponent } from './task-playback-preview-page.component';
import { TaskSharedViewPageComponent } from './task-shared-view-page.component';

describe('TaskGuidedPresentPageComponent', () => {
  const responsiveTask: TaskDetailRecord = {
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
    stepCount: 4,
    lastUpdatedAt: '2026-03-14T09:00:00Z',
    authorName: 'teacher@example.com',
    sourceTaskId: null,
    steps: [
      {
        id: 'step-4',
        position: 4,
        title: 'Porta il piatto sul tavolo',
        description: 'Appoggialo con calma.',
        required: false,
        supportGuidance: '',
        reinforcementNotes: '',
        estimatedMinutes: null,
        visualSupport: {
          text: '',
          symbol: null,
          image: null
        },
        uploadState: null
      },
      {
        id: 'step-2',
        position: 2,
        title: 'Mostra il simbolo del piatto',
        description: 'Guarda il simbolo corretto.',
        required: true,
        supportGuidance: '',
        reinforcementNotes: '',
        estimatedMinutes: null,
        visualSupport: {
          text: '',
          symbol: {
            library: 'symwriter',
            key: 'plate',
            label: 'Piatto'
          },
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
        reinforcementNotes: 'Ottimo lavoro.',
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
      },
      {
        id: 'step-3',
        position: 3,
        title: 'Guarda la foto del bicchiere',
        description: 'Riconosci l oggetto dalla foto salvata.',
        required: true,
        supportGuidance: '',
        reinforcementNotes: 'Benissimo.',
        estimatedMinutes: 1,
        visualSupport: {
          text: '',
          symbol: null,
          image: {
            mediaId: 'media-2',
            storageKey: 'tasks/task-7/media-2.png',
            fileName: 'bicchiere.png',
            mimeType: 'image/png',
            fileSizeBytes: 2050,
            width: 640,
            height: 640,
            altText: 'Bicchiere trasparente',
            url: '/api/tasks/task-7/media/media-2/content'
          }
        },
        uploadState: {
          status: 'uploaded',
          errorMessage: '',
          localPreviewUrl: '/draft-only-glass.png',
          pendingPersistence: true
        }
      }
    ]
  };

  const oneStepTask: TaskDetailRecord = {
    ...responsiveTask,
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
    ...responsiveTask,
    id: 'task-empty',
    title: 'Task vuota',
    stepCount: 0,
    steps: []
  };

  const sharedPresentTask: PublicTaskPresentRecord = {
    taskId: 'shared-task-1',
    title: 'Lavarsi le mani',
    stepCount: 1,
    steps: [
      {
        id: 'shared-step-1',
        position: 1,
        title: 'Apri il rubinetto',
        description: 'Apri l acqua lentamente.',
        required: true,
        visualSupport: {
          text: 'Apri',
          symbol: null,
          image: {
            mediaId: 'media-shared-1',
            fileName: 'rubinetto.png',
            mimeType: 'image/png',
            fileSizeBytes: 1200,
            width: 400,
            height: 400,
            altText: 'Rubinetto',
            url: '/api/public/shares/share-present-1/media/media-shared-1/content'
          }
        }
      }
    ]
  };

  function setViewport(width: number): void {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: width
    });
    window.dispatchEvent(new Event('resize'));
  }

  beforeEach(() => {
    setViewport(1280);
  });

  it('registers protected and public present routes while keeping the preview route intact', () => {
    const shellRoute = appRoutes.find((route) => route.path === '');
    const presentRoute = shellRoute?.children?.find((route) => route.path === 'tasks/:taskId/present');
    const previewRoute = shellRoute?.children?.find((route) => route.path === 'tasks/:taskId/preview');
    const publicPresentRoute = appRoutes.find((route) => route.path === 'shared/:token/present');
    const publicViewRoute = appRoutes.find((route) => route.path === 'shared/:token');

    expect(presentRoute?.component).toBe(TaskGuidedPresentPageComponent);
    expect(previewRoute?.component).toBe(TaskPlaybackPreviewPageComponent);
    expect(publicPresentRoute?.component).toBe(TaskGuidedPresentPageComponent);
    expect(publicViewRoute?.component).toBe(TaskSharedViewPageComponent);
  });

  it('loads saved detail, initializes local session state, and resets it when the route changes', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-7' }));
    const getTaskDetail = jasmine.createSpy('getTaskDetail').and.callFake((taskId: string) => {
      if (taskId === 'task-8') {
        return of(oneStepTask);
      }

      return of(responsiveTask);
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
      showAdultGuidance: () => boolean;
      toggleAdultGuidance: () => void;
      primaryActionLabel: () => string;
    };
    const host = fixture.nativeElement as HTMLElement;
    const buttons = () => Array.from(host.querySelectorAll<HTMLButtonElement>('button'));
    const previousButton = () => buttons().find((button) => button.textContent?.includes('Step precedente'));
    const nextButton = () => buttons().find((button) => button.textContent?.includes('Step successivo'));
    const primaryButton = () => buttons().find((button) =>
      ['Completa step corrente', 'Completa task', 'Vai allo step successivo'].some((label) =>
        button.textContent?.includes(label)
      )
    );

    expect(getTaskDetail).toHaveBeenCalledWith('task-7');
    expect(component.currentStep()?.title).toBe('Prendi il piatto');
    expect(component.currentStepIndex()).toBe(0);
    expect(component.completedStepIndexes()).toEqual([]);
    expect(component.isFirstStep()).toBeTrue();
    expect(component.isLastStep()).toBeFalse();
    expect(host.textContent).toContain('0 / 4 completati');
    expect(host.textContent).toContain('Layout desktop');
    expect(host.querySelector('.present-shell')?.getAttribute('data-viewport')).toBe('desktop');
    expect(host.querySelector('img')?.getAttribute('src')).toBe('/api/tasks/task-7/media/media-1/content');
    expect(host.textContent).not.toContain('/draft-only-plate.png');
    expect(host.textContent).not.toContain('Indica il ripiano corretto.');
    expect(previousButton()?.disabled).toBeTrue();
    expect(nextButton()?.disabled).toBeFalse();
    expect(component.primaryActionLabel()).toBe('Completa step corrente');

    component.toggleAdultGuidance();
    fixture.detectChanges();
    expect(component.showAdultGuidance()).toBeTrue();
    expect(host.textContent).toContain('Prompt adulto');
    expect(host.textContent).toContain('Indica il ripiano corretto.');

    primaryButton()?.click();
    fixture.detectChanges();

    expect(component.completedStepIndexes()).toEqual([0]);
    expect(component.currentStepIndex()).toBe(1);
    expect(component.currentStep()?.title).toBe('Mostra il simbolo del piatto');
    expect(component.showAdultGuidance()).toBeFalse();
    expect(host.textContent).toContain('1 / 4 completati');
    expect(previousButton()?.disabled).toBeFalse();
    expect(nextButton()?.disabled).toBeFalse();

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
    expect(previousButton()?.disabled).toBeTrue();
    expect(nextButton()?.disabled).toBeTrue();
    expect(component.primaryActionLabel()).toBe('Completa task');

    primaryButton()?.click();
    fixture.detectChanges();

    expect(component.completedStepIndexes()).toEqual([0]);
    expect(component.isSessionComplete()).toBeTrue();
    expect(host.textContent).toContain('Sequenza conclusa');
  });

  it('renders text-only, symbol-only, image-only, and empty saved supports from the persisted contract', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-7' }));

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
            getTaskDetail: jasmine.createSpy('getTaskDetail').and.returnValue(of(responsiveTask))
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskGuidedPresentPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const nextButton = () =>
      Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
        button.textContent?.includes('Step successivo')
      );

    expect(host.textContent).toContain('Piatto');
    expect(host.textContent).toContain('symwriter');
    expect(host.textContent).toContain('plate');
    expect(host.querySelector('img')?.getAttribute('src')).toBe('/api/tasks/task-7/media/media-1/content');

    nextButton()?.click();
    fixture.detectChanges();

    expect(host.textContent).toContain('Mostra il simbolo del piatto');
    expect(host.textContent).toContain('Simbolo');
    expect(host.textContent).toContain('Piatto');
    expect(host.querySelector('img')).toBeNull();

    nextButton()?.click();
    fixture.detectChanges();

    expect(host.textContent).toContain('Guarda la foto del bicchiere');
    expect(host.querySelector('img')?.getAttribute('src')).toBe('/api/tasks/task-7/media/media-2/content');
    expect(host.textContent).not.toContain('/draft-only-glass.png');

    nextButton()?.click();
    fixture.detectChanges();

    expect(host.textContent).toContain('Porta il piatto sul tavolo');
    expect(host.textContent).toContain('Nessun supporto visivo salvato per questo step.');
    expect(host.querySelector('img')).toBeNull();
  });

  it('switches between phone, tablet, and desktop layout markers on resize', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-7' }));

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
            getTaskDetail: jasmine.createSpy('getTaskDetail').and.returnValue(of(responsiveTask))
          }
        }
      ]
    }).compileComponents();

    setViewport(600);
    const fixture = TestBed.createComponent(TaskGuidedPresentPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const shell = () => host.querySelector('.present-shell');

    expect(shell()?.getAttribute('data-viewport')).toBe('phone');
    expect(shell()?.classList.contains('present--phone')).toBeTrue();
    expect(host.textContent).toContain('Layout telefono');

    setViewport(900);
    fixture.detectChanges();
    expect(shell()?.getAttribute('data-viewport')).toBe('tablet');
    expect(shell()?.classList.contains('present--tablet')).toBeTrue();
    expect(host.textContent).toContain('Layout tablet');

    setViewport(1280);
    fixture.detectChanges();
    expect(shell()?.getAttribute('data-viewport')).toBe('desktop');
    expect(shell()?.classList.contains('present--desktop')).toBeTrue();
    expect(host.textContent).toContain('Layout desktop');
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

  it('loads a public shared present payload without showing editor affordances', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ token: 'share-present-1' }));
    const getPublicPresentTaskShare = jasmine
      .createSpy('getPublicPresentTaskShare')
      .and.returnValue(of(sharedPresentTask));

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
            getTaskDetail: jasmine.createSpy('getTaskDetail'),
            getPublicPresentTaskShare
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskGuidedPresentPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(getPublicPresentTaskShare).toHaveBeenCalledWith('share-present-1');
    expect(host.textContent).toContain('Presentazione condivisa');
    expect(host.textContent).toContain('Lavarsi le mani');
    expect(host.textContent).toContain('Apri il rubinetto');
    expect(host.querySelector('img')?.getAttribute('src')).toBe(
      '/api/public/shares/share-present-1/media/media-shared-1/content'
    );
    expect(host.textContent).not.toContain('Torna all editor');
    expect(host.textContent).toContain('Torna alla scheda condivisa');
    expect(host.textContent).not.toContain('Prompt adulto');
    expect(host.textContent).not.toContain('Rinforzo');
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

  it('lets users revisit completed steps without duplicating completion state', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-7' }));

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
            getTaskDetail: jasmine.createSpy('getTaskDetail').and.returnValue(of(responsiveTask))
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
      primaryActionLabel: () => string;
    };
    const host = fixture.nativeElement as HTMLElement;
    const buttons = () => Array.from(host.querySelectorAll<HTMLButtonElement>('button'));
    const previousButton = () => buttons().find((button) => button.textContent?.includes('Step precedente'));
    const primaryButton = () => buttons().find((button) =>
      ['Completa step corrente', 'Vai allo step successivo'].some((label) => button.textContent?.includes(label))
    );

    primaryButton()?.click();
    fixture.detectChanges();

    expect(component.currentStepIndex()).toBe(1);
    expect(component.completedStepIndexes()).toEqual([0]);

    previousButton()?.click();
    fixture.detectChanges();

    expect(component.currentStepIndex()).toBe(0);
    expect(component.primaryActionLabel()).toBe('Vai allo step successivo');

    primaryButton()?.click();
    fixture.detectChanges();

    expect(component.currentStepIndex()).toBe(1);
    expect(component.completedStepIndexes()).toEqual([0]);
    expect(host.textContent).toContain('1 / 4 completati');
  });
});
