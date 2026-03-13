import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskStepDraftRecord } from '../../core/tasks/task-detail.models';
import { TaskStepAuthoringEditorComponent } from './task-step-authoring-editor.component';

describe('TaskStepAuthoringEditorComponent', () => {
  let fixture: ComponentFixture<TaskStepAuthoringEditorComponent>;
  let component: TaskStepAuthoringEditorComponent;

  const baseSteps: TaskStepDraftRecord[] = [
    {
      id: 'step-1',
      position: 1,
      title: 'Apri il rubinetto',
      description: 'Apri l acqua.',
      required: true,
      supportGuidance: 'Prompt verbale',
      reinforcementNotes: '',
      estimatedMinutes: 1
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskStepAuthoringEditorComponent]
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
    const createButton = Array.from(host.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Crea il primo step')) as HTMLButtonElement;

    createButton.click();

    expect(emitted[0]?.length).toBe(1);
    expect(emitted[0]?.[0].position).toBe(1);
    expect(emitted[0]?.[0].required).toBeTrue();
  });

  it('duplicates, reorders, edits and deletes steps', () => {
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
        estimatedMinutes: 2
      }
    ];
    fixture.detectChanges();

    const emitted: TaskStepDraftRecord[][] = [];
    component.stepsChange.subscribe((steps) => emitted.push(steps));

    const host = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(host.querySelectorAll('.step__actions button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.trim() === 'Duplica')?.click();
    expect(emitted.at(-1)?.length).toBe(3);
    expect(emitted.at(-1)?.[1].title).toContain('copia');

    component.steps = emitted.at(-1) ?? component.steps;
    fixture.detectChanges();
    const moveDownButtons = (Array.from(host.querySelectorAll('.step__actions button')) as HTMLButtonElement[]).filter(
      (button) => button.textContent?.trim() === 'Giu'
    );
    moveDownButtons[0].click();
    expect(emitted.at(-1)?.[0].title).toBe('Apri il rubinetto copia');

    component.steps = emitted.at(-1) ?? component.steps;
    fixture.detectChanges();
    const titleInput = fixture.nativeElement.querySelector('input[type="text"]') as HTMLInputElement;
    titleInput.value = 'Apri forte il rubinetto';
    titleInput.dispatchEvent(new Event('input'));
    expect(emitted.at(-1)?.[0].title).toBe('Apri forte il rubinetto');

    component.steps = emitted.at(-1) ?? component.steps;
    fixture.detectChanges();
    const deleteButtons = Array.from(fixture.nativeElement.querySelectorAll('.step__danger')) as HTMLButtonElement[];
    deleteButtons[0].click();
    expect(emitted.at(-1)?.length).toBe(2);
  });
});
