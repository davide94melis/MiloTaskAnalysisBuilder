import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { appRoutes } from '../../app.routes';
import { TaskDetailRecord } from '../../core/tasks/task-detail.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { TaskPlaybackPreviewPageComponent } from './task-playback-preview-page.component';
import { TaskPrintExportPageComponent } from './task-print-export-page.component';

describe('TaskPrintExportPageComponent', () => {
  const exportTask: TaskDetailRecord = {
    id: 'task-77',
    title: 'Lavarsi le mani',
    category: 'Igiene',
    description: 'Sequenza stampabile per la routine bagno.',
    educationalObjective: 'Aumentare autonomia.',
    professionalNotes: 'Tenere il foglio vicino al lavabo.',
    contextLabel: 'Bagno',
    environmentLabel: 'Bagno di casa',
    targetLabel: 'Bambino',
    supportLevel: 'Visivo',
    difficultyLevel: 'Base',
    visibility: 'private',
    status: 'draft',
    stepCount: 3,
    lastUpdatedAt: '2026-03-14T09:00:00Z',
    authorName: 'teacher@example.com',
    sourceTaskId: null,
    steps: [
      {
        id: 'step-2',
        position: 2,
        title: 'Prendi il sapone',
        description: 'Usa il sapone liquido.',
        required: true,
        supportGuidance: '',
        reinforcementNotes: '',
        estimatedMinutes: 1,
        visualSupport: {
          text: '',
          symbol: {
            library: 'symwriter',
            key: 'soap',
            label: 'Sapone'
          },
          image: null
        },
        uploadState: null
      },
      {
        id: 'step-1',
        position: 1,
        title: 'Apri il rubinetto',
        description: 'Apri l acqua lentamente.',
        required: true,
        supportGuidance: '',
        reinforcementNotes: '',
        estimatedMinutes: 1,
        visualSupport: {
          text: 'Apri',
          symbol: null,
          image: {
            mediaId: 'media-1',
            storageKey: 'tasks/task-77/media-1.png',
            fileName: 'rubinetto.png',
            mimeType: 'image/png',
            fileSizeBytes: 1024,
            width: 400,
            height: 300,
            altText: 'Rubinetto',
            url: '/api/tasks/task-77/media/media-1/content'
          }
        },
        uploadState: null
      },
      {
        id: 'step-3',
        position: 3,
        title: 'Asciuga le mani',
        description: '',
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
      }
    ]
  };

  it('registers the authenticated export route beside preview and present', () => {
    const shellRoute = appRoutes.find((route) => route.path === '');
    const exportRoute = shellRoute?.children?.find((route) => route.path === 'tasks/:taskId/export');
    const previewRoute = shellRoute?.children?.find((route) => route.path === 'tasks/:taskId/preview');

    expect(exportRoute?.component).toBe(TaskPrintExportPageComponent);
    expect(previewRoute?.component).toBe(TaskPlaybackPreviewPageComponent);
  });

  it('renders ordered saved steps with structured text, symbol, and image supports and triggers print', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-77' }));
    const getTaskDetail = jasmine.createSpy('getTaskDetail').and.returnValue(of(exportTask));
    const printSpy = spyOn(window, 'print');

    await TestBed.configureTestingModule({
      imports: [TaskPrintExportPageComponent],
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

    const fixture = TestBed.createComponent(TaskPrintExportPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const titles = Array.from(host.querySelectorAll('.print-step h3')).map((item) => item.textContent?.trim());

    expect(getTaskDetail).toHaveBeenCalledWith('task-77');
    expect(titles).toEqual(['Apri il rubinetto', 'Prendi il sapone', 'Asciuga le mani']);
    expect(host.textContent).toContain('Lavarsi le mani');
    expect(host.textContent).toContain('Testo visivo');
    expect(host.textContent).toContain('Simbolo');
    expect(host.textContent).toContain('Sapone');
    expect(host.textContent).toContain('Nessun supporto visivo salvato per questo step.');
    expect(host.querySelector('img')?.getAttribute('src')).toBe('/api/tasks/task-77/media/media-1/content');
    expect(printSpy).toHaveBeenCalled();

    const printButton = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes('Stampa o salva PDF')
    );
    printButton?.click();
    expect(printSpy).toHaveBeenCalledTimes(2);
  });

  it('shows a recoverable error when the saved task cannot be loaded', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'missing-task' }));

    await TestBed.configureTestingModule({
      imports: [TaskPrintExportPageComponent],
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

    const fixture = TestBed.createComponent(TaskPrintExportPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impossibile caricare la versione salvata della task per l export PDF.');
  });
});
