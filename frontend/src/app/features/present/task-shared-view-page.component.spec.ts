import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { MiloAuthService } from '../../core/auth/milo-auth.service';
import { PublicTaskShareRecord, TaskCardRecord } from '../../core/tasks/task-library.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { TaskSharedViewPageComponent } from './task-shared-view-page.component';

describe('TaskSharedViewPageComponent', () => {
  const sharedViewTask: PublicTaskShareRecord = {
    taskId: 'shared-task-1',
    title: 'Lavarsi le mani',
    category: 'Autonomia personale',
    description: 'Sequenza pubblica e salvata per l igiene.',
    stepCount: 2,
    lastUpdatedAt: '2026-03-14T10:00:00Z',
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
            url: '/api/public/shares/share-view-1/media/media-shared-1/content'
          }
        }
      },
      {
        id: 'shared-step-2',
        position: 2,
        title: 'Prendi il sapone',
        description: 'Usa il sapone vicino al lavandino.',
        required: false,
        visualSupport: {
          text: '',
          symbol: {
            library: 'symwriter',
            key: 'soap',
            label: 'Sapone'
          },
          image: null
        }
      }
    ]
  };

  const duplicatedTask: TaskCardRecord = {
    id: 'task-copy-1',
    title: 'Lavarsi le mani',
    category: 'Autonomia personale',
    contextLabel: 'Bagno',
    targetLabel: '',
    supportLevel: 'Guidato',
    visibility: 'private',
    status: 'draft',
    stepCount: 2,
    lastUpdatedAt: '2026-03-14T10:10:00Z',
    authorName: 'teacher@example.com'
  };

  it('renders only the public-safe shared DTO and uses share-scoped media URLs', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ token: 'share-view-1' }));

    await TestBed.configureTestingModule({
      imports: [TaskSharedViewPageComponent],
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
            getPublicTaskShare: jasmine.createSpy('getPublicTaskShare').and.returnValue(of(sharedViewTask))
          }
        },
        {
          provide: MiloAuthService,
          useValue: {
            isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
            beginMiloLogin: jasmine.createSpy('beginMiloLogin'),
            buildLoginBridgeUrl: jasmine.createSpy('buildLoginBridgeUrl').and.returnValue('/auth/login?intent=duplicate-share')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskSharedViewPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Lavarsi le mani');
    expect(host.textContent).toContain('Autonomia personale');
    expect(host.textContent).toContain('Sequenza pubblica e salvata per l igiene.');
    expect(host.textContent).toContain('Apri modalita guidata');
    expect(host.textContent).toContain('Step condivisi');
    expect(host.textContent).toContain('Apri il rubinetto');
    expect(host.textContent).toContain('Prendi il sapone');
    expect(host.textContent).not.toContain('Prompt adulto');
    expect(host.textContent).not.toContain('Rinforzo');
    expect(host.textContent).not.toContain('professionalNotes');
    expect(host.querySelector('img')?.getAttribute('src')).toBe(
      '/api/public/shares/share-view-1/media/media-shared-1/content'
    );
  });

  it('opens shared present without exposing owner-only controls', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ token: 'share-view-1' }));

    await TestBed.configureTestingModule({
      imports: [TaskSharedViewPageComponent],
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
            getPublicTaskShare: jasmine.createSpy('getPublicTaskShare').and.returnValue(of(sharedViewTask))
          }
        },
        {
          provide: MiloAuthService,
          useValue: {
            isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
            beginMiloLogin: jasmine.createSpy('beginMiloLogin'),
            buildLoginBridgeUrl: jasmine.createSpy('buildLoginBridgeUrl')
          }
        }
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = TestBed.createComponent(TaskSharedViewPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const presentButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent?.includes('Apri modalita guidata')) as HTMLButtonElement;

    presentButton.click();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/shared', 'share-view-1', 'present']);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Prompt adulto');
  });

  it('sends anonymous recipients through Milo login before duplication', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ token: 'share-view-1' }));
    const beginMiloLogin = jasmine.createSpy('beginMiloLogin');
    const buildLoginBridgeUrl = jasmine
      .createSpy('buildLoginBridgeUrl')
      .and.returnValue('/auth/login?intent=duplicate-share&shareToken=share-view-1');

    await TestBed.configureTestingModule({
      imports: [TaskSharedViewPageComponent],
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
            getPublicTaskShare: jasmine.createSpy('getPublicTaskShare').and.returnValue(of(sharedViewTask)),
            duplicateTaskFromShare: jasmine.createSpy('duplicateTaskFromShare')
          }
        },
        {
          provide: MiloAuthService,
          useValue: {
            isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
            beginMiloLogin,
            buildLoginBridgeUrl
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskSharedViewPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const duplicateButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent?.includes('Duplica nel mio spazio')) as HTMLButtonElement;

    duplicateButton.click();
    fixture.detectChanges();

    expect(buildLoginBridgeUrl).toHaveBeenCalledWith({
      intent: 'duplicate-share',
      shareToken: 'share-view-1',
      redirectTo: '/shared/share-view-1'
    });
    expect(beginMiloLogin).toHaveBeenCalledWith('/auth/login?intent=duplicate-share&shareToken=share-view-1');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ti reindirizzo al login');
  });

  it('duplicates into a private draft for authenticated recipients', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ token: 'share-view-1' }));

    await TestBed.configureTestingModule({
      imports: [TaskSharedViewPageComponent],
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
            getPublicTaskShare: jasmine.createSpy('getPublicTaskShare').and.returnValue(of(sharedViewTask)),
            duplicateTaskFromShare: jasmine.createSpy('duplicateTaskFromShare').and.returnValue(of(duplicatedTask))
          }
        },
        {
          provide: MiloAuthService,
          useValue: {
            isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
            beginMiloLogin: jasmine.createSpy('beginMiloLogin'),
            buildLoginBridgeUrl: jasmine.createSpy('buildLoginBridgeUrl')
          }
        }
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = TestBed.createComponent(TaskSharedViewPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const duplicateButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent?.includes('Duplica nel mio spazio')) as HTMLButtonElement;

    duplicateButton.click();
    await fixture.whenStable();

    const taskLibrary = TestBed.inject(TaskLibraryService) as unknown as {
      duplicateTaskFromShare: jasmine.Spy;
    };
    expect(taskLibrary.duplicateTaskFromShare).toHaveBeenCalledWith('share-view-1');
    expect(router.navigate).toHaveBeenCalledWith(['/tasks', duplicatedTask.id]);
  });

  it('shows a revoked-link state when public loading fails', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ token: 'revoked' }));

    await TestBed.configureTestingModule({
      imports: [TaskSharedViewPageComponent],
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
            getPublicTaskShare: jasmine
              .createSpy('getPublicTaskShare')
              .and.returnValue(throwError(() => new Error('revoked')))
          }
        },
        {
          provide: MiloAuthService,
          useValue: {
            isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
            beginMiloLogin: jasmine.createSpy('beginMiloLogin'),
            buildLoginBridgeUrl: jasmine.createSpy('buildLoginBridgeUrl')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskSharedViewPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Link non disponibile');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Il link condiviso non e disponibile o e stato revocato.');
  });
});
