import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskCardRecord } from '../../core/tasks/task-library.models';

@Component({
  selector: 'mtab-task-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <article class="card">
      <header class="card__header">
        <span class="card__status" [class.card__status--template]="task.status === 'template'">
          {{ task.status === 'template' ? 'Template' : 'Bozza' }}
        </span>
        <span class="card__steps">{{ task.stepCount }} step</span>
      </header>

      <div class="card__body">
        <h4>{{ task.title }}</h4>
        <p>{{ task.category || 'Categoria da definire' }}</p>
        <p>{{ task.targetLabel || 'Destinatario libero' }}</p>
      </div>

      <dl class="card__meta">
        <div>
          <dt>Supporto</dt>
          <dd>{{ task.supportLevel || 'Da definire' }}</dd>
        </div>
        <div>
          <dt>Contesto</dt>
          <dd>{{ task.contextLabel || 'Da definire' }}</dd>
        </div>
        <div>
          <dt>Aggiornata</dt>
          <dd>{{ task.lastUpdatedAt | date: 'dd/MM/yyyy' }}</dd>
        </div>
      </dl>

      <footer class="card__actions">
        <button type="button" class="card__primary" (click)="openTask.emit(task)">{{ openLabel }}</button>
        <button type="button" class="card__secondary" (click)="duplicateTask.emit(task)">{{ duplicateLabel }}</button>
      </footer>
    </article>
  `,
  styles: [
    `
      .card {
        display: grid;
        gap: 0.9rem;
        height: 100%;
        padding: 1rem;
        border-radius: 1.3rem;
        background: rgba(247, 250, 252, 0.96);
        border: 1px solid rgba(17, 65, 91, 0.12);
      }

      .card__header,
      .card__actions {
        display: flex;
        justify-content: space-between;
        gap: 0.6rem;
        align-items: center;
      }

      .card__status {
        padding: 0.35rem 0.65rem;
        border-radius: 999px;
        background: rgba(17, 65, 91, 0.08);
        color: #11415b;
        font-size: 0.85rem;
      }

      .card__status--template {
        background: rgba(245, 158, 11, 0.15);
        color: #9a6400;
      }

      .card__steps {
        color: #6b7280;
        font-size: 0.85rem;
      }

      h4,
      p,
      dl,
      dt,
      dd {
        margin: 0;
      }

      .card__body {
        display: grid;
        gap: 0.35rem;
      }

      .card__body p {
        color: #4b5563;
      }

      .card__meta {
        display: grid;
        gap: 0.65rem;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .card__meta dt {
        color: #6b7280;
        font-size: 0.78rem;
      }

      .card__meta dd {
        margin-top: 0.18rem;
        color: #1f2a37;
      }

      button {
        min-height: 2.5rem;
        border-radius: 999px;
        padding: 0 0.95rem;
        font: inherit;
        cursor: pointer;
      }

      .card__primary {
        border: 0;
        background: #11415b;
        color: #ffffff;
      }

      .card__secondary {
        border: 1px solid rgba(17, 65, 91, 0.16);
        background: rgba(255, 255, 255, 0.92);
        color: #31566b;
      }
    `
  ],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskCardComponent {
  @Input({ required: true }) task!: TaskCardRecord;
  @Input() openLabel = 'Apri';
  @Input() duplicateLabel = 'Duplica';

  @Output() openTask = new EventEmitter<TaskCardRecord>();
  @Output() duplicateTask = new EventEmitter<TaskCardRecord>();
}
