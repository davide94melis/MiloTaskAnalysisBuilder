import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  RelatedVariantRecord,
  TaskDetailRecord,
  TaskStepDraftRecord,
  UpdateTaskDetailRequest,
  createEmptyVisualSupport,
  createIdleUploadState
} from '../../core/tasks/task-detail.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { TaskMetadataFormComponent } from './task-metadata-form.component';
import { TaskStepsDraftListComponent } from './task-steps-draft-list.component';

type TaskMetadataFormGroup = FormGroup<{
  title: FormControl<string>;
  category: FormControl<string>;
  description: FormControl<string>;
  educationalObjective: FormControl<string>;
  professionalNotes: FormControl<string>;
  targetLabel: FormControl<string>;
  difficultyLevel: FormControl<string>;
  environmentLabel: FormControl<string>;
  visibility: FormControl<string>;
  supportLevel: FormControl<string>;
}>;

@Component({
  selector: 'mtab-task-shell-editor-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    TaskMetadataFormComponent,
    TaskStepsDraftListComponent
  ],
  template: `
    <section class="entry" *ngIf="task() as currentTask; else loading">
      <header class="entry__hero">
        <div>
          <p class="entry__eyebrow">Editor metadata task</p>
          <h2>{{ currentTask.title || 'Nuova task analysis' }}</h2>
          <p class="entry__copy">
            Completa metadata e costruisci gli step con prompt, simboli, testo visivo e foto. Il salvataggio esplicito
            mantiene ordine, contenuto e supporti della sequenza.
          </p>
        </div>

        <div class="entry__status">
          <span class="entry__pill">{{ currentTask.status }}</span>
          <span *ngIf="savedAt() as timestamp">Ultimo salvataggio {{ timestamp | date: 'dd/MM/yyyy HH:mm' }}</span>
          <span *ngIf="!savedAt()">Aggiornata {{ currentTask.lastUpdatedAt | date: 'dd/MM/yyyy HH:mm' }}</span>
        </div>
      </header>

      <dl class="entry__facts">
        <div>
          <dt>Autore</dt>
          <dd>{{ currentTask.authorName }}</dd>
        </div>
        <div>
          <dt>Contesto libreria</dt>
          <dd>{{ currentTask.contextLabel || 'Da definire' }}</dd>
        </div>
        <div>
          <dt>Step bozza</dt>
          <dd>{{ steps().length }}</dd>
        </div>
      </dl>

      <form class="entry__layout" [formGroup]="metadataForm" (ngSubmit)="saveTask()">
        <mtab-task-metadata-form [form]="metadataForm" />

        <aside class="entry__side">
          <section class="entry__panel">
            <p class="entry__panel-label">Stato editor</p>
            <strong *ngIf="saving()">Salvataggio in corso...</strong>
            <strong *ngIf="!saving() && saveNotice()">{{ saveNotice() }}</strong>
            <p *ngIf="saveError()" class="entry__error">{{ saveError() }}</p>
            <p *ngIf="!saveError()">
              Ogni modifica agli step resta locale finche non salvi la task. Upload, simboli e testo visivo rientrano
              nello stesso salvataggio esplicito.
            </p>
            <p class="entry__hint">
              L anteprima playback apre sempre l ultima versione salvata, fuori dalla superficie di authoring.
            </p>
          </section>

          <section class="entry__panel">
            <p class="entry__panel-label">Azioni</p>
            <div class="entry__actions">
              <button type="submit" [disabled]="saving()">Salva task</button>
              <button
                type="button"
                class="entry__ghost"
                [disabled]="saving() || !canOpenPreview()"
                (click)="openPreview()"
              >
                Apri anteprima playback
              </button>
              <button type="button" class="entry__ghost" [disabled]="saving()" (click)="duplicateTask()">
                Duplica task
              </button>
              <a routerLink="/library">Torna alla libreria</a>
            </div>
            <p class="entry__panel-note" *ngIf="hasPendingDraftMedia()">
              Salva prima la task per includere nell anteprima le immagini ancora in bozza.
            </p>
          </section>

          <section class="entry__panel" *ngIf="task() as currentTask">
            <p class="entry__panel-label">Famiglia varianti</p>
            <strong>{{ familyRoleLabel(currentTask) }}</strong>
            <p>{{ familyContextCopy(currentTask) }}</p>

            <dl class="entry__family-facts">
              <div>
                <dt>Base</dt>
                <dd>{{ familyRootTitle(currentTask) }}</dd>
              </div>
              <div>
                <dt>Supporto</dt>
                <dd>{{ currentTask.supportLevel || 'Da definire' }}</dd>
              </div>
              <div>
                <dt>Task collegate</dt>
                <dd>{{ familyCountLabel(currentTask) }}</dd>
              </div>
            </dl>

            <div class="entry__family-links" *ngIf="currentTask.relatedVariants?.length; else noRelatedVariants">
              <button
                *ngFor="let related of currentTask.relatedVariants"
                type="button"
                class="entry__family-link"
                [disabled]="saving()"
                (click)="openFamilyTask(related.id)"
              >
                <span>{{ related.title }}</span>
                <small>{{ relatedVariantLabel(related) }}</small>
              </button>
            </div>

            <ng-template #noRelatedVariants>
              <p class="entry__hint">
                Nessun altra task collegata per ora. La famiglia resta una copia esplicita, senza confronti o storico.
              </p>
            </ng-template>

            <button type="button" class="entry__ghost" [disabled]="saving()" (click)="createVariantFromCurrent()">
              Crea variante da questa task
            </button>
            <p class="entry__panel-note">
              Le varianti riusano lo stesso contenuto salvato, compresi simboli e immagini. Present mode guidato e
              condivisione restano fasi successive.
            </p>
          </section>
        </aside>

        <mtab-task-steps-draft-list
          class="entry__steps"
          [steps]="steps()"
          [disabled]="saving()"
          (stepsChange)="updateSteps($event)"
        />
      </form>
    </section>

    <ng-template #loading>
      <article class="entry entry--loading">Caricamento task in corso.</article>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .entry {
        display: grid;
        gap: 1rem;
      }

      .entry__hero,
      .entry__facts,
      .entry__panel {
        padding: 1.2rem;
        border-radius: 1.6rem;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(17, 65, 91, 0.12);
        box-shadow: 0 16px 30px rgba(17, 65, 91, 0.08);
      }

      .entry__hero {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
      }

      .entry__eyebrow,
      .entry__panel-label {
        margin: 0 0 0.35rem;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #7c5f3b;
      }

      h2,
      p,
      dl,
      dt,
      dd {
        margin: 0;
      }

      .entry__copy {
        margin-top: 0.65rem;
        max-width: 44rem;
        line-height: 1.55;
        color: #4b5563;
      }

      .entry__status {
        display: grid;
        gap: 0.55rem;
        justify-items: end;
        color: #4b5563;
      }

      .entry__pill {
        display: inline-flex;
        padding: 0.45rem 0.8rem;
        border-radius: 999px;
        background: rgba(17, 65, 91, 0.08);
        color: #11415b;
        text-transform: capitalize;
      }

      .entry__facts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
        gap: 0.8rem;
      }

      .entry__facts div {
        padding: 0.9rem;
        border-radius: 1.1rem;
        background: rgba(247, 250, 252, 0.96);
      }

      dt {
        color: #6b7280;
        font-size: 0.82rem;
      }

      dd {
        margin-top: 0.2rem;
      }

      .entry__layout {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(16rem, 1fr);
        gap: 1rem;
        align-items: start;
      }

      .entry__side {
        display: grid;
        gap: 1rem;
      }

      .entry__actions {
        display: grid;
        gap: 0.7rem;
      }

      .entry__actions button,
      .entry__actions a {
        min-height: 2.75rem;
        border-radius: 999px;
        padding: 0 1rem;
        font: inherit;
        text-decoration: none;
      }

      .entry__actions button {
        border: 0;
        background: #11415b;
        color: #ffffff;
        cursor: pointer;
      }

      .entry__actions .entry__ghost {
        border: 1px solid rgba(17, 65, 91, 0.16);
        background: rgba(255, 255, 255, 0.94);
        color: #31566b;
      }

      .entry__actions a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #31566b;
        background: rgba(247, 250, 252, 0.96);
      }

      .entry__panel {
        display: grid;
        gap: 0.55rem;
      }

      .entry__family-facts {
        display: grid;
        gap: 0.65rem;
      }

      .entry__family-facts div {
        padding: 0.75rem 0.9rem;
        border-radius: 1rem;
        background: rgba(247, 250, 252, 0.96);
      }

      .entry__family-links {
        display: grid;
        gap: 0.6rem;
      }

      .entry__family-link {
        display: grid;
        gap: 0.18rem;
        justify-items: start;
        text-align: left;
        min-height: 3rem;
        border-radius: 1rem;
        border: 1px solid rgba(17, 65, 91, 0.12);
        background: rgba(247, 250, 252, 0.96);
        color: #11415b;
      }

      .entry__family-link small {
        color: #6b7280;
      }

      .entry__panel p {
        color: #4b5563;
        line-height: 1.5;
      }

      .entry__hint,
      .entry__panel-note {
        font-size: 0.92rem;
      }

      .entry__error {
        color: #b42318;
      }

      .entry__panel-note {
        color: #7c5f3b;
      }

      .entry__steps {
        grid-column: 1 / -1;
      }

      .entry--loading {
        padding: 1.2rem;
        border-radius: 1.6rem;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(17, 65, 91, 0.12);
        color: #4b5563;
      }

      @media (max-width: 860px) {
        .entry__hero,
        .entry__layout {
          grid-template-columns: 1fr;
        }

        .entry__hero {
          flex-direction: column;
        }

        .entry__status {
          justify-items: start;
        }
      }
    `
  ],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskShellEditorEntryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskLibrary = inject(TaskLibraryService);

  protected readonly task = signal<TaskDetailRecord | null>(null);
  protected readonly steps = signal<TaskStepDraftRecord[]>([]);
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');
  protected readonly saveNotice = signal('');
  protected readonly savedAt = signal<string | null>(null);

  protected readonly metadataForm: TaskMetadataFormGroup = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    category: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    educationalObjective: new FormControl('', { nonNullable: true }),
    professionalNotes: new FormControl('', { nonNullable: true }),
    targetLabel: new FormControl('', { nonNullable: true }),
    difficultyLevel: new FormControl('', { nonNullable: true }),
    environmentLabel: new FormControl('', { nonNullable: true }),
    visibility: new FormControl('', { nonNullable: true }),
    supportLevel: new FormControl('', { nonNullable: true })
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      void this.loadTask(params.get('taskId'));
    });
  }

  protected updateSteps(steps: TaskStepDraftRecord[]): void {
    this.steps.set(steps);
    const pendingUploads = steps.filter((step) => step.uploadState?.pendingPersistence).length;
    this.saveNotice.set(
      pendingUploads > 0
        ? `${pendingUploads} immagine/i caricate in bozza. Salva la task per confermare testo, simboli e foto.`
        : 'Step aggiornati. Salva per rendere persistenti le modifiche.'
    );
  }

  protected async saveTask(): Promise<void> {
    const currentTask = this.task();
    if (!currentTask || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.saveError.set('');
    this.saveNotice.set('');

    try {
      const saved = await firstValueFrom(this.taskLibrary.updateTask(currentTask.id, this.buildRequest()));
      this.patchEditor(saved);
      this.savedAt.set(saved.lastUpdatedAt);
      this.saveNotice.set('Task salvata con i supporti visivi correnti.');
    } catch {
      this.saveError.set('Salvataggio non riuscito. Riprova tra poco.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async duplicateTask(): Promise<void> {
    const currentTask = this.task();
    if (!currentTask || this.saving()) {
      return;
    }

    const duplicated = await firstValueFrom(this.taskLibrary.duplicateTask(currentTask.id));
    this.saveNotice.set('Copia creata. Apertura della nuova task in corso.');
    await this.router.navigate(['/tasks', duplicated.id]);
  }

  protected async createVariantFromCurrent(): Promise<void> {
    const currentTask = this.task();
    if (!currentTask || this.saving()) {
      return;
    }

    const requestedSupportLevel = window.prompt(
      `Livello di supporto per la variante di "${currentTask.title}"`,
      currentTask.supportLevel || ''
    );
    const supportLevel = requestedSupportLevel?.trim();

    if (!supportLevel) {
      return;
    }

    const created = await firstValueFrom(
      this.taskLibrary.createVariant(currentTask.id, {
        supportLevel
      })
    );
    this.saveNotice.set('Variante creata. Apertura della nuova task in corso.');
    await this.router.navigate(['/tasks', created.id]);
  }

  protected async openPreview(): Promise<void> {
    const currentTask = this.task();
    if (!currentTask || this.saving() || !this.canOpenPreview()) {
      return;
    }

    this.saveNotice.set('Anteprima aperta sulla versione salvata della task.');
    await this.router.navigate(['/tasks', currentTask.id, 'preview']);
  }

  private async loadTask(taskId: string | null): Promise<void> {
    this.saveError.set('');
    this.saveNotice.set('');

    if (!taskId) {
      const created = await firstValueFrom(this.taskLibrary.createDraft());
      await this.router.navigate(['/tasks', created.id], { replaceUrl: true });
      return;
    }

    const detail = await firstValueFrom(this.taskLibrary.getTaskDetail(taskId));
    this.patchEditor(detail);
    this.savedAt.set(detail.lastUpdatedAt);
  }

  private patchEditor(detail: TaskDetailRecord): void {
    this.task.set(detail);
    this.steps.set(this.normalizeSteps(detail.steps));
    this.metadataForm.setValue({
      title: detail.title ?? '',
      category: detail.category ?? '',
      description: detail.description ?? '',
      educationalObjective: detail.educationalObjective ?? '',
      professionalNotes: detail.professionalNotes ?? '',
      targetLabel: detail.targetLabel ?? '',
      difficultyLevel: detail.difficultyLevel ?? '',
      environmentLabel: detail.environmentLabel ?? '',
      visibility: detail.visibility ?? '',
      supportLevel: detail.supportLevel ?? ''
    });
  }

  private buildRequest(): UpdateTaskDetailRequest {
    const formValue = this.metadataForm.getRawValue();
    return {
      title: formValue.title,
      category: formValue.category,
      description: formValue.description,
      educationalObjective: formValue.educationalObjective,
      professionalNotes: formValue.professionalNotes,
      targetLabel: formValue.targetLabel,
      difficultyLevel: formValue.difficultyLevel,
      environmentLabel: formValue.environmentLabel,
      visibility: formValue.visibility,
      supportLevel: formValue.supportLevel,
      steps: this.steps().map((step, index) => ({
        id: step.id,
        position: index + 1,
        title: step.title,
        description: step.description,
        required: step.required,
        supportGuidance: step.supportGuidance,
        reinforcementNotes: step.reinforcementNotes,
        estimatedMinutes: step.estimatedMinutes,
        visualSupport: {
          text: step.visualSupport.text,
          symbol: step.visualSupport.symbol ? { ...step.visualSupport.symbol } : null,
          image: step.visualSupport.image ? { ...step.visualSupport.image } : null
        }
      }))
    };
  }

  private normalizeSteps(steps: readonly TaskStepDraftRecord[]): TaskStepDraftRecord[] {
    return [...steps]
      .sort((left, right) => left.position - right.position)
      .map((step, index) => ({
        ...step,
        position: index + 1,
        required: step.required ?? true,
        supportGuidance: step.supportGuidance ?? '',
        reinforcementNotes: step.reinforcementNotes ?? '',
        estimatedMinutes: step.estimatedMinutes ?? null,
        visualSupport: {
          ...createEmptyVisualSupport(),
          ...(step.visualSupport ?? {}),
          symbol: step.visualSupport?.symbol ? { ...step.visualSupport.symbol } : null,
          image: step.visualSupport?.image ? { ...step.visualSupport.image } : null
        },
        uploadState: step.uploadState
          ? {
              ...createIdleUploadState(),
              ...step.uploadState
            }
          : {
              ...createIdleUploadState(),
              localPreviewUrl: step.visualSupport?.image?.url ?? null
          }
      }));
  }

  protected canOpenPreview(): boolean {
    return Boolean(this.task()?.id) && !this.hasPendingDraftMedia();
  }

  protected hasPendingDraftMedia(): boolean {
    return this.steps().some((step) => step.uploadState?.pendingPersistence);
  }

  protected familyRoleLabel(task: TaskDetailRecord): string {
    switch (task.variantRole ?? 'standalone') {
      case 'root':
        return 'Task base';
      case 'variant':
        return 'Variante';
      default:
        return 'Task singola';
    }
  }

  protected familyContextCopy(task: TaskDetailRecord): string {
    switch (task.variantRole ?? 'standalone') {
      case 'root':
        return 'Questa task e la base della famiglia. Le altre varianti restano copie esplicite con supporti diversi.';
      case 'variant':
        return `Questa task appartiene alla famiglia "${this.familyRootTitle(task)}" e resta navigabile senza modalita di confronto.`;
      default:
        return 'La task non appartiene ancora a una famiglia variante. Puoi creare una copia dedicata quando serve.';
    }
  }

  protected familyRootTitle(task: TaskDetailRecord): string {
    return task.variantRootTitle || task.title || 'Task corrente';
  }

  protected familyCountLabel(task: TaskDetailRecord): string {
    const count = task.variantCount && task.variantCount > 0 ? task.variantCount : 1;
    return count === 1 ? 'Task singola' : `${count} task nella famiglia`;
  }

  protected relatedVariantLabel(related: RelatedVariantRecord): string {
    const roleLabel = related.variantRole === 'root' ? 'Task base' : 'Variante';
    return `${roleLabel} · ${related.supportLevel || 'Supporto da definire'}`;
  }

  protected async openFamilyTask(taskId: string): Promise<void> {
    if (this.saving()) {
      return;
    }

    await this.router.navigate(['/tasks', taskId]);
  }
}
