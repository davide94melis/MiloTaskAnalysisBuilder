import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TaskDetailRecord, TaskStepDraftRecord } from '../../core/tasks/task-detail.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';

@Component({
  selector: 'mtab-task-playback-preview-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="preview" *ngIf="task() as currentTask; else pendingState">
      <header class="preview__hero">
        <div class="preview__hero-copy">
          <p class="preview__eyebrow">Playback proof</p>
          <h2>{{ currentTask.title || 'Anteprima task' }}</h2>
          <p class="preview__lead">
            Questa schermata mostra solo la versione salvata della task, fuori dall editor, per verificare testo,
            simboli e immagini in un contesto di lettura bambino.
          </p>
        </div>

        <div class="preview__hero-actions">
          <a [routerLink]="['/tasks', currentTask.id]">Torna all editor</a>
          <span>{{ currentStepIndex() + 1 }} / {{ savedSteps().length }} step</span>
        </div>
      </header>

      <section class="preview__summary">
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
      </section>

      <article class="preview__step" *ngIf="currentStep() as step">
        <div class="preview__step-meta">
          <p class="preview__step-label">Step {{ step.position }}</p>
          <strong>{{ step.title || 'Step senza titolo' }}</strong>
          <p>{{ step.description || 'Nessuna descrizione aggiuntiva.' }}</p>
        </div>

        <section class="preview__support">
          <p class="preview__support-label">Supporto visivo salvato</p>

          <div class="preview__text-card" *ngIf="step.visualSupport.text.trim()">
            <span>Testo visivo</span>
            <strong>{{ step.visualSupport.text }}</strong>
          </div>

          <div class="preview__symbol-card" *ngIf="step.visualSupport.symbol as symbol">
            <span>Simbolo</span>
            <strong>{{ symbol.label }}</strong>
            <small>{{ symbol.library }} · {{ symbol.key }}</small>
          </div>

          <figure class="preview__image-card" *ngIf="step.visualSupport.image as image">
            <img [src]="image.url" [alt]="image.altText || image.fileName" />
            <figcaption>
              <strong>{{ image.altText || image.fileName }}</strong>
              <span>{{ image.fileName }}</span>
            </figcaption>
          </figure>

          <p class="preview__empty" *ngIf="!hasSavedVisualSupport(step)">
            Nessun supporto visivo salvato per questo step.
          </p>
        </section>

        <section class="preview__notes">
          <article *ngIf="step.supportGuidance">
            <span>Prompt</span>
            <p>{{ step.supportGuidance }}</p>
          </article>
          <article *ngIf="step.reinforcementNotes">
            <span>Rinforzo</span>
            <p>{{ step.reinforcementNotes }}</p>
          </article>
          <article *ngIf="step.estimatedMinutes !== null">
            <span>Tempo stimato</span>
            <p>{{ step.estimatedMinutes }} min</p>
          </article>
        </section>
      </article>

      <nav class="preview__nav" aria-label="Navigazione step anteprima">
        <button type="button" [disabled]="currentStepIndex() === 0" (click)="showPreviousStep()">Step precedente</button>
        <button
          type="button"
          class="preview__primary"
          [disabled]="currentStepIndex() >= savedSteps().length - 1"
          (click)="showNextStep()"
        >
          Step successivo
        </button>
      </nav>
    </section>

    <ng-template #pendingState>
      <article class="preview preview--status" *ngIf="loading()">Caricamento anteprima salvata in corso.</article>
      <article class="preview preview--status preview--error" *ngIf="!loading() && loadError()">
        {{ loadError() }}
      </article>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .preview {
        display: grid;
        gap: 1rem;
      }

      .preview__hero,
      .preview__summary,
      .preview__step,
      .preview__nav,
      .preview--status {
        padding: 1.2rem;
        border-radius: 1.6rem;
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid rgba(17, 65, 91, 0.12);
        box-shadow: 0 16px 30px rgba(17, 65, 91, 0.08);
      }

      .preview__hero,
      .preview__step,
      .preview__nav {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
      }

      .preview__hero-copy,
      .preview__step-meta,
      .preview__support,
      .preview__notes {
        display: grid;
        gap: 0.55rem;
      }

      .preview__eyebrow,
      .preview__step-label,
      .preview__support-label,
      .preview__notes span,
      .preview__summary span {
        margin: 0;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #7c5f3b;
      }

      h2,
      p,
      figure,
      figcaption {
        margin: 0;
      }

      .preview__lead,
      .preview__step-meta p,
      .preview__notes p,
      .preview__empty,
      .preview__hero-actions span {
        color: #4b5563;
        line-height: 1.5;
      }

      .preview__hero-actions {
        display: grid;
        gap: 0.75rem;
        justify-items: end;
      }

      .preview__hero-actions a,
      .preview__nav button {
        min-height: 2.85rem;
        border-radius: 999px;
        padding: 0 1rem;
        font: inherit;
        text-decoration: none;
        border: 1px solid rgba(17, 65, 91, 0.16);
        background: rgba(247, 250, 252, 0.96);
        color: #31566b;
      }

      .preview__nav button {
        cursor: pointer;
      }

      .preview__nav .preview__primary {
        background: #11415b;
        color: #ffffff;
        border: 0;
      }

      .preview__summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
        gap: 0.8rem;
      }

      .preview__summary article,
      .preview__text-card,
      .preview__symbol-card,
      .preview__image-card,
      .preview__notes article {
        padding: 0.95rem;
        border-radius: 1.1rem;
        background: rgba(247, 250, 252, 0.96);
      }

      .preview__step {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
      }

      .preview__support,
      .preview__notes {
        align-content: start;
      }

      .preview__text-card strong,
      .preview__symbol-card strong {
        font-size: clamp(1.35rem, 2vw, 1.8rem);
        color: #11415b;
      }

      .preview__symbol-card small {
        color: #6b7280;
      }

      .preview__image-card {
        display: grid;
        gap: 0.75rem;
      }

      .preview__image-card img {
        width: 100%;
        max-height: 20rem;
        object-fit: contain;
        border-radius: 1rem;
        background: linear-gradient(180deg, rgba(244, 240, 223, 0.55), rgba(231, 243, 248, 0.7));
      }

      .preview__image-card figcaption {
        display: grid;
        gap: 0.25rem;
        color: #4b5563;
      }

      .preview--error {
        color: #b42318;
      }

      @media (max-width: 860px) {
        .preview__hero,
        .preview__step,
        .preview__nav {
          grid-template-columns: 1fr;
          flex-direction: column;
        }

        .preview__hero-actions {
          justify-items: start;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskPlaybackPreviewPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly taskLibrary = inject(TaskLibraryService);

  protected readonly task = signal<TaskDetailRecord | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly currentStepIndex = signal(0);
  protected readonly savedSteps = computed(() =>
    [...(this.task()?.steps ?? [])].sort((left, right) => left.position - right.position)
  );
  protected readonly currentStep = computed(() => this.savedSteps()[this.currentStepIndex()] ?? null);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      void this.loadPreview(params.get('taskId'));
    });
  }

  protected showPreviousStep(): void {
    this.currentStepIndex.update((index) => Math.max(index - 1, 0));
  }

  protected showNextStep(): void {
    this.currentStepIndex.update((index) => Math.min(index + 1, this.savedSteps().length - 1));
  }

  protected hasSavedVisualSupport(step: TaskStepDraftRecord): boolean {
    return Boolean(step.visualSupport.text.trim() || step.visualSupport.symbol || step.visualSupport.image);
  }

  private async loadPreview(taskId: string | null): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    this.task.set(null);
    this.currentStepIndex.set(0);

    if (!taskId) {
      this.loading.set(false);
      this.loadError.set('Task non trovata per l anteprima playback.');
      return;
    }

    try {
      const detail = await firstValueFrom(this.taskLibrary.getTaskDetail(taskId));
      this.task.set(detail);
    } catch {
      this.loadError.set('Impossibile caricare l anteprima playback della task.');
    } finally {
      this.loading.set(false);
    }
  }
}
