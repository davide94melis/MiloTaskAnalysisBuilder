import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TaskDetailRecord, TaskStepDraftRecord } from '../../core/tasks/task-detail.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';

@Component({
  selector: 'mtab-task-guided-present-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <ng-container *ngIf="!loading(); else loadingState">
      <article class="present present--status present--error" *ngIf="loadError(); else readyState">
        <div class="present__status-copy">
          <p class="present__eyebrow">Present mode guidato</p>
          <h2>Presentazione non disponibile</h2>
          <p>{{ loadError() }}</p>
        </div>

        <div class="present__status-actions">
          <a routerLink="/library">Torna alla libreria</a>
        </div>
      </article>
    </ng-container>

    <ng-template #readyState>
      <section class="present" *ngIf="task() as currentTask">
        <header class="present__hero">
          <div class="present__hero-copy">
            <p class="present__eyebrow">Present mode guidato</p>
            <h2>{{ currentTask.title || 'Task pronta per la sessione' }}</h2>
            <p class="present__lead">
              Questa vista usa solo la versione salvata della task e tiene i progressi della sessione nel browser,
              senza registrare completamenti o storico.
            </p>
          </div>

          <div class="present__hero-actions">
            <a [routerLink]="['/tasks', currentTask.id]">Torna all editor</a>
            <div class="present__hero-facts">
              <span>{{ completedStepIndexes().length }} / {{ savedSteps().length }} completati</span>
              <span *ngIf="!isSessionComplete()">Step {{ currentStepIndex() + 1 }} di {{ savedSteps().length }}</span>
            </div>
          </div>
        </header>

        <article class="present present--status" *ngIf="!savedSteps().length">
          <div class="present__status-copy">
            <p class="present__eyebrow">Task senza step</p>
            <h3>Aggiungi almeno uno step salvato prima di presentare la task</h3>
            <p>
              La modalita guidata non usa bozze locali. Apri l editor, aggiungi gli step necessari e salva la task
              prima di avviare una sessione.
            </p>
          </div>

          <div class="present__status-actions">
            <a [routerLink]="['/tasks', currentTask.id]">Apri l editor della task</a>
          </div>
        </article>

        <article class="present present--status present--complete" *ngIf="savedSteps().length && isSessionComplete()">
          <div class="present__status-copy">
            <p class="present__eyebrow">Task completata</p>
            <h3>Sequenza completata</h3>
            <p>
              Tutti gli step salvati risultano completati in questa sessione locale. Nessun dato e stato salvato fuori
              dal browser.
            </p>
          </div>

          <div class="present__status-actions">
            <button type="button" class="present__primary" (click)="restartSession()">Ricomincia la sessione</button>
            <a [routerLink]="['/tasks', currentTask.id]">Torna all editor</a>
          </div>
        </article>

        <ng-container *ngIf="savedSteps().length && !isSessionComplete() && currentStep() as step">
          <section class="present__canvas">
            <article class="present__step-card">
              <div class="present__step-head">
                <p class="present__step-index">Step {{ step.position }}</p>
                <span class="present__step-state" *ngIf="isCurrentStepCompleted()">Completato</span>
                <span class="present__step-state" *ngIf="!isCurrentStepCompleted()">
                  {{ step.required ? 'Richiesto' : 'Opzionale' }}
                </span>
              </div>

              <h3>{{ step.title || 'Step senza titolo' }}</h3>
              <p class="present__step-description">{{ step.description || 'Nessuna descrizione aggiuntiva.' }}</p>

              <section class="present__support" aria-label="Supporti visivi salvati">
                <div class="present__text-card" *ngIf="step.visualSupport.text.trim()">
                  <span>Testo visivo</span>
                  <strong>{{ step.visualSupport.text }}</strong>
                </div>

                <div class="present__symbol-card" *ngIf="step.visualSupport.symbol as symbol">
                  <span>Simbolo</span>
                  <strong>{{ symbol.label }}</strong>
                  <small>{{ symbol.library }} · {{ symbol.key }}</small>
                </div>

                <figure class="present__image-card" *ngIf="step.visualSupport.image as image">
                  <img [src]="image.url" [alt]="image.altText || image.fileName" />
                  <figcaption>
                    <strong>{{ image.altText || image.fileName }}</strong>
                    <span>{{ image.fileName }}</span>
                  </figcaption>
                </figure>

                <p class="present__empty" *ngIf="!hasSavedVisualSupport(step)">
                  Nessun supporto visivo salvato per questo step.
                </p>
              </section>
            </article>

            <aside class="present__coach-panel">
              <article class="present__coach-card">
                <p class="present__coach-label">Prompt</p>
                <strong>{{ step.supportGuidance || 'Nessun prompt salvato per questo step.' }}</strong>
              </article>

              <article class="present__coach-card">
                <p class="present__coach-label">Rinforzo</p>
                <strong>{{ step.reinforcementNotes || 'Nessuna nota di rinforzo salvata.' }}</strong>
              </article>

              <article class="present__coach-card">
                <p class="present__coach-label">Tempo stimato</p>
                <strong>{{ step.estimatedMinutes === null ? 'Non indicato' : step.estimatedMinutes + ' min' }}</strong>
              </article>
            </aside>
          </section>

          <nav class="present__nav" aria-label="Controlli modalita guidata">
            <button type="button" class="present__ghost" [disabled]="isFirstStep()" (click)="showPreviousStep()">
              Step precedente
            </button>
            <button type="button" class="present__ghost" [disabled]="isLastStep()" (click)="showNextStep()">
              Step successivo
            </button>
            <button
              type="button"
              class="present__primary"
              [disabled]="isCurrentStepCompleted()"
              (click)="markCurrentStepCompleted()"
            >
              {{ isLastStep() ? 'Completa task' : 'Completa step corrente' }}
            </button>
          </nav>
        </ng-container>
      </section>
    </ng-template>

    <ng-template #loadingState>
      <article class="present present--status">
        <div class="present__status-copy">
          <p class="present__eyebrow">Present mode guidato</p>
          <h2>Caricamento sessione</h2>
          <p>Sto recuperando la versione salvata della task da presentare.</p>
        </div>
      </article>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .present {
        display: grid;
        gap: 1rem;
      }

      .present__hero,
      .present__canvas,
      .present__nav,
      .present--status {
        padding: 1.3rem;
        border-radius: 1.75rem;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(17, 65, 91, 0.12);
        box-shadow: 0 18px 38px rgba(17, 65, 91, 0.08);
      }

      .present__hero,
      .present__canvas,
      .present--status {
        display: grid;
        gap: 1rem;
      }

      .present__hero {
        grid-template-columns: minmax(0, 1.4fr) minmax(15rem, 0.8fr);
        align-items: start;
      }

      .present__hero-copy,
      .present__hero-actions,
      .present__status-copy,
      .present__status-actions,
      .present__step-card,
      .present__support,
      .present__coach-panel {
        display: grid;
        gap: 0.75rem;
      }

      .present__canvas {
        grid-template-columns: minmax(0, 1.45fr) minmax(15rem, 0.75fr);
        align-items: start;
      }

      .present__nav {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .present__eyebrow,
      .present__coach-label,
      .present__step-index {
        margin: 0;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #7c5f3b;
      }

      h2,
      h3,
      p,
      figure,
      figcaption {
        margin: 0;
      }

      .present__lead,
      .present__step-description,
      .present__empty,
      .present__status-copy p,
      .present__hero-facts span,
      .present__image-card figcaption span {
        color: #4b5563;
        line-height: 1.55;
      }

      .present__hero-actions {
        justify-items: end;
      }

      .present__hero-actions a,
      .present__status-actions a,
      .present__nav button,
      .present__status-actions button {
        min-height: 3rem;
        border-radius: 999px;
        padding: 0 1.1rem;
        font: inherit;
        text-decoration: none;
        border: 1px solid rgba(17, 65, 91, 0.16);
        background: rgba(247, 250, 252, 0.96);
        color: #31566b;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .present__nav button,
      .present__status-actions button {
        cursor: pointer;
      }

      .present__primary {
        border: 0;
        background: #11415b;
        color: #ffffff;
      }

      .present__nav button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .present__hero-facts {
        justify-items: end;
      }

      .present__step-card,
      .present__coach-card,
      .present__text-card,
      .present__symbol-card,
      .present__image-card {
        padding: 1rem;
        border-radius: 1.25rem;
        background: rgba(247, 250, 252, 0.96);
      }

      .present__step-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .present__step-state {
        display: inline-flex;
        align-items: center;
        padding: 0.4rem 0.8rem;
        border-radius: 999px;
        background: rgba(17, 65, 91, 0.08);
        color: #11415b;
      }

      .present__support {
        align-content: start;
      }

      .present__text-card strong,
      .present__symbol-card strong {
        font-size: clamp(1.55rem, 2.5vw, 2.1rem);
        color: #11415b;
      }

      .present__symbol-card small {
        color: #6b7280;
      }

      .present__image-card {
        display: grid;
        gap: 0.75rem;
      }

      .present__image-card img {
        width: 100%;
        min-height: 16rem;
        max-height: 26rem;
        object-fit: contain;
        border-radius: 1rem;
        background: linear-gradient(180deg, rgba(244, 240, 223, 0.6), rgba(231, 243, 248, 0.78));
      }

      .present__image-card figcaption {
        display: grid;
        gap: 0.2rem;
      }

      .present__coach-card strong {
        color: #11415b;
        line-height: 1.5;
      }

      .present--complete {
        background: linear-gradient(180deg, rgba(235, 247, 239, 0.95), rgba(255, 255, 255, 0.96));
      }

      .present--error {
        color: #b42318;
      }

      @media (max-width: 960px) {
        .present__hero,
        .present__canvas,
        .present__nav {
          grid-template-columns: 1fr;
        }

        .present__hero-actions,
        .present__hero-facts {
          justify-items: start;
        }
      }

      @media (max-width: 640px) {
        .present__hero,
        .present__canvas,
        .present__nav,
        .present--status {
          padding: 1rem;
        }

        .present__image-card img {
          min-height: 12rem;
          max-height: 18rem;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskGuidedPresentPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly taskLibrary = inject(TaskLibraryService);

  protected readonly task = signal<TaskDetailRecord | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly currentStepIndex = signal(0);
  protected readonly completedStepIndexes = signal<number[]>([]);

  protected readonly savedSteps = computed(() =>
    [...(this.task()?.steps ?? [])].sort((left, right) => left.position - right.position)
  );
  protected readonly currentStep = computed(() => this.savedSteps()[this.currentStepIndex()] ?? null);
  protected readonly isFirstStep = computed(() => this.currentStepIndex() === 0);
  protected readonly isLastStep = computed(() => this.currentStepIndex() >= this.savedSteps().length - 1);
  protected readonly isCurrentStepCompleted = computed(() =>
    this.completedStepIndexes().includes(this.currentStepIndex())
  );
  protected readonly isSessionComplete = computed(() => {
    const stepCount = this.savedSteps().length;
    return stepCount > 0 && this.completedStepIndexes().length === stepCount;
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      void this.loadPresentTask(params.get('taskId'));
    });
  }

  protected showPreviousStep(): void {
    this.currentStepIndex.update((index) => Math.max(index - 1, 0));
  }

  protected showNextStep(): void {
    this.currentStepIndex.update((index) => Math.min(index + 1, this.savedSteps().length - 1));
  }

  protected markCurrentStepCompleted(): void {
    const step = this.currentStep();
    if (!step || this.isCurrentStepCompleted()) {
      return;
    }

    const currentIndex = this.currentStepIndex();
    this.completedStepIndexes.update((indexes) => [...indexes, currentIndex]);

    if (!this.isLastStep()) {
      this.currentStepIndex.set(currentIndex + 1);
    }
  }

  protected restartSession(): void {
    this.currentStepIndex.set(0);
    this.completedStepIndexes.set([]);
  }

  protected hasSavedVisualSupport(step: TaskStepDraftRecord): boolean {
    return Boolean(step.visualSupport.text.trim() || step.visualSupport.symbol || step.visualSupport.image);
  }

  private async loadPresentTask(taskId: string | null): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    this.task.set(null);
    this.restartSession();

    if (!taskId) {
      this.loading.set(false);
      this.loadError.set('Task non trovata per la presentazione guidata.');
      return;
    }

    try {
      const detail = await firstValueFrom(this.taskLibrary.getTaskDetail(taskId));
      this.task.set(detail);
    } catch {
      this.loadError.set('Impossibile caricare la task salvata per la presentazione guidata.');
    } finally {
      this.loading.set(false);
    }
  }
}
