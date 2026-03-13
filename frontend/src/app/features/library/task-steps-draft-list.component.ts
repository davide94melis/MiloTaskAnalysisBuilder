import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskStepDraftRecord } from '../../core/tasks/task-detail.models';

@Component({
  selector: 'mtab-task-steps-draft-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="panel">
      <header class="panel__header">
        <div>
          <p class="panel__eyebrow">Ordine step</p>
          <h3>Conferma la sequenza delle bozze esistenti.</h3>
        </div>
        <span class="panel__count">{{ steps.length }} step</span>
      </header>

      <div class="panel__empty" *ngIf="!steps.length">Nessuna bozza step presente per questa task.</div>

      <ol class="steps" *ngIf="steps.length">
        <li class="steps__item" *ngFor="let step of steps; let index = index">
          <div class="steps__content">
            <span class="steps__badge">Step {{ index + 1 }}</span>
            <strong>{{ step.title || 'Titolo step da definire' }}</strong>
            <p>{{ step.description || 'Descrizione step da definire' }}</p>
          </div>

          <div class="steps__actions">
            <button
              type="button"
              [disabled]="disabled || index === 0"
              [attr.aria-label]="'Sposta ' + (step.title || 'questo step') + ' in alto'"
              (click)="moveStep(index, -1)"
            >
              Su
            </button>
            <button
              type="button"
              [disabled]="disabled || index === steps.length - 1"
              [attr.aria-label]="'Sposta ' + (step.title || 'questo step') + ' in basso'"
              (click)="moveStep(index, 1)"
            >
              Giu
            </button>
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

      .panel__header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
      }

      .panel__eyebrow {
        margin: 0 0 0.35rem;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #7c5f3b;
      }

      .panel__count,
      .panel__empty,
      p {
        color: #4b5563;
      }

      h3,
      p {
        margin: 0;
      }

      .steps {
        display: grid;
        gap: 0.8rem;
        padding: 0;
        margin: 0;
        list-style: none;
      }

      .steps__item {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        padding: 0.95rem;
        border-radius: 1.2rem;
        background: rgba(247, 250, 252, 0.96);
      }

      .steps__content {
        display: grid;
        gap: 0.25rem;
      }

      .steps__badge {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #6b7280;
      }

      .steps__actions {
        display: flex;
        gap: 0.55rem;
        flex-wrap: wrap;
      }

      .steps__actions button {
        min-width: 4rem;
        min-height: 2.4rem;
        border-radius: 999px;
        border: 1px solid rgba(17, 65, 91, 0.16);
        background: rgba(255, 255, 255, 0.94);
        color: #31566b;
        font: inherit;
        cursor: pointer;
      }

      .steps__actions button:disabled {
        cursor: default;
        opacity: 0.45;
      }

      @media (max-width: 720px) {
        .steps__item {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskStepsDraftListComponent {
  @Input({ required: true }) steps: readonly TaskStepDraftRecord[] = [];
  @Input() disabled = false;

  @Output() stepsChange = new EventEmitter<TaskStepDraftRecord[]>();

  protected moveStep(index: number, direction: -1 | 1): void {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.steps.length) {
      return;
    }

    const reordered = [...this.steps];
    const [moved] = reordered.splice(index, 1);

    if (!moved) {
      return;
    }

    reordered.splice(targetIndex, 0, moved);
    this.stepsChange.emit(
      reordered.map((step, position) => ({
        ...step,
        position: position + 1
      }))
    );
  }
}
