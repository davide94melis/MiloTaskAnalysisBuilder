import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { TaskDetailRecord } from '../../core/tasks/task-detail.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { TaskPlaybackPreviewPageComponent } from './task-playback-preview-page.component';

describe('TaskPlaybackPreviewPageComponent', () => {
  const previewTask: TaskDetailRecord = {
    id: 'task-42',
    title: 'Preparare lo zaino',
    category: 'Routine',
    description: 'Checklist visiva per preparare lo zaino.',
    educationalObjective: 'Favorire l autonomia mattutina.',
    professionalNotes: 'Usare prima di uscire di casa.',
    contextLabel: 'Casa',
    environmentLabel: 'Ingresso',
    targetLabel: 'Bambino',
    supportLevel: 'Moderato',
    difficultyLevel: 'Base',
    visibility: 'private',
    status: 'draft',
    stepCount: 3,
    lastUpdatedAt: '2026-03-14T08:30:00Z',
    authorName: 'teacher@example.com',
    sourceTaskId: null,
    steps: [
      {
        id: 'step-1',
        position: 1,
        title: 'Prendi lo zaino',
        description: 'Mettilo sul tavolo.',
        required: true,
        supportGuidance: 'Indica lo zaino.',
        reinforcementNotes: '',
        estimatedMinutes: 1,
        visualSupport: {
          text: 'Zaino',
          symbol: null,
          image: null
        },
        uploadState: null
      },
      {
        id: 'step-2',
        position: 2,
        title: 'Controlla il materiale salvato',
        description: 'Riconosci il materiale da portare dalla versione persistita.',
        required: true,
        supportGuidance: '',
        reinforcementNotes: 'Bene cosi',
        estimatedMinutes: 2,
        visualSupport: {
          text: 'Quaderno',
          symbol: {
            library: 'symwriter',
            key: 'book',
            label: 'Libro'
          },
          image: {
            mediaId: 'media-2',
            storageKey: 'tasks/task-42/media-2.png',
            fileName: 'quaderno.png',
            mimeType: 'image/png',
            fileSizeBytes: 1536,
            width: 640,
            height: 480,
            altText: 'Quaderno rosso',
            url: '/api/tasks/task-42/media/media-2/content'
          }
        },
        uploadState: {
          status: 'uploaded',
          errorMessage: '',
          localPreviewUrl: '/draft-only-book.png',
          pendingPersistence: true
        }
      },
      {
        id: 'step-3',
        position: 3,
        title: 'Controlla lo step senza supporti salvati',
        description: 'La preview non deve usare upload locali come fonte di verita.',
        required: true,
        supportGuidance: '',
        reinforcementNotes: '',
        estimatedMinutes: 1,
        visualSupport: {
          text: '',
          symbol: null,
          image: null
        },
        uploadState: {
          status: 'uploaded',
          errorMessage: '',
          localPreviewUrl: '/draft-only-bottle.png',
          pendingPersistence: true
        }
      }
    ]
  };

  it('renders persisted mixed visual supports and ignores draft-only preview state', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-42' }));
    const getTaskDetail = jasmine.createSpy('getTaskDetail').and.returnValue(of(previewTask));

    await TestBed.configureTestingModule({
      imports: [TaskPlaybackPreviewPageComponent],
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

    const fixture = TestBed.createComponent(TaskPlaybackPreviewPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Playback proof');
    expect(host.textContent).toContain('Prendi lo zaino');
    expect(host.textContent).toContain('Zaino');
    expect(host.querySelector('textarea, input[type="text"], input[type="file"]')).toBeNull();

    const buttons = host.querySelectorAll<HTMLButtonElement>('button');
    buttons[1].click();
    fixture.detectChanges();

    expect(host.textContent).toContain('Controlla il materiale salvato');
    expect(host.textContent).toContain('Libro');
    expect(host.textContent).toContain('symwriter');
    expect(host.textContent).toContain('book');
    expect(host.textContent).toContain('Quaderno');

    let image = host.querySelector<HTMLImageElement>('img');
    expect(image?.getAttribute('src')).toBe('/api/tasks/task-42/media/media-2/content');
    expect(image?.getAttribute('src')).not.toBe('/draft-only-book.png');
    expect(image?.getAttribute('alt')).toBe('Quaderno rosso');

    buttons[1].click();
    fixture.detectChanges();

    image = host.querySelector<HTMLImageElement>('img');
    expect(host.textContent).toContain('Controlla lo step senza supporti salvati');
    expect(host.textContent).toContain('Nessun supporto visivo salvato per questo step.');
    expect(image).toBeNull();
    expect(host.textContent).not.toContain('/draft-only-bottle.png');
    expect(getTaskDetail).toHaveBeenCalledWith('task-42');
  });

  it('shows an error message when the saved task cannot be loaded', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'missing-task' }));

    await TestBed.configureTestingModule({
      imports: [TaskPlaybackPreviewPageComponent],
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

    const fixture = TestBed.createComponent(TaskPlaybackPreviewPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impossibile caricare l anteprima playback della task.');
  });
});
