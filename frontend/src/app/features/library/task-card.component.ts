import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskCardRecord, TaskVariantRole } from '../../core/tasks/task-library.models';

@Component({
  selector: 'mtab-task-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <article class="card" [class.card--family]="familyRole() !== 'standalone'">
      <header class="card__header">
        <div class="card__support">
          <span class="card__support-label">Supporto</span>
          <strong>{{ task.supportLevel || 'Da definire' }}</strong>
        </div>
        <div class="card__chips">
          <span class="card__status" [class.card__status--template]="task.status === 'template'">
            {{ task.status === 'template' ? 'Template' : 'Bozza' }}
          </span>
          <span class="card__family-badge" [ngClass]="familyBadgeClass()">
            {{ familyBadge() }}
          </span>
        </div>
      </header>

      <div class="card__body">
        <h4>{{ task.title }}</h4>
        <p>{{ task.category || 'Categoria da definire' }}</p>
        <p>{{ task.targetLabel || 'Destinatario libero' }}</p>
        <p class="card__family-context">{{ familyContext() }}</p>
      </div>

      <dl class="card__meta">
        <div>
          <dt>Step</dt>
          <dd>{{ task.stepCount }}</dd>
        </div>
        <div>
          <dt>Famiglia</dt>
          <dd>{{ familyCountLabel() }}</dd>
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
        <button
          *ngIf="showCreateVariant"
          type="button"
          class="card__secondary card__secondary--accent"
          (click)="createVariant.emit(task)"
        >
          {{ createVariantLabel }}
        </button>
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

      .card--family {
        background:
          linear-gradient(180deg, rgba(255, 247, 214, 0.55), rgba(247, 250, 252, 0.96) 42%),
          rgba(247, 250, 252, 0.96);
      }

      .card__header,
      .card__actions {
        display: flex;
        justify-content: space-between;
        gap: 0.6rem;
        align-items: flex-start;
      }

      .card__support {
        display: grid;
        gap: 0.18rem;
      }

      .card__support-label {
        font-size: 0.72rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #7c5f3b;
      }

      .card__support strong {
        display: inline-flex;
        align-items: center;
        min-height: 2.3rem;
        padding: 0.45rem 0.85rem;
        border-radius: 999px;
        background: rgba(17, 65, 91, 0.12);
        color: #11415b;
        font-size: 1rem;
      }

      .card__chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: end;
        gap: 0.4rem;
      }

      .card__status,
      .card__family-badge {
        padding: 0.35rem 0.65rem;
        border-radius: 999px;
        font-size: 0.82rem;
      }

      .card__status--template {
        background: rgba(245, 158, 11, 0.15);
        color: #9a6400;
      }

      .card__status:not(.card__status--template) {
        background: rgba(17, 65, 91, 0.08);
        color: #11415b;
      }

      .card__family-badge {
        background: rgba(124, 95, 59, 0.12);
        color: #7c5f3b;
      }

      .card__family-badge--root {
        background: rgba(17, 65, 91, 0.1);
        color: #11415b;
      }

      .card__family-badge--variant {
        background: rgba(8, 145, 178, 0.12);
        color: #0f5e73;
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

      .card__family-context {
        min-height: 2.8rem;
        color: #31566b;
        font-size: 0.92rem;
      }

      .card__meta {
        display: grid;
        gap: 0.65rem;
        grid-template-columns: repeat(4, minmax(0, 1fr));
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
        flex: 1 1 10rem;
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

      .card__secondary--accent {
        border-color: rgba(124, 95, 59, 0.22);
        background: rgba(255, 247, 214, 0.9);
        color: #7c5f3b;
      }

      .card__actions {
        flex-wrap: wrap;
      }

      @media (max-width: 720px) {
        .card__meta {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
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
  @Input() createVariantLabel = 'Crea variante';
  @Input() showCreateVariant = false;

  @Output() openTask = new EventEmitter<TaskCardRecord>();
  @Output() duplicateTask = new EventEmitter<TaskCardRecord>();
  @Output() createVariant = new EventEmitter<TaskCardRecord>();

  protected familyRole(): TaskVariantRole {
    return this.task.variantRole ?? 'standalone';
  }

  protected familyBadge(): string {
    switch (this.familyRole()) {
      case 'root':
        return 'Task base';
      case 'variant':
        return 'Variante';
      default:
        return 'Task singola';
    }
  }

  protected familyBadgeClass(): string {
    return `card__family-badge--${this.familyRole()}`;
  }

  protected familyCountLabel(): string {
    const count = this.familyCount();
    return count === 1 ? 'Task singola' : `${count} task collegate`;
  }

  protected familyContext(): string {
    const rootTitle = this.task.variantRootTitle || this.task.title;
    switch (this.familyRole()) {
      case 'root':
        return `Task base con ${this.familyCount() - 1} varianti collegate e supporti differenziati.`;
      case 'variant':
        return `Variante della base "${rootTitle}" con supporto distinto ma stesso impianto operativo.`;
      default:
        return 'Task singola pronta da riaprire, copiare o trasformare in una nuova partenza.';
    }
  }

  private familyCount(): number {
    return this.task.variantCount && this.task.variantCount > 0 ? this.task.variantCount : 1;
  }
}
