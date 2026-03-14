import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TaskDetailRecord, TaskStepDraftRecord } from '../../core/tasks/task-detail.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';

@Component({
  selector: 'mtab-task-print-export-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <ng-container *ngIf="!loading(); else loadingState">
      <article class="export-shell export-shell--status export-shell--error" *ngIf="loadError(); else readyState">
        <div class="export-shell__status-copy">
          <p class="export-shell__eyebrow">Export PDF</p>
          <h2>Export non disponibile</h2>
          <p>{{ loadError() }}</p>
        </div>

        <div class="export-shell__status-actions">
          <a [routerLink]="fallbackLink()">Torna all editor</a>
        </div>
      </article>
    </ng-container>

    <ng-template #readyState>
      <section class="export-shell" *ngIf="task() as currentTask">
        <header class="export-shell__toolbar">
          <div class="export-shell__toolbar-copy">
            <p class="export-shell__eyebrow">Export PDF</p>
            <h2>{{ currentTask.title || 'Task pronta per la stampa' }}</h2>
            <p>
              Questa vista usa solo la versione salvata della task e prepara un documento stampabile con browser
              print o salvataggio PDF.
            </p>
          </div>

          <div class="export-shell__toolbar-actions">
            <button type="button" class="export-shell__primary-action" (click)="triggerPrint()">Stampa o salva PDF</button>
            <a [routerLink]="['/tasks', currentTask.id, 'preview']">Apri anteprima playback</a>
            <a [routerLink]="fallbackLink()">Torna all editor</a>
          </div>
        </header>

        <article class="print-document">
          <header class="print-document__hero">
            <p class="print-document__eyebrow">Task analysis</p>
            <h1>{{ currentTask.title || 'Task senza titolo' }}</h1>
            <p class="print-document__description" *ngIf="currentTask.description">
              {{ currentTask.description }}
            </p>
          </header>

          <section class="print-document__facts" aria-label="Metadata task">
            <article>
              <span>Categoria</span>
              <strong>{{ currentTask.category || 'Da definire' }}</strong>
            </article>
            <article>
              <span>Target</span>
              <strong>{{ currentTask.targetLabel || 'Da definire' }}</strong>
            </article>
            <article>
              <span>Contesto</span>
              <strong>{{ currentTask.environmentLabel || currentTask.contextLabel || 'Da definire' }}</strong>
            </article>
            <article>
              <span>Supporto</span>
              <strong>{{ currentTask.supportLevel || 'Non indicato' }}</strong>
            </article>
            <article>
              <span>Difficolta</span>
              <strong>{{ currentTask.difficultyLevel || 'Non indicata' }}</strong>
            </article>
            <article>
              <span>Step</span>
              <strong>{{ orderedSteps().length }}</strong>
            </article>
          </section>

          <section class="print-document__steps" *ngIf="orderedSteps().length; else emptyState">
            <article class="print-step" *ngFor="let step of orderedSteps()">
              <header class="print-step__header">
                <span class="print-step__index">Step {{ step.position }}</span>
                <div class="print-step__title-block">
                  <h3>{{ step.title || 'Step senza titolo' }}</h3>
                  <p>{{ step.description || 'Nessuna descrizione aggiuntiva.' }}</p>
                </div>
              </header>

              <section class="print-step__supports">
                <article class="print-support print-support--text" *ngIf="step.visualSupport.text.trim()">
                  <span class="print-support__label">Testo visivo</span>
                  <strong>{{ step.visualSupport.text }}</strong>
                </article>

                <article class="print-support print-support--symbol" *ngIf="step.visualSupport.symbol as symbol">
                  <span class="print-support__label">Simbolo</span>
                  <strong>{{ symbol.label }}</strong>
                  <small>{{ symbol.library }} | {{ symbol.key }}</small>
                </article>

                <figure class="print-support print-support--image" *ngIf="step.visualSupport.image as image">
                  <img [src]="image.url" [alt]="image.altText || image.fileName" />
                  <figcaption>
                    <strong>{{ image.altText || image.fileName }}</strong>
                    <span>{{ image.fileName }}</span>
                  </figcaption>
                </figure>

                <p class="print-support__empty" *ngIf="!hasSavedVisualSupport(step)">
                  Nessun supporto visivo salvato per questo step.
                </p>
              </section>

              <footer class="print-step__footer">
                <span>{{ step.required ? 'Step richiesto' : 'Step opzionale' }}</span>
                <span *ngIf="step.estimatedMinutes !== null">Circa {{ step.estimatedMinutes }} min</span>
                <span *ngIf="step.estimatedMinutes === null">Tempo non indicato</span>
              </footer>
            </article>
          </section>

          <ng-template #emptyState>
            <article class="print-document__empty">
              Questa task non contiene step salvati da esportare.
            </article>
          </ng-template>
        </article>
      </section>
    </ng-template>

    <ng-template #loadingState>
      <article class="export-shell export-shell--status">
        <div class="export-shell__status-copy">
          <p class="export-shell__eyebrow">Export PDF</p>
          <h2>Caricamento documento</h2>
          <p>Sto preparando la versione salvata della task per la stampa.</p>
        </div>
      </article>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .export-shell {
        display: grid;
        gap: 1rem;
      }

      .export-shell__toolbar,
      .export-shell--status,
      .print-document {
        padding: 1.2rem;
        border-radius: 1.6rem;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(17, 65, 91, 0.12);
        box-shadow: 0 16px 30px rgba(17, 65, 91, 0.08);
      }

      .export-shell__toolbar {
        display: grid;
        gap: 1rem;
        grid-template-columns: minmax(0, 1.2fr) minmax(15rem, 0.8fr);
        align-items: start;
      }

      .export-shell__toolbar-copy,
      .export-shell__toolbar-actions,
      .export-shell__status-copy,
      .export-shell__status-actions,
      .print-document,
      .print-document__hero,
      .print-document__steps,
      .print-step,
      .print-step__title-block,
      .print-step__supports {
        display: grid;
        gap: 0.75rem;
      }

      .export-shell__eyebrow,
      .print-document__eyebrow,
      .print-step__index,
      .print-support__label,
      .print-document__facts span {
        margin: 0;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #7c5f3b;
      }

      .export-shell__toolbar-actions {
        justify-items: stretch;
      }

      .export-shell__toolbar-actions a,
      .export-shell__primary-action,
      .export-shell__status-actions a {
        min-height: 3rem;
        border-radius: 999px;
        padding: 0 1rem;
        font: inherit;
        text-decoration: none;
        border: 1px solid rgba(17, 65, 91, 0.16);
        background: rgba(247, 250, 252, 0.96);
        color: #31566b;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .export-shell__primary-action {
        border: 0;
        background: #11415b;
        color: #ffffff;
        font-weight: 700;
      }

      .export-shell--error {
        color: #b42318;
      }

      .print-document {
        gap: 1.2rem;
      }

      .print-document__hero {
        padding-bottom: 0.9rem;
        border-bottom: 1px solid rgba(17, 65, 91, 0.12);
      }

      .print-document__description {
        color: #4b5563;
        line-height: 1.55;
      }

      .print-document__facts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
        gap: 0.8rem;
      }

      .print-document__facts article,
      .print-support,
      .print-document__empty {
        padding: 0.95rem;
        border-radius: 1rem;
        background: rgba(247, 250, 252, 0.96);
      }

      .print-step {
        padding: 1rem;
        border-radius: 1.2rem;
        border: 1px solid rgba(17, 65, 91, 0.1);
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .print-step__header {
        display: grid;
        gap: 0.55rem;
      }

      .print-step__title-block p,
      .print-step__footer,
      .print-support small,
      .print-support figcaption span,
      .print-support__empty {
        color: #4b5563;
        line-height: 1.5;
      }

      .print-step__supports {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .print-support--image {
        grid-column: 1 / -1;
        display: grid;
        gap: 0.65rem;
      }

      .print-support img {
        width: 100%;
        max-height: 18rem;
        object-fit: contain;
        border-radius: 0.8rem;
        background: rgba(244, 240, 223, 0.55);
      }

      .print-support figcaption {
        display: grid;
        gap: 0.25rem;
      }

      .print-step__footer {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
      }

      h1,
      h2,
      h3,
      p,
      figure,
      figcaption {
        margin: 0;
      }

      @media (max-width: 860px) {
        .export-shell__toolbar,
        .print-step__supports {
          grid-template-columns: 1fr;
        }
      }

      @media print {
        :host {
          background: #ffffff;
        }

        .export-shell__toolbar {
          display: none;
        }

        .print-document {
          box-shadow: none;
          border: 0;
          padding: 0;
        }

        .print-document__facts article,
        .print-support,
        .print-document__empty {
          background: #ffffff;
          border: 1px solid rgba(17, 65, 91, 0.18);
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskPrintExportPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly taskLibrary = inject(TaskLibraryService);

  protected readonly task = signal<TaskDetailRecord | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly orderedSteps = computed(() =>
    [...(this.task()?.steps ?? [])].sort((left, right) => left.position - right.position)
  );

  constructor() {
    this.route.paramMap.subscribe((params) => {
      void this.loadExport(params.get('taskId'));
    });
  }

  protected triggerPrint(): void {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }

  protected hasSavedVisualSupport(step: TaskStepDraftRecord): boolean {
    return Boolean(step.visualSupport.text.trim() || step.visualSupport.symbol || step.visualSupport.image);
  }

  protected fallbackLink(): string[] {
    const taskId = this.task()?.id;
    return taskId ? ['/tasks', taskId] : ['/library'];
  }

  private async loadExport(taskId: string | null): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    this.task.set(null);

    if (!taskId) {
      this.loading.set(false);
      this.loadError.set('Task non trovata per l export PDF.');
      return;
    }

    try {
      const detail = await firstValueFrom(this.taskLibrary.getTaskDetail(taskId));
      this.task.set(detail);
      queueMicrotask(() => this.triggerPrint());
    } catch {
      this.loadError.set('Impossibile caricare la versione salvata della task per l export PDF.');
    } finally {
      this.loading.set(false);
    }
  }
}
