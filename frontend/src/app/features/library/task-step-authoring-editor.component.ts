import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskStepDraftRecord } from '../../core/tasks/task-detail.models';

@Component({
  selector: 'mtab-task-step-authoring-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="panel">
      <header class="panel__header">
        <div>
          <p class="panel__eyebrow">Step authoring</p>
          <h3>Costruisci la sequenza operativa step per step.</h3>
        </div>
        <button type="button" class="panel__primary" [disabled]="disabled" (click)="addStep()">Aggiungi step</button>
      </header>

      <div class="panel__empty" *ngIf="!steps.length">
        <p>Nessuno step ancora presente.</p>
        <button type="button" class="panel__primary" [disabled]="disabled" (click)="addStep()">Crea il primo step</button>
      </div>

      <ol class="steps" *ngIf="steps.length">
        <li class="step" *ngFor="let step of steps; let index = index">
          <header class="step__header">
            <div>
              <span class="step__badge">Step {{ index + 1 }}</span>
              <strong>{{ step.title || 'Nuovo step' }}</strong>
            </div>

            <div class="step__actions">
              <button type="button" [disabled]="disabled || index === 0" (click)="moveStep(index, -1)">Su</button>
              <button type="button" [disabled]="disabled || index === steps.length - 1" (click)="moveStep(index, 1)">Giu</button>
              <button type="button" [disabled]="disabled" (click)="duplicateStep(index)">Duplica</button>
              <button type="button" class="step__danger" [disabled]="disabled" (click)="removeStep(index)">Elimina</button>
            </div>
          </header>

          <div class="step__grid">
            <label class="field field--wide">
              <span>Titolo breve</span>
              <input
                type="text"
                [value]="step.title"
                [disabled]="disabled"
                (input)="updateText(index, 'title', readValue($event))"
              />
            </label>

            <label class="field field--wide">
              <span>Descrizione</span>
              <textarea
                rows="3"
                [value]="step.description"
                [disabled]="disabled"
                (input)="updateText(index, 'description', readValue($event))"
              ></textarea>
            </label>

            <label class="field field--compact">
              <span>Obbligatorio</span>
              <input
                type="checkbox"
                [checked]="step.required"
                [disabled]="disabled"
                (change)="updateRequired(index, readChecked($event))"
              />
            </label>

            <label class="field">
              <span>Tempo stimato (minuti)</span>
              <input
                type="number"
                min="0"
                [value]="step.estimatedMinutes ?? ''"
                [disabled]="disabled"
                (input)="updateEstimatedMinutes(index, readValue($event))"
              />
            </label>

            <label class="field field--wide">
              <span>Prompt o supporto</span>
              <textarea
                rows="2"
                [value]="step.supportGuidance"
                [disabled]="disabled"
                (input)="updateText(index, 'supportGuidance', readValue($event))"
              ></textarea>
            </label>

            <label class="field field--wide">
              <span>Rinforzo opzionale</span>
              <textarea
                rows="2"
                [value]="step.reinforcementNotes"
                [disabled]="disabled"
                (input)="updateText(index, 'reinforcementNotes', readValue($event))"
              ></textarea>
            </label>
          </div>
        </li>
      </ol>
    </section>
  `,
  styles: [
    `
      .panel {
        display: grid;
        gap: 1rem;
        padding: 1.2rem;
        border-radius: 1.6rem;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(17, 65, 91, 0.12);
        box-shadow: 0 16px 30px rgba(17, 65, 91, 0.08);
      }

      .panel__header,
      .step__header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
      }

      .panel__eyebrow,
      .step__badge {
        margin: 0 0 0.35rem;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #7c5f3b;
      }

      .panel__empty,
      .field span {
        color: #4b5563;
      }

      .panel__primary,
      .step__actions button {
        min-height: 2.4rem;
        border-radius: 999px;
        border: 1px solid rgba(17, 65, 91, 0.16);
        padding: 0 0.95rem;
        font: inherit;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.94);
        color: #31566b;
      }

      .panel__primary {
        background: #11415b;
        color: #ffffff;
        border: 0;
      }

      .steps {
        display: grid;
        gap: 0.9rem;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .step {
        display: grid;
        gap: 0.95rem;
        padding: 1rem;
        border-radius: 1.2rem;
        background: rgba(247, 250, 252, 0.96);
      }

      .step__actions {
        display: flex;
        gap: 0.55rem;
        flex-wrap: wrap;
      }

      .step__danger {
        color: #b42318;
      }

      .step__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
        gap: 0.85rem;
      }

      .field {
        display: grid;
        gap: 0.45rem;
      }

      .field--wide {
        grid-column: 1 / -1;
      }

      .field--compact {
        align-content: start;
      }

      .field input,
      .field textarea {
        width: 100%;
        border-radius: 1rem;
        border: 1px solid rgba(17, 65, 91, 0.16);
        background: rgba(255, 255, 255, 0.96);
        padding: 0.82rem 0.95rem;
        font: inherit;
        color: #1f2a37;
      }

      .field input[type='checkbox'] {
        width: auto;
        min-height: 1rem;
        padding: 0;
      }

      .field textarea {
        resize: vertical;
      }

      @media (max-width: 720px) {
        .panel__header,
        .step__header {
          flex-direction: column;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskStepAuthoringEditorComponent {
  @Input({ required: true }) steps: readonly TaskStepDraftRecord[] = [];
  @Input() disabled = false;

  @Output() stepsChange = new EventEmitter<TaskStepDraftRecord[]>();

  protected addStep(): void {
    this.emit([
      ...this.steps,
      {
        id: this.createStepId(),
        position: this.steps.length + 1,
        title: '',
        description: '',
        required: true,
        supportGuidance: '',
        reinforcementNotes: '',
        estimatedMinutes: null
      }
    ]);
  }

  protected duplicateStep(index: number): void {
    const source = this.steps[index];
    if (!source) {
      return;
    }

    const duplicated: TaskStepDraftRecord = {
      ...source,
      id: this.createStepId(),
      title: source.title ? `${source.title} copia` : ''
    };
    const next = [...this.steps];
    next.splice(index + 1, 0, duplicated);
    this.emit(next);
  }

  protected removeStep(index: number): void {
    const next = this.steps.filter((_, currentIndex) => currentIndex !== index);
    this.emit(next);
  }

  protected moveStep(index: number, direction: -1 | 1): void {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.steps.length) {
      return;
    }

    const next = [...this.steps];
    const [step] = next.splice(index, 1);
    if (!step) {
      return;
    }
    next.splice(targetIndex, 0, step);
    this.emit(next);
  }

  protected updateText(
    index: number,
    field: 'title' | 'description' | 'supportGuidance' | 'reinforcementNotes',
    value: string
  ): void {
    this.emit(this.steps.map((step, currentIndex) => (currentIndex === index ? { ...step, [field]: value } : step)));
  }

  protected updateRequired(index: number, value: boolean): void {
    this.emit(this.steps.map((step, currentIndex) => (currentIndex === index ? { ...step, required: value } : step)));
  }

  protected updateEstimatedMinutes(index: number, rawValue: string): void {
    const estimatedMinutes = rawValue.trim() === '' ? null : Number(rawValue);
    this.emit(
      this.steps.map((step, currentIndex) =>
        currentIndex === index
          ? { ...step, estimatedMinutes: Number.isNaN(estimatedMinutes) ? null : estimatedMinutes }
          : step
      )
    );
  }

  protected readValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected readChecked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  private emit(steps: readonly TaskStepDraftRecord[]): void {
    this.stepsChange.emit(
      steps.map((step, index) => ({
        ...step,
        position: index + 1
      }))
    );
  }

  private createStepId(): string {
    return `step-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }
}
