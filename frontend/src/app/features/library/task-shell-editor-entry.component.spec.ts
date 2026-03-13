import { convertToParamMap, provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';

import { ActivatedRoute } from '@angular/router';
import { TaskDetailRecord } from '../../core/tasks/task-detail.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { TaskShellEditorEntryComponent } from './task-shell-editor-entry.component';

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
    steps: [
      {
        id: 'step-1',
        position: 1,
        title: 'Apri il rubinetto',
        description: 'Ruota la manopola.',
        required: true,
        supportGuidance: 'Prompt verbale',
        reinforcementNotes: 'Bravo',
        estimatedMinutes: 1
      },
      {
        id: 'step-2',
        position: 2,
        title: 'Prendi il sapone',
        description: 'Usa il dispenser.',
        required: false,
        supportGuidance: 'Modello visivo',
        reinforcementNotes: '',
        estimatedMinutes: 2
      }
    ]
  };

  it('loads detail data into editable controls and saves authored steps', async () => {
    const params$ = new BehaviorSubject(convertToParamMap({ taskId: 'task-1' }));
    const updateTask = jasmine.createSpy('updateTask').and.callFake(
      (_taskId: string, request: { steps: Array<{ id: string; title: string; required: boolean }> }) =>
        of({
          ...baseTask,
          title: 'Lavarsi bene le mani',
          lastUpdatedAt: '2026-03-13T11:30:00Z',
          steps: request.steps.map((step, index) => ({
            ...(baseTask.steps.find((candidate) => candidate.id === step.id) ?? {
              description: '',
              supportGuidance: '',
              reinforcementNotes: '',
              estimatedMinutes: null
            }),
            ...step,
            position: index + 1
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
            getTaskDetail: jasmine.createSpy('getTaskDetail').and.returnValue(of(baseTask)),
            updateTask,
            createDraft: jasmine.createSpy('createDraft'),
            duplicateTask: jasmine.createSpy('duplicateTask')
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

    const titleField = host.querySelectorAll<HTMLInputElement>('ol.steps input[type="text"]')[0];
    titleField.value = 'Apri bene il rubinetto';
    titleField.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const duplicateButton = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Duplica'
    );
    duplicateButton?.click();
    fixture.detectChanges();

    const saveButton = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Salva metadata'
    );
    titleInput!.value = 'Lavarsi bene le mani';
    titleInput!.dispatchEvent(new Event('input'));
    saveButton?.click();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(updateTask).toHaveBeenCalled();
    const submittedRequest = updateTask.calls.mostRecent().args[1];
    expect(submittedRequest.title).toBe('Lavarsi bene le mani');
    expect(submittedRequest.steps).toEqual(
      jasmine.arrayContaining([
        jasmine.objectContaining({ id: 'step-1', title: 'Apri bene il rubinetto', required: true }),
        jasmine.objectContaining({ title: 'Apri bene il rubinetto copia' })
      ])
    );

    const orderedTitles = Array.from(host.querySelectorAll('ol.steps strong')).map((element) =>
      element.textContent?.trim()
    );
    expect(orderedTitles).toContain('Apri bene il rubinetto copia');
    expect(host.textContent).toContain('Metadata e step salvati.');
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
            duplicateTask: jasmine.createSpy('duplicateTask')
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
});
