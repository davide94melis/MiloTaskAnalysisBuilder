import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TaskDetailRecord, TaskStepDraftRecord } from '../../core/tasks/task-detail.models';
import { PublicTaskPresentRecord, PublicTaskShareStepRecord } from '../../core/tasks/task-library.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { resolveTaskSymbolGlyph } from '../library/task-symbol-catalog';

type PresentViewport = 'phone' | 'tablet' | 'desktop';
type PresentSource = 'owner' | 'shared';

interface PresentTaskRecord {
  id: string;
  title: string;
  description: string;
  source: PresentSource;
  shareToken: string | null;
  steps: TaskStepDraftRecord[];
}

@Component({
  selector: 'mtab-task-guided-present-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <ng-container *ngIf="!loading(); else loadingState">
      <article class="present-shell present-shell--status present-shell--error" *ngIf="loadError(); else readyState">
        <div class="present-shell__status-copy">
          <p class="present-shell__eyebrow">{{ eyebrowLabel() }}</p>
          <h2>Presentazione non disponibile</h2>
          <p>{{ loadError() }}</p>
        </div>

        <div class="present-shell__status-actions">
          <a [routerLink]="fallbackLink()">{{ fallbackLabel() }}</a>
        </div>
      </article>
    </ng-container>

    <ng-template #readyState>
      <section
        *ngIf="task() as currentTask"
        class="present-shell"
        [ngClass]="presentShellClasses()"
        [attr.data-viewport]="viewport()"
      >
        <header class="present-shell__hero">
          <div class="present-shell__hero-copy">
            <p class="present-shell__eyebrow">{{ eyebrowLabel() }}</p>
            <h2>{{ currentTask.title || 'Task pronta per la sessione' }}</h2>
            <p class="present-shell__hero-summary">
              {{ heroSummary() }}
            </p>
          </div>

          <div class="present-shell__hero-tools">
            <div class="present-shell__hero-facts">
              <span>{{ completedStepIndexes().length }} / {{ savedSteps().length }} completati</span>
              <span *ngIf="savedSteps().length && !isSessionComplete()">Step {{ currentStepNumber() }} di {{ savedSteps().length }}</span>
              <span>{{ viewportLabel() }}</span>
            </div>

            <div class="present-shell__hero-actions" *ngIf="showHeroActions()">
              <button
                *ngIf="isOwnerTask() && hasCurrentAdultGuidance()"
                type="button"
                class="present-shell__ghost-action"
                (click)="toggleAdultGuidance()"
              >
                {{ showAdultGuidance() ? 'Nascondi supporto adulto' : 'Mostra supporto adulto' }}
              </button>
              <a *ngIf="isOwnerTask()" [routerLink]="['/tasks', currentTask.id]">Torna all editor</a>
              <a *ngIf="isSharedTask()" [routerLink]="['/shared', currentTask.shareToken]">Torna alla scheda condivisa</a>
            </div>
          </div>
        </header>

        <article class="present-shell__status-card" *ngIf="!savedSteps().length">
          <div class="present-shell__status-copy">
            <p class="present-shell__eyebrow">Task senza step</p>
            <h3>Aggiungi almeno uno step salvato prima di presentare la task</h3>
            <p>
              {{ zeroStepCopy() }}
            </p>
          </div>

          <div class="present-shell__status-actions">
            <a [routerLink]="fallbackLink()">{{ fallbackLabel() }}</a>
          </div>
        </article>

        <article class="present-shell__status-card present-shell__status-card--complete" *ngIf="savedSteps().length && isSessionComplete()">
          <div class="present-shell__status-copy">
            <p class="present-shell__eyebrow">Task completata</p>
            <h3>Sequenza conclusa</h3>
            <p>
              {{ completionCopy() }}
            </p>
          </div>

          <div class="present-shell__status-actions">
            <button type="button" class="present-shell__primary-action" (click)="restartSession()">Ricomincia la sessione</button>
            <a [routerLink]="fallbackLink()">{{ fallbackLabel() }}</a>
          </div>
        </article>

        <ng-container *ngIf="savedSteps().length && !isSessionComplete() && currentStep() as step">
          <section class="present-shell__progress-strip" aria-label="Avanzamento sequenza">
            <span
              *ngFor="let savedStep of savedSteps(); let index = index"
              class="present-shell__progress-pill"
              [class.present-shell__progress-pill--current]="index === currentStepIndex()"
              [class.present-shell__progress-pill--complete]="completedStepIndexes().includes(index)"
            >
              {{ index + 1 }}
            </span>
          </section>

          <article class="present-stage">
            <section class="present-stage__visual" aria-label="Supporti visivi salvati">
              <div class="present-stage__support present-stage__support--text" *ngIf="step.visualSupport.text.trim()">
                <span class="present-stage__support-label">Testo visivo</span>
                <strong>{{ step.visualSupport.text }}</strong>
              </div>

              <div class="present-stage__support present-stage__support--symbol" *ngIf="step.visualSupport.symbol as symbol">
                <span class="present-stage__support-label">Simbolo</span>
                <span class="present-stage__symbol-glyph" aria-hidden="true">{{ symbolGlyph(symbol) }}</span>
                <strong>{{ symbol.label }}</strong>
                <small>{{ symbol.library }} | {{ symbol.key }}</small>
              </div>

              <figure class="present-stage__support present-stage__support--image" *ngIf="step.visualSupport.image as image">
                <img [src]="image.url" [alt]="image.altText || image.fileName" />
                <figcaption>
                  <strong>{{ image.altText || image.fileName }}</strong>
                  <span>{{ image.fileName }}</span>
                </figcaption>
              </figure>

              <p class="present-stage__support-empty" *ngIf="!hasSavedVisualSupport(step)">
                Nessun supporto visivo salvato per questo step.
              </p>
            </section>

            <section class="present-stage__copy">
              <div class="present-stage__meta">
                <p class="present-shell__eyebrow">Step {{ currentStepNumber() }}</p>
                <span class="present-stage__state" *ngIf="isCurrentStepCompleted()">Completato</span>
                <span class="present-stage__state" *ngIf="!isCurrentStepCompleted()">
                  {{ step.required ? 'Step richiesto' : 'Step opzionale' }}
                </span>
              </div>

              <h3>{{ step.title || 'Step senza titolo' }}</h3>
              <p class="present-stage__description">{{ step.description || 'Nessuna descrizione aggiuntiva.' }}</p>

              <div class="present-stage__quick-facts">
                <span *ngIf="step.estimatedMinutes !== null">Circa {{ step.estimatedMinutes }} min</span>
                <span *ngIf="step.supportGuidance || step.reinforcementNotes">Supporto adulto disponibile</span>
                <span *ngIf="!step.supportGuidance && !step.reinforcementNotes && step.estimatedMinutes === null">
                  Nessun dettaglio adulto aggiuntivo
                </span>
              </div>

              <section class="present-stage__adult-panel" *ngIf="showAdultGuidance() && hasCurrentAdultGuidance()">
                <article class="present-stage__adult-card" *ngIf="step.supportGuidance">
                  <p class="present-shell__eyebrow">Prompt adulto</p>
                  <strong>{{ step.supportGuidance }}</strong>
                </article>

                <article class="present-stage__adult-card" *ngIf="step.reinforcementNotes">
                  <p class="present-shell__eyebrow">Rinforzo</p>
                  <strong>{{ step.reinforcementNotes }}</strong>
                </article>

                <article class="present-stage__adult-card" *ngIf="step.estimatedMinutes !== null">
                  <p class="present-shell__eyebrow">Tempo stimato</p>
                  <strong>{{ step.estimatedMinutes }} min</strong>
                </article>
              </section>
            </section>
          </article>

          <nav class="present-shell__nav" aria-label="Controlli modalita guidata">
            <button type="button" class="present-shell__ghost-action" [disabled]="isFirstStep()" (click)="showPreviousStep()">
              Step precedente
            </button>

            <button
              type="button"
              class="present-shell__primary-action"
              [disabled]="!currentStep()"
              (click)="handlePrimaryAction()"
            >
              {{ primaryActionLabel() }}
            </button>

            <button type="button" class="present-shell__ghost-action" [disabled]="isLastStep()" (click)="showNextStep()">
              Step successivo
            </button>
          </nav>
        </ng-container>
      </section>
    </ng-template>

    <ng-template #loadingState>
      <article class="present-shell present-shell--status">
        <div class="present-shell__status-copy">
          <p class="present-shell__eyebrow">{{ eyebrowLabel() }}</p>
          <h2>Caricamento sessione</h2>
          <p>{{ loadingCopy() }}</p>
        </div>
      </article>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .present-shell {
        display: grid;
        gap: 1rem;
        color: #123446;
      }

      .present-shell__hero,
      .present-shell__progress-strip,
      .present-stage,
      .present-shell__nav,
      .present-shell__status-card,
      .present-shell--status {
        border-radius: 1.9rem;
        border: 1px solid rgba(18, 52, 70, 0.12);
        box-shadow: 0 22px 52px rgba(18, 52, 70, 0.08);
      }

      .present-shell__hero,
      .present-stage,
      .present-shell__status-card,
      .present-shell--status {
        background:
          radial-gradient(circle at top right, rgba(255, 232, 176, 0.45), transparent 32%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(244, 249, 251, 0.98));
      }

      .present-shell__hero,
      .present-stage,
      .present-shell__status-card,
      .present-shell--status {
        padding: 1.35rem;
      }

      .present-shell__hero,
      .present-stage {
        display: grid;
        gap: 1rem;
      }

      .present-shell__hero {
        grid-template-columns: minmax(0, 1.2fr) minmax(16rem, 0.8fr);
        align-items: start;
      }

      .present-shell__hero-copy,
      .present-shell__hero-tools,
      .present-shell__hero-actions,
      .present-shell__hero-facts,
      .present-shell__status-copy,
      .present-shell__status-actions,
      .present-stage__visual,
      .present-stage__copy,
      .present-stage__adult-panel {
        display: grid;
        gap: 0.75rem;
      }

      .present-shell__progress-strip {
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
        padding: 0.8rem;
        background: rgba(255, 255, 255, 0.78);
      }

      .present-shell__progress-pill {
        min-width: 2.2rem;
        min-height: 2.2rem;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(18, 52, 70, 0.08);
        color: #466170;
        font-weight: 700;
      }

      .present-shell__progress-pill--current {
        background: #123446;
        color: #ffffff;
      }

      .present-shell__progress-pill--complete {
        background: #c8e8d1;
        color: #194d2d;
      }

      .present-stage {
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
        align-items: stretch;
      }

      .present-stage__visual,
      .present-stage__copy {
        align-content: start;
      }

      .present-stage__visual {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .present-stage__support,
      .present-stage__adult-card {
        padding: 1rem;
        border-radius: 1.35rem;
        background: rgba(248, 251, 252, 0.96);
        border: 1px solid rgba(18, 52, 70, 0.08);
      }

      .present-stage__support--image {
        grid-column: 1 / -1;
        display: grid;
        gap: 0.75rem;
      }

      .present-stage__support--text,
      .present-stage__support--symbol {
        min-height: 10rem;
        align-content: center;
      }

      .present-stage__symbol-glyph {
        font-size: clamp(3.5rem, 7vw, 5.5rem);
        line-height: 1;
      }

      .present-stage__support-label {
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #8e6236;
      }

      .present-stage__support strong {
        font-size: clamp(1.7rem, 3vw, 2.6rem);
        line-height: 1.15;
        color: #123446;
      }

      .present-stage__support small,
      .present-stage__support figcaption span,
      .present-shell__hero-summary,
      .present-stage__description,
      .present-stage__support-empty,
      .present-shell__status-copy p,
      .present-shell__hero-facts span {
        color: #49606c;
        line-height: 1.55;
      }

      .present-stage__support img {
        width: 100%;
        min-height: 14rem;
        max-height: 28rem;
        object-fit: contain;
        border-radius: 1rem;
        background: linear-gradient(180deg, rgba(255, 243, 202, 0.72), rgba(228, 242, 247, 0.82));
      }

      .present-stage__support figcaption {
        display: grid;
        gap: 0.25rem;
      }

      .present-stage__meta,
      .present-stage__quick-facts {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        align-items: center;
      }

      .present-stage__state,
      .present-stage__quick-facts span {
        display: inline-flex;
        align-items: center;
        min-height: 2.2rem;
        padding: 0 0.9rem;
        border-radius: 999px;
        background: rgba(18, 52, 70, 0.08);
        color: #123446;
      }

      .present-stage__description {
        font-size: clamp(1.05rem, 1.9vw, 1.3rem);
      }

      .present-stage__adult-card strong {
        color: #123446;
        line-height: 1.45;
      }

      .present-shell__nav {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.8rem;
        padding: 0.95rem;
        background: rgba(255, 255, 255, 0.88);
      }

      .present-shell__ghost-action,
      .present-shell__primary-action,
      .present-shell__hero-actions a,
      .present-shell__status-actions a {
        min-height: 3.25rem;
        border-radius: 999px;
        padding: 0 1.2rem;
        border: 1px solid rgba(18, 52, 70, 0.14);
        background: rgba(247, 250, 252, 0.96);
        color: #123446;
        font: inherit;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .present-shell__primary-action {
        border: 0;
        background: linear-gradient(180deg, #123446, #235772);
        color: #ffffff;
        font-weight: 700;
      }

      .present-shell__ghost-action:disabled,
      .present-shell__primary-action:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .present-shell__hero-tools {
        justify-items: end;
      }

      .present-shell__hero-facts {
        justify-items: end;
      }

      .present-shell__status-card--complete {
        background:
          radial-gradient(circle at top right, rgba(198, 232, 209, 0.8), transparent 30%),
          linear-gradient(180deg, rgba(241, 250, 244, 0.98), rgba(255, 255, 255, 0.96));
      }

      .present-shell--error {
        color: #b42318;
      }

      .present-shell__eyebrow {
        margin: 0;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #8e6236;
      }

      h2,
      h3,
      p,
      figure,
      figcaption {
        margin: 0;
      }

      .present-shell.present--tablet .present-stage {
        grid-template-columns: 1fr;
      }

      .present-shell.present--tablet .present-stage__visual {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .present-shell.present--phone .present-shell__hero,
      .present-shell.present--phone .present-stage,
      .present-shell.present--phone .present-shell__nav,
      .present-shell.present--phone .present-shell__status-card {
        padding: 1rem;
      }

      .present-shell.present--phone .present-shell__hero,
      .present-shell.present--phone .present-stage,
      .present-shell.present--phone .present-shell__nav {
        grid-template-columns: 1fr;
      }

      .present-shell.present--phone .present-stage__visual {
        grid-template-columns: 1fr;
      }

      .present-shell.present--phone .present-stage__support img {
        min-height: 11rem;
        max-height: 18rem;
      }

      .present-shell.present--phone .present-shell__hero-tools,
      .present-shell.present--phone .present-shell__hero-facts {
        justify-items: start;
      }

      @media (max-width: 1100px) {
        .present-shell__hero {
          grid-template-columns: 1fr;
        }

        .present-shell__hero-tools,
        .present-shell__hero-facts {
          justify-items: start;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskGuidedPresentPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly taskLibrary = inject(TaskLibraryService);

  protected readonly task = signal<PresentTaskRecord | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly currentStepIndex = signal(0);
  protected readonly completedStepIndexes = signal<number[]>([]);
  protected readonly showAdultGuidance = signal(false);
  protected readonly viewport = signal<PresentViewport>(this.resolveViewport());
  protected readonly activeToken = signal<string | null>(null);
  protected readonly sessionSaveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  protected readonly hasPersistedCurrentRun = signal(false);

  protected readonly savedSteps = computed(() =>
    [...(this.task()?.steps ?? [])].sort((left, right) => left.position - right.position)
  );
  protected readonly currentStep = computed(() => this.savedSteps()[this.currentStepIndex()] ?? null);
  protected readonly currentStepNumber = computed(() => this.currentStepIndex() + 1);
  protected readonly isFirstStep = computed(() => this.currentStepIndex() === 0);
  protected readonly isLastStep = computed(() => this.currentStepIndex() >= this.savedSteps().length - 1);
  protected readonly isCurrentStepCompleted = computed(() =>
    this.completedStepIndexes().includes(this.currentStepIndex())
  );
  protected readonly isSessionComplete = computed(() => {
    const stepCount = this.savedSteps().length;
    return stepCount > 0 && this.completedStepIndexes().length === stepCount;
  });
  protected readonly hasCurrentAdultGuidance = computed(() => {
    const step = this.currentStep();
    return Boolean(step && this.hasAdultGuidance(step));
  });
  protected readonly primaryActionLabel = computed(() => {
    if (!this.currentStep()) {
      return 'Completa step corrente';
    }

    if (this.isCurrentStepCompleted()) {
      return this.isLastStep() ? 'Step gia completato' : 'Vai allo step successivo';
    }

    return this.isLastStep() ? 'Completa task' : 'Completa step corrente';
  });
  protected readonly viewportLabel = computed(() => {
    switch (this.viewport()) {
      case 'phone':
        return 'Layout telefono';
      case 'tablet':
        return 'Layout tablet';
      default:
        return 'Layout desktop';
    }
  });
  protected readonly presentShellClasses = computed(() => ({
    'present--phone': this.viewport() === 'phone',
    'present--tablet': this.viewport() === 'tablet',
    'present--desktop': this.viewport() === 'desktop'
  }));

  constructor() {
    this.route.paramMap.subscribe((params) => {
      void this.loadPresentTask(params.get('taskId'), params.get('token'));
    });
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.viewport.set(this.resolveViewport());
  }

  protected showPreviousStep(): void {
    this.currentStepIndex.update((index) => Math.max(index - 1, 0));
    this.syncAdultGuidanceVisibility();
  }

  protected showNextStep(): void {
    this.currentStepIndex.update((index) => Math.min(index + 1, this.savedSteps().length - 1));
    this.syncAdultGuidanceVisibility();
  }

  protected handlePrimaryAction(): void {
    if (this.isCurrentStepCompleted()) {
      if (!this.isLastStep()) {
        this.showNextStep();
      }
      return;
    }

    this.markCurrentStepCompleted();
  }

  protected markCurrentStepCompleted(): void {
    const step = this.currentStep();
    if (!step || this.isCurrentStepCompleted()) {
      return;
    }

    const currentIndex = this.currentStepIndex();
    const nextCompletedIndexes = [...this.completedStepIndexes(), currentIndex].sort((left, right) => left - right);
    this.completedStepIndexes.set(nextCompletedIndexes);

    if (nextCompletedIndexes.length === this.savedSteps().length) {
      void this.persistCompletedSession();
    }

    if (!this.isLastStep()) {
      this.currentStepIndex.set(currentIndex + 1);
      this.syncAdultGuidanceVisibility();
    }
  }

  protected restartSession(): void {
    this.resetSessionState();
  }

  protected toggleAdultGuidance(): void {
    this.showAdultGuidance.update((value) => !value);
  }

  protected hasSavedVisualSupport(step: TaskStepDraftRecord): boolean {
    return Boolean(step.visualSupport.text.trim() || step.visualSupport.symbol || step.visualSupport.image);
  }

  protected symbolGlyph(symbol: { library: string; key: string; label: string } | null | undefined): string {
    return resolveTaskSymbolGlyph(symbol?.library, symbol?.key) ?? symbol?.label.slice(0, 1) ?? '?';
  }

  protected isOwnerTask(): boolean {
    return this.task()?.source === 'owner';
  }

  protected isSharedTask(): boolean {
    return this.task()?.source === 'shared';
  }

  protected showHeroActions(): boolean {
    return (this.isOwnerTask() && this.hasCurrentAdultGuidance()) || this.isOwnerTask() || this.isSharedTask();
  }

  protected eyebrowLabel(): string {
    return this.isSharedContext() ? 'Presentazione condivisa' : 'Present mode guidato';
  }

  protected heroSummary(): string {
    if (this.isSharedContext()) {
      return 'Uno step alla volta dal link condiviso salvato, con la stessa chiarezza della presentazione interna ma senza editor o controlli proprietario.';
    }

    return 'Uno step alla volta dalla versione salvata della task, con superficie pulita e una sessione minima salvata solo al termine del percorso.';
  }

  protected loadingCopy(): string {
    return this.isSharedContext()
      ? 'Sto recuperando la versione condivisa della task da presentare.'
      : 'Sto recuperando la versione salvata della task da presentare.';
  }

  protected zeroStepCopy(): string {
    if (this.isSharedContext()) {
      return 'Il link condiviso non contiene step pubblicabili. Torna alla scheda condivisa o chiedi una nuova versione al proprietario.';
    }

    return 'La modalita guidata usa solo il contenuto gia salvato. Apri l editor, aggiungi gli step necessari e salva la task prima di avviare una sessione.';
  }

  protected completionCopy(): string {
    switch (this.sessionSaveState()) {
      case 'saving':
        return this.isSharedContext()
          ? 'Tutti gli step condivisi risultano completati. Sto registrando la sessione minima del link condiviso.'
          : 'Tutti gli step salvati risultano completati. Sto registrando la sessione minima di questa task.';
      case 'saved':
        return this.isSharedContext()
          ? 'Tutti gli step condivisi risultano completati. La sessione minima del link condiviso e stata registrata.'
          : 'Tutti gli step salvati risultano completati. La sessione minima di questa task e stata registrata.';
      case 'error':
        return this.isSharedContext()
          ? 'Tutti gli step condivisi risultano completati. Il salvataggio minimo della sessione condivisa non e riuscito.'
          : 'Tutti gli step salvati risultano completati. Il salvataggio minimo della sessione non e riuscito.';
      default:
        return this.isSharedContext()
          ? 'Tutti gli step condivisi risultano completati. La registrazione minima della sessione parte automaticamente al termine.'
          : 'Tutti gli step salvati risultano completati. La registrazione minima della sessione parte automaticamente al termine.';
    }
  }

  protected fallbackLink(): string[] {
    const currentTask = this.task();
    if (currentTask?.source === 'shared' && currentTask.shareToken) {
      return ['/shared', currentTask.shareToken];
    }

    return ['/library'];
  }

  protected fallbackLabel(): string {
    return this.isSharedContext() ? 'Torna alla scheda condivisa' : 'Torna alla libreria';
  }

  private isSharedContext(): boolean {
    return this.task()?.source === 'shared' || Boolean(this.activeToken());
  }

  private async persistCompletedSession(): Promise<void> {
    const currentTask = this.task();
    const shareToken = currentTask?.shareToken ?? this.activeToken();
    const stepCount = this.savedSteps().length;

    if (!currentTask || !stepCount || this.hasPersistedCurrentRun()) {
      return;
    }

    this.sessionSaveState.set('saving');

    try {
      if (currentTask.source === 'shared' && shareToken) {
        await firstValueFrom(
          this.taskLibrary.createPublicPresentTaskSession(shareToken, {
            stepCount,
            completed: true
          })
        );
      } else {
        await firstValueFrom(
          this.taskLibrary.createTaskSession(currentTask.id, {
            stepCount,
            completed: true
          })
        );
      }

      this.hasPersistedCurrentRun.set(true);
      this.sessionSaveState.set('saved');
    } catch {
      this.sessionSaveState.set('error');
    }
  }

  private resetSessionState(): void {
    this.currentStepIndex.set(0);
    this.completedStepIndexes.set([]);
    this.showAdultGuidance.set(false);
    this.hasPersistedCurrentRun.set(false);
    this.sessionSaveState.set('idle');
  }

  private hasAdultGuidance(step: TaskStepDraftRecord): boolean {
    return Boolean(step.supportGuidance || step.reinforcementNotes || step.estimatedMinutes !== null);
  }

  private syncAdultGuidanceVisibility(forceHidden = false): void {
    if (forceHidden) {
      this.showAdultGuidance.set(false);
      return;
    }

    if (!this.hasCurrentAdultGuidance()) {
      this.showAdultGuidance.set(false);
    }
  }

  private resolveViewport(): PresentViewport {
    const width = typeof window === 'undefined' ? 1280 : window.innerWidth;
    if (width < 700) {
      return 'phone';
    }

    if (width < 1080) {
      return 'tablet';
    }

    return 'desktop';
  }

  private async loadPresentTask(taskId: string | null, token: string | null): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    this.task.set(null);
    this.activeToken.set(token);
    this.resetSessionState();
    this.viewport.set(this.resolveViewport());

    if (!taskId && !token) {
      this.loading.set(false);
      this.loadError.set('Task non trovata per la presentazione guidata.');
      return;
    }

    try {
      if (token) {
        const detail = await firstValueFrom(this.taskLibrary.getPublicPresentTaskShare(token));
        this.task.set(this.mapSharedTask(detail));
      } else if (taskId) {
        const detail = await firstValueFrom(this.taskLibrary.getTaskDetail(taskId));
        this.task.set(this.mapOwnerTask(detail));
      }
      this.syncAdultGuidanceVisibility(true);
    } catch {
      this.loadError.set(
        token
          ? 'Impossibile caricare la task condivisa per la presentazione guidata.'
          : 'Impossibile caricare la task salvata per la presentazione guidata.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  private mapOwnerTask(detail: TaskDetailRecord): PresentTaskRecord {
    return {
      id: detail.id,
      title: detail.title,
      description: detail.description,
      source: 'owner',
      shareToken: null,
      steps: detail.steps
    };
  }

  private mapSharedTask(detail: PublicTaskPresentRecord): PresentTaskRecord {
    return {
      id: detail.taskId,
      title: detail.title,
      description: '',
      source: 'shared',
      shareToken: this.activeToken(),
      steps: detail.steps.map((step) => this.mapSharedStep(step))
    };
  }

  private mapSharedStep(step: PublicTaskShareStepRecord): TaskStepDraftRecord {
    return {
      id: step.id,
      position: step.position,
      title: step.title,
      description: step.description,
      required: step.required,
      supportGuidance: '',
      reinforcementNotes: '',
      estimatedMinutes: null,
      visualSupport: {
        text: step.visualSupport.text,
        symbol: step.visualSupport.symbol ? { ...step.visualSupport.symbol } : null,
        image: step.visualSupport.image
          ? {
              ...step.visualSupport.image,
              storageKey: ''
            }
          : null
      },
      uploadState: null
    };
  }
}
