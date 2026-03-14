import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { appRoutes } from '../../app.routes';
import { MiloAuthService, TaskBuilderAuthUser } from '../../core/auth/milo-auth.service';
import { PublicTaskPresentRecord, PublicTaskShareRecord, TaskCardRecord } from '../../core/tasks/task-library.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { LoginBridgeComponent } from '../auth/login-bridge.component';
import { TaskGuidedPresentPageComponent } from './task-guided-present-page.component';
import { TaskSharedViewPageComponent } from './task-shared-view-page.component';

describe('Task shared entry flow', () => {
  const publicSharedTask: PublicTaskShareRecord = {
    taskId: 'shared-task-1',
    title: 'Routine mani',
    category: 'Igiene',
    description: 'Sequenza pubblica salvata.',
    stepCount: 2,
    lastUpdatedAt: '2026-03-14T10:30:00Z',
    steps: [
      {
        id: 'step-1',
        position: 1,
        title: 'Apri il rubinetto',
        description: 'Apri l acqua lentamente.',
        required: true,
        visualSupport: {
          text: 'Apri',
          symbol: null,
          image: null
        }
      },
      {
        id: 'step-2',
        position: 2,
        title: 'Prendi il sapone',
        description: 'Usa il dispenser.',
        required: false,
        visualSupport: {
          text: '',
          symbol: {
            library: 'symwriter',
            key: 'soap',
            label: 'Sapone'
          },
          image: {
            mediaId: 'media-1',
            fileName: 'sapone.png',
            mimeType: 'image/png',
            fileSizeBytes: 2000,
            width: 400,
            height: 400,
            altText: 'Sapone',
            url: '/api/public/shares/share-view-1/media/media-1/content'
          }
        }
      }
    ]
  };

  const publicPresentTask: PublicTaskPresentRecord = {
    taskId: 'shared-task-1',
    title: 'Routine mani',
    stepCount: 1,
    steps: [
      {
        id: 'step-1',
        position: 1,
        title: 'Apri il rubinetto',
        description: 'Apri l acqua lentamente.',
        required: true,
        visualSupport: {
          text: 'Apri',
          symbol: null,
          image: {
            mediaId: 'media-1',
            fileName: 'rubinetto.png',
            mimeType: 'image/png',
            fileSizeBytes: 1024,
            width: 320,
            height: 320,
            altText: 'Rubinetto',
            url: '/api/public/shares/share-present-1/media/media-1/content'
          }
        }
      }
    ]
  };

  const duplicatedTask: TaskCardRecord = {
    id: 'task-copy-1',
    title: 'Routine mani',
    category: 'Igiene',
    contextLabel: 'Bagno',
    targetLabel: '',
    supportLevel: 'Visivo',
    visibility: 'private',
    status: 'draft',
    stepCount: 2,
    lastUpdatedAt: '2026-03-14T10:45:00Z',
    authorName: 'teacher@example.com'
  };

  const restoredUser: TaskBuilderAuthUser = {
    id: 'local-user-1',
    miloUserId: 'milo-user-1',
    email: 'teacher@example.com'
  };

  it('registers public share routes outside the authenticated shell', () => {
    const publicViewRoute = appRoutes.find((route) => route.path === 'shared/:token');
    const publicPresentRoute = appRoutes.find((route) => route.path === 'shared/:token/present');
    const shellRoute = appRoutes.find((route) => route.path === '');
    const privatePresentRoute = shellRoute?.children?.find((route) => route.path === 'tasks/:taskId/present');

    expect(publicViewRoute?.component).toBe(TaskSharedViewPageComponent);
    expect(publicPresentRoute?.component).toBe(TaskGuidedPresentPageComponent);
    expect(privatePresentRoute?.component).toBe(TaskGuidedPresentPageComponent);
    expect(publicViewRoute?.canActivate).toBeUndefined();
    expect(publicPresentRoute?.canActivate).toBeUndefined();
  });

  it('keeps anonymous duplication explicit by sending recipients through the login bridge', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ token: 'share-view-1' }));
    const beginMiloLogin = jasmine.createSpy('beginMiloLogin');
    const buildLoginBridgeUrl = jasmine
      .createSpy('buildLoginBridgeUrl')
      .and.returnValue('/auth/login?intent=duplicate-share&shareToken=share-view-1&redirectTo=%2Fshared%2Fshare-view-1');

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
            getPublicTaskShare: jasmine.createSpy('getPublicTaskShare').and.returnValue(of(publicSharedTask)),
            duplicateTaskFromShare: jasmine.createSpy('duplicateTaskFromShare')
          }
        },
        {
          provide: MiloAuthService,
          useValue: {
            isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
            buildLoginBridgeUrl,
            beginMiloLogin
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
    expect(beginMiloLogin).toHaveBeenCalledWith(
      '/auth/login?intent=duplicate-share&shareToken=share-view-1&redirectTo=%2Fshared%2Fshare-view-1'
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ti reindirizzo al login');
  });

  it('completes duplicate-from-share after Milo token handoff and opens the private draft', async () => {
    const params$ = new BehaviorSubject(
      convertToParamMap({
        token: 'jwt-token',
        intent: 'duplicate-share',
        shareToken: 'share-view-1',
        redirectTo: '/shared/share-view-1'
      })
    );
    const acceptTokenHandoff = jasmine.createSpy('acceptTokenHandoff');
    const restoreSession = jasmine.createSpy('restoreSession').and.resolveTo(restoredUser);

    await TestBed.configureTestingModule({
      imports: [LoginBridgeComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: params$.value }
          }
        },
        {
          provide: TaskLibraryService,
          useValue: {
            duplicateTaskFromShare: jasmine.createSpy('duplicateTaskFromShare').and.returnValue(of(duplicatedTask))
          }
        },
        {
          provide: MiloAuthService,
          useValue: {
            acceptTokenHandoff,
            restoreSession,
            beginMiloLogin: jasmine.createSpy('beginMiloLogin'),
            buildLoginBridgeUrl: jasmine.createSpy('buildLoginBridgeUrl')
          }
        }
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = TestBed.createComponent(LoginBridgeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const taskLibrary = TestBed.inject(TaskLibraryService) as unknown as {
      duplicateTaskFromShare: jasmine.Spy;
    };

    expect(acceptTokenHandoff).toHaveBeenCalledWith('jwt-token');
    expect(restoreSession).toHaveBeenCalled();
    expect(taskLibrary.duplicateTaskFromShare).toHaveBeenCalledWith('share-view-1');
    expect(router.navigate).toHaveBeenCalledWith(['/tasks', duplicatedTask.id], { replaceUrl: true });
  });

  it('keeps anonymous reading intact when the login-bridge duplicate step fails', async () => {
    const params$ = new BehaviorSubject(
      convertToParamMap({
        token: 'jwt-token',
        intent: 'duplicate-share',
        shareToken: 'share-view-1',
        redirectTo: '/shared/share-view-1'
      })
    );

    await TestBed.configureTestingModule({
      imports: [LoginBridgeComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: params$.value }
          }
        },
        {
          provide: TaskLibraryService,
          useValue: {
            duplicateTaskFromShare: jasmine
              .createSpy('duplicateTaskFromShare')
              .and.returnValue(throwError(() => new Error('duplicate failed')))
          }
        },
        {
          provide: MiloAuthService,
          useValue: {
            acceptTokenHandoff: jasmine.createSpy('acceptTokenHandoff'),
            restoreSession: jasmine.createSpy('restoreSession').and.resolveTo(restoredUser),
            beginMiloLogin: jasmine.createSpy('beginMiloLogin'),
            buildLoginBridgeUrl: jasmine.createSpy('buildLoginBridgeUrl')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginBridgeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Non sono riuscito a duplicare la task condivisa dopo l accesso.');
    expect(host.textContent).toContain('Torna al link condiviso');
  });

  it('loads shared present from the public contract instead of the owner detail endpoint', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ token: 'share-present-1' }));
    const getPublicPresentTaskShare = jasmine
      .createSpy('getPublicPresentTaskShare')
      .and.returnValue(of(publicPresentTask));
    const getTaskDetail = jasmine.createSpy('getTaskDetail');

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
            getPublicPresentTaskShare,
            getTaskDetail
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
    expect(getTaskDetail).not.toHaveBeenCalled();
    expect(host.textContent).toContain('Presentazione condivisa');
    expect(host.textContent).toContain('Torna alla scheda condivisa');
    expect(host.textContent).not.toContain('Torna all editor');
  });
});
