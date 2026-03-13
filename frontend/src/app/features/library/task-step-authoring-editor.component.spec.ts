import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  TaskStepDraftRecord,
  createEmptyVisualSupport,
  createIdleUploadState
} from '../../core/tasks/task-detail.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { TaskStepAuthoringEditorComponent } from './task-step-authoring-editor.component';

describe('TaskStepAuthoringEditorComponent', () => {
  let fixture: ComponentFixture<TaskStepAuthoringEditorComponent>;
  let component: TaskStepAuthoringEditorComponent;
  let taskLibrary: jasmine.SpyObj<TaskLibraryService>;

  const baseSteps: TaskStepDraftRecord[] = [
    {
      id: 'step-1',
      position: 1,
      title: 'Apri il rubinetto',
      description: 'Apri l acqua.',
      required: true,
      supportGuidance: 'Prompt verbale',
      reinforcementNotes: '',
      estimatedMinutes: 1,
      visualSupport: createEmptyVisualSupport(),
      uploadState: createIdleUploadState()
    }
  ];

  beforeEach(async () => {
    taskLibrary = jasmine.createSpyObj<TaskLibraryService>('TaskLibraryService', ['uploadTaskMedia']);

    await TestBed.configureTestingModule({
      imports: [TaskStepAuthoringEditorComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ taskId: 'task-1' })
            }
          }
        },
        {
          provide: TaskLibraryService,
          useValue: taskLibrary
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskStepAuthoringEditorComponent);
    component = fixture.componentInstance;
  });

  it('creates the first step from the empty state', () => {
    component.steps = [];
    fixture.detectChanges();

    const emitted: TaskStepDraftRecord[][] = [];
    component.stepsChange.subscribe((steps) => emitted.push(steps));

    const host = fixture.nativeElement as HTMLElement;
    const createButton = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Crea il primo step')
    ) as HTMLButtonElement;

    createButton.click();

    expect(emitted[0]?.length).toBe(1);
    expect(emitted[0]?.[0].position).toBe(1);
    expect(emitted[0]?.[0].required).toBeTrue();
    expect(emitted[0]?.[0].visualSupport).toEqual(createEmptyVisualSupport());
  });

  it('supports text-only visual support and preserves duplicate reorder delete interactions', () => {
    component.steps = [
      ...baseSteps,
      {
        id: 'step-2',
        position: 2,
        title: 'Prendi il sapone',
        description: 'Usa il dispenser.',
        required: false,
        supportGuidance: 'Modello visivo',
        reinforcementNotes: 'Bravo',
        estimatedMinutes: 2,
        visualSupport: createEmptyVisualSupport(),
        uploadState: createIdleUploadState()
      }
    ];
    fixture.detectChanges();

    const emitted: TaskStepDraftRecord[][] = [];
    component.stepsChange.subscribe((steps) => emitted.push(steps));

    const host = fixture.nativeElement as HTMLElement;
    const visualTextAreas = Array.from(host.querySelectorAll('section.visual-support textarea')) as HTMLTextAreaElement[];
    visualTextAreas[0].value = 'Apri';
    visualTextAreas[0].dispatchEvent(new Event('input'));
    expect(emitted.at(-1)?.[0].visualSupport.text).toBe('Apri');

    component.steps = emitted.at(-1) ?? component.steps;
    fixture.detectChanges();
    const buttons = Array.from(host.querySelectorAll('.step__actions button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.trim() === 'Duplica')?.click();
    expect(emitted.at(-1)?.length).toBe(3);

    component.steps = emitted.at(-1) ?? component.steps;
    fixture.detectChanges();
    const moveDownButtons = (Array.from(host.querySelectorAll('.step__actions button')) as HTMLButtonElement[]).filter(
      (button) => button.textContent?.trim() === 'Giu'
    );
    moveDownButtons[0].click();
    expect(emitted.at(-1)?.[0].title).toContain('copia');

    component.steps = emitted.at(-1) ?? component.steps;
    fixture.detectChanges();
    const deleteButtons = Array.from(fixture.nativeElement.querySelectorAll('.step__danger')) as HTMLButtonElement[];
    deleteButtons[0].click();
    expect(emitted.at(-1)?.length).toBe(2);
  });

  it('supports symbol plus text combinations', () => {
    component.steps = [...baseSteps];
    fixture.detectChanges();

    const emitted: TaskStepDraftRecord[][] = [];
    component.stepsChange.subscribe((steps) => emitted.push(steps));

    const host = fixture.nativeElement as HTMLElement;
    const visualTextArea = host.querySelector('section.visual-support textarea') as HTMLTextAreaElement;
    visualTextArea.value = 'Apri';
    visualTextArea.dispatchEvent(new Event('input'));

    component.steps = emitted.at(-1) ?? component.steps;
    fixture.detectChanges();
    const symbolButton = Array.from(host.querySelectorAll('.symbol-chip')).find((button) =>
      button.textContent?.includes('Rubinetto')
    ) as HTMLButtonElement;
    symbolButton.click();

    expect(emitted.at(-1)?.[0].visualSupport.text).toBe('Apri');
    expect(emitted.at(-1)?.[0].visualSupport.symbol).toEqual(
      jasmine.objectContaining({
        library: 'symwriter',
        key: 'tap',
        label: 'Rubinetto'
      })
    );
  });

  it('supports photo plus text upload combinations with per-step draft state', async () => {
    taskLibrary.uploadTaskMedia.and.returnValue(
      of({
        mediaId: 'media-1',
        taskId: 'task-1',
        fileName: 'rubinetto.png',
        mimeType: 'image/png',
        fileSizeBytes: 1536,
        width: 640,
        height: 480,
        storageKey: 'tasks/task-1/media-1.png',
        altText: null,
        url: '/api/tasks/task-1/media/media-1/content'
      })
    );
    component.steps = [...baseSteps];
    fixture.detectChanges();

    const emitted: TaskStepDraftRecord[][] = [];
    component.stepsChange.subscribe((steps) => emitted.push(steps));

    const host = fixture.nativeElement as HTMLElement;
    const visualTextArea = host.querySelector('section.visual-support textarea') as HTMLTextAreaElement;
    visualTextArea.value = 'Apri il rubinetto';
    visualTextArea.dispatchEvent(new Event('input'));

    component.steps = emitted.at(-1) ?? component.steps;
    fixture.detectChanges();

    const fileInput = host.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['image-bytes'], 'rubinetto.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: {
        item: () => file,
        length: 1,
        0: file
      }
    });

    fileInput.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    const latest = emitted.at(-1)?.[0];
    expect(taskLibrary.uploadTaskMedia).toHaveBeenCalledWith('task-1', file);
    expect(latest?.visualSupport.text).toBe('Apri il rubinetto');
    expect(latest?.visualSupport.image?.mediaId).toBe('media-1');
    expect(latest?.uploadState?.pendingPersistence).toBeTrue();
    expect(latest?.uploadState?.localPreviewUrl).toBe('/api/tasks/task-1/media/media-1/content');
  });

  it('scopes upload failures to the affected step without clearing the rest of the draft', async () => {
    taskLibrary.uploadTaskMedia.and.returnValue(
      throwError(() => new Error('upload failed'))
    );
    component.steps = [
      {
        ...baseSteps[0],
        visualSupport: {
          text: 'Apri',
          symbol: {
            library: 'symwriter',
            key: 'tap',
            label: 'Rubinetto'
          },
          image: null
        }
      }
    ];
    fixture.detectChanges();

    const emitted: TaskStepDraftRecord[][] = [];
    component.stepsChange.subscribe((steps) => emitted.push(steps));

    const host = fixture.nativeElement as HTMLElement;
    component.steps = emitted.at(-1) ?? component.steps;
    fixture.detectChanges();
    const fileInput = host.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bad-image'], 'broken.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: {
        item: () => file,
        length: 1,
        0: file
      }
    });

    fileInput.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    const latest = emitted.at(-1)?.[0];
    expect(latest?.visualSupport.text).toBe('Apri');
    expect(latest?.visualSupport.symbol?.key).toBe('tap');
    expect(latest?.visualSupport.image).toBeNull();
    expect(latest?.uploadState?.status).toBe('error');
    expect(latest?.uploadState?.errorMessage).toContain('Upload non riuscito');
  });
});
