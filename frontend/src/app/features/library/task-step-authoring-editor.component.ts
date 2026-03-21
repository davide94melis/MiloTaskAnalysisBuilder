import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  TaskStepDraftRecord,
  TaskStepImageRecord,
  TaskStepUploadStateRecord,
  createEmptyVisualSupport,
  createIdleUploadState
} from '../../core/tasks/task-detail.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { TASK_SYMBOL_CATALOG, TaskSymbolCatalogEntry } from './task-symbol-catalog';

@Component({
  selector: 'mtab-task-step-authoring-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="panel">
      <header class="panel__header">
        <div>
          <p class="panel__eyebrow">Step authoring</p>
          <h3>Costruisci uno step alla volta e rivedi la sequenza a destra.</h3>
          <p class="panel__copy">
            Lo spazio di sinistra resta focalizzato sullo step corrente, mentre la colonna destra mantiene l ordine della task.
          </p>
        </div>
        <button type="button" class="panel__primary" [disabled]="disabled" (click)="addStep()">Nuovo step</button>
      </header>

      <div class="workspace">
        <section class="workspace__editor">
          <header class="workspace__section-head">
            <div>
              <p class="workspace__label">Step authoring</p>
              <strong>{{ currentStep() ? currentStepTitle() : 'Seleziona o crea uno step' }}</strong>
            </div>
            <span class="workspace__badge" *ngIf="currentStep() as step">{{ summarizeVisualSupport(step) }}</span>
          </header>

          <div class="workspace__empty" *ngIf="!steps.length">
            <p>Nessuno step ancora presente.</p>
            <button type="button" class="panel__primary" [disabled]="disabled" (click)="addStep()">Crea il primo step</button>
          </div>

          <div class="step-editor" *ngIf="currentStep() as step">
            <div class="step-editor__meta">
              <span class="step-editor__position">Step {{ selectedStepIndex() + 1 }}</span>
              <div class="step-editor__actions">
                <button type="button" [disabled]="isStepBusy(step) || disabled || selectedStepIndex() === 0" (click)="moveSelectedStep(-1)">Su</button>
                <button type="button" [disabled]="isStepBusy(step) || disabled || selectedStepIndex() === steps.length - 1" (click)="moveSelectedStep(1)">Giu</button>
                <button type="button" [disabled]="isStepBusy(step) || disabled" (click)="duplicateSelectedStep()">Duplica</button>
                <button type="button" class="step-editor__danger" [disabled]="isStepBusy(step) || disabled" (click)="removeSelectedStep()">Elimina</button>
              </div>
            </div>

            <div class="step-editor__grid">
              <label class="field field--wide">
                <span>Titolo breve</span>
                <input type="text" [value]="step.title" [disabled]="disabled" (input)="updateSelectedText('title', readValue($event))" />
              </label>

              <label class="field field--wide">
                <span>Descrizione</span>
                <textarea rows="3" [value]="step.description" [disabled]="disabled" (input)="updateSelectedText('description', readValue($event))"></textarea>
              </label>
            </div>

            <details class="step-editor__details">
              <summary class="step-editor__details-summary">Dettagli educativi e operativi</summary>

              <div class="step-editor__details-body step-editor__grid">
                <label class="field field--compact">
                  <span>Obbligatorio</span>
                  <input type="checkbox" [checked]="step.required" [disabled]="disabled" (change)="updateSelectedRequired(readChecked($event))" />
                </label>

                <label class="field">
                  <span>Tempo stimato (minuti)</span>
                  <input type="number" min="0" [value]="step.estimatedMinutes ?? ''" [disabled]="disabled" (input)="updateSelectedEstimatedMinutes(readValue($event))" />
                </label>

                <label class="field field--wide">
                  <span>Prompt o supporto</span>
                  <textarea rows="2" [value]="step.supportGuidance" [disabled]="disabled" (input)="updateSelectedText('supportGuidance', readValue($event))"></textarea>
                </label>

                <label class="field field--wide">
                  <span>Rinforzo opzionale</span>
                  <textarea rows="2" [value]="step.reinforcementNotes" [disabled]="disabled" (input)="updateSelectedText('reinforcementNotes', readValue($event))"></textarea>
                </label>
              </div>
            </details>

            <section class="visual-support">
              <details class="visual-support__details" open>
                <summary class="visual-support__summary-bar">
                  <header class="visual-support__header">
                    <div>
                      <p class="visual-support__eyebrow">Visual support</p>
                      <h4>Supporto bambino</h4>
                      <p class="visual-support__copy">Combina testo, simbolo e foto senza cambiare schermata.</p>
                    </div>
                    <span class="visual-support__summary">{{ summarizeVisualSupport(step) }}</span>
                  </header>
                </summary>

                <div class="visual-support__grid">
                  <label class="field field--wide">
                    <span>Testo visivo</span>
                    <textarea rows="2" [value]="step.visualSupport.text" [disabled]="disabled" (input)="updateSelectedVisualSupportText(readValue($event))"></textarea>
                  </label>

                  <div class="visual-support__section field field--wide">
                    <span>Simbolo</span>
                    <div class="symbol-grid">
                      <button *ngFor="let symbol of symbolCatalog" type="button" class="symbol-chip" [class.symbol-chip--selected]="isSymbolSelected(step, symbol)" [disabled]="disabled" (click)="selectSelectedSymbol(symbol)">
                        <span class="symbol-chip__glyph" aria-hidden="true">{{ symbol.glyph }}</span>
                        <span>{{ symbol.label }}</span>
                      </button>
                    </div>
                    <div class="visual-support__selection" *ngIf="step.visualSupport.symbol as symbol">
                      <span>Selezionato: {{ symbol.label }}</span>
                      <button type="button" [disabled]="disabled" (click)="clearSelectedSymbol()">Rimuovi simbolo</button>
                    </div>
                  </div>

                  <div class="visual-support__section field field--wide">
                    <span>Foto o immagine</span>
                    <div class="media-actions">
                      <label class="media-actions__upload" [class.media-actions__upload--disabled]="disabled || isStepBusy(step)">
                        <input type="file" accept="image/*" [disabled]="disabled || isStepBusy(step)" (change)="uploadImage(step.id, $event)" />
                        <span>{{ isStepBusy(step) ? 'Caricamento...' : 'Carica immagine' }}</span>
                      </label>
                      <button type="button" class="workspace__secondary" *ngIf="step.visualSupport.image" [disabled]="disabled || isStepBusy(step)" (click)="removeSelectedImage()">Rimuovi immagine</button>
                    </div>

                    <p class="visual-support__status" *ngIf="step.uploadState?.status === 'uploading'">Upload in corso solo per questo step.</p>
                    <p class="visual-support__status visual-support__status--success" *ngIf="step.uploadState?.pendingPersistence">Immagine caricata in bozza. Salva la task per renderla persistente.</p>
                    <p class="visual-support__status visual-support__status--error" *ngIf="step.uploadState?.errorMessage">{{ step.uploadState?.errorMessage }}</p>

                    <article class="media-preview" *ngIf="step.visualSupport.image as image">
                      <img [src]="previewUrl(step)" [alt]="image.altText || image.fileName" />
                      <div class="media-preview__body">
                        <strong>{{ image.fileName }}</strong>
                        <span>{{ image.mimeType }} · {{ formatFileSize(image.fileSizeBytes) }}</span>
                        <span *ngIf="image.width && image.height">{{ image.width }} x {{ image.height }} px</span>
                      </div>

                      <label class="field field--wide">
                        <span>Alt text</span>
                        <input type="text" [value]="image.altText ?? ''" [disabled]="disabled || isStepBusy(step)" (input)="updateSelectedImageAltText(readValue($event))" />
                      </label>
                    </article>
                  </div>
                </div>
              </details>
            </section>
          </div>
        </section>

        <aside class="workspace__board">
          <header class="workspace__section-head">
            <div>
              <p class="workspace__label">Step board</p>
              <strong>{{ steps.length ? steps.length + ' step nella sequenza' : 'Sequenza vuota' }}</strong>
            </div>
            <span class="workspace__hint">Ordine operativo</span>
          </header>

          <div class="workspace__empty workspace__empty--board" *ngIf="!steps.length">
            <p>Gli step creati appariranno qui come card ordinate.</p>
          </div>

          <ol class="step-board" *ngIf="steps.length">
            <li class="step-card" [class.step-card--selected]="step.id === selectedStepId" *ngFor="let step of steps; let index = index; trackBy: trackByStepId">
              <button type="button" class="step-card__surface" [class.step-card__surface--selected]="step.id === selectedStepId" [disabled]="disabled" (click)="selectStep(step.id)">
                <div class="step-card__meta">
                  <span class="step-card__badge">Step {{ index + 1 }}</span>
                  <span class="step-card__state" *ngIf="step.id === selectedStepId">In modifica</span>
                </div>
                <strong>{{ step.title || 'Nuovo step' }}</strong>
                <p>{{ step.description || 'Aggiungi una descrizione breve per chiarire l azione.' }}</p>
                <div class="step-card__summary">
                  <span>{{ summarizeVisualSupport(step) }}</span>
                  <span *ngIf="step.estimatedMinutes">~{{ step.estimatedMinutes }} min</span>
                  <span *ngIf="step.required; else optionalStep">Obbligatorio</span>
                  <ng-template #optionalStep><span>Opzionale</span></ng-template>
                </div>
              </button>

              <div class="step-card__actions">
                <button type="button" [disabled]="isStepBusy(step) || disabled || index === 0" (click)="moveStep(index, -1)">Su</button>
                <button type="button" [disabled]="isStepBusy(step) || disabled || index === steps.length - 1" (click)="moveStep(index, 1)">Giu</button>
                <button type="button" [disabled]="isStepBusy(step) || disabled" (click)="duplicateStep(index)">Duplica</button>
                <button type="button" class="step-card__danger" [disabled]="isStepBusy(step) || disabled" (click)="removeStep(index)">Elimina</button>
              </div>
            </li>
          </ol>
        </aside>
      </div>
    </section>
  `,
  styles: [
    `
      .panel { display:grid; gap:1rem; padding:1.2rem; border-radius:1rem; background:rgba(var(--pitwriter-bg-surface-rgb),.9); border:1px solid var(--pitwriter-border-subtle); box-shadow:0 10px 24px var(--pitwriter-shadow-subtle); }
      .panel__header, .workspace__section-head, .visual-support__header, .step-editor__meta { display:flex; justify-content:space-between; gap:1rem; align-items:start; }
      .panel__eyebrow, .visual-support__eyebrow, .workspace__label, .step-editor__position, .step-card__badge { margin:0 0 .35rem; font-size:.8rem; letter-spacing:.08em; text-transform:uppercase; color:var(--pitwriter-text-muted-2); }
      h3, h4, p, strong { margin:0; }
      .panel__copy, .workspace__hint, .workspace__empty, .field span, .visual-support__copy, .visual-support__status, .step-card p { color:var(--pitwriter-text-muted); }
      .panel__primary, .workspace__secondary, .step-editor__actions button, .step-card__actions button, .symbol-chip, .visual-support__selection button { min-height:2.4rem; border-radius:.75rem; border:1px solid var(--pitwriter-border); padding:0 .95rem; font:inherit; cursor:pointer; background:var(--pitwriter-bg-surface-elevated); color:var(--pitwriter-text); }
      .panel__primary { background:linear-gradient(135deg, var(--pitwriter-primary-from), var(--pitwriter-primary-to)); color:#fff; border:0; }
      .workspace { display:grid; grid-template-columns:minmax(0,1.35fr) minmax(18rem,.95fr); gap:1rem; align-items:start; }
      .workspace__editor, .workspace__board, .step-editor, .step-editor__details, .visual-support__details { display:grid; gap:.9rem; }
      .workspace__editor, .workspace__board { padding:1rem; border-radius:1rem; background:var(--pitwriter-bg-surface); border:1px solid var(--pitwriter-border-subtle); }
      .workspace__badge, .step-card__state, .visual-support__summary { padding:.42rem .78rem; border-radius:999px; background:rgba(79,70,229,.08); color:var(--pitwriter-primary-from); font-size:.88rem; }
      .workspace__empty { display:grid; gap:.85rem; padding:1rem; border-radius:.9rem; background:var(--pitwriter-bg-surface-elevated); border:1px solid var(--pitwriter-border-subtle); }
      .workspace__empty--board { min-height:9rem; align-content:start; }
      .step-editor__actions, .step-card__actions, .step-card__summary, .media-actions { display:flex; gap:.55rem; flex-wrap:wrap; align-items:center; }
      .step-editor__danger, .step-card__danger { color:var(--pitwriter-danger-text); }
      .step-editor__grid, .visual-support__grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(14rem,1fr)); gap:.85rem; }
      .step-editor__details, .visual-support__details { padding:1rem; border-radius:.9rem; background:var(--pitwriter-bg-surface-elevated); border:1px solid var(--pitwriter-border-subtle); }
      .step-editor__details-summary, .visual-support__summary-bar { cursor:pointer; list-style:none; }
      .step-editor__details-summary::-webkit-details-marker, .visual-support__summary-bar::-webkit-details-marker { display:none; }
      .step-editor__details-summary { color:var(--pitwriter-text); font-weight:600; }
      .field { display:grid; gap:.45rem; }
      .field--wide { grid-column:1 / -1; }
      .field--compact { align-content:start; }
      .field input, .field textarea { width:100%; border-radius:.75rem; border:1px solid var(--pitwriter-border); background:var(--pitwriter-input-bg); padding:.82rem .95rem; font:inherit; color:var(--pitwriter-text); }
      .field input[type='checkbox'] { width:auto; min-height:1rem; padding:0; }
      .field textarea { resize:vertical; }
      .visual-support__section { padding:.85rem; border-radius:.9rem; background:var(--pitwriter-bg-surface); border:1px solid var(--pitwriter-border-subtle); }
      .symbol-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr)); gap:.55rem; }
      .symbol-chip { display:inline-flex; align-items:center; justify-content:center; gap:.45rem; min-height:3rem; }
      .symbol-chip--selected { border-color:rgba(79,70,229,.35); background:rgba(79,70,229,.08); color:var(--pitwriter-primary-from); }
      .symbol-chip__glyph { font-size:1.1rem; }
      .visual-support__selection { display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-top:.75rem; }
      .media-actions__upload { position:relative; display:inline-flex; align-items:center; justify-content:center; min-height:2.4rem; padding:0 1rem; border-radius:.75rem; background:linear-gradient(135deg, var(--pitwriter-primary-from), var(--pitwriter-primary-to)); color:#fff; cursor:pointer; }
      .media-actions__upload input { position:absolute; inset:0; opacity:0; cursor:pointer; }
      .media-actions__upload--disabled { opacity:.55; cursor:not-allowed; }
      .visual-support__status--success { color:var(--pitwriter-success-text); }
      .visual-support__status--error { color:var(--pitwriter-danger-text); }
      .media-preview { display:grid; gap:.85rem; margin-top:.85rem; padding:.85rem; border-radius:.9rem; border:1px solid var(--pitwriter-border-subtle); background:var(--pitwriter-bg-surface-elevated); }
      .media-preview img { width:min(100%,18rem); border-radius:.9rem; object-fit:cover; border:1px solid var(--pitwriter-border-subtle); background:linear-gradient(180deg, rgba(99,102,241,.06), rgba(236,72,153,.08)); }
      .media-preview__body { display:grid; gap:.25rem; color:var(--pitwriter-text-muted); }
      .step-board { display:grid; gap:.85rem; list-style:none; margin:0; padding:0; }
      .step-card { display:grid; gap:.55rem; }
      .step-card__surface { display:grid; gap:.55rem; width:100%; text-align:left; padding:.95rem; border-radius:.9rem; border:1px solid var(--pitwriter-border-subtle); background:var(--pitwriter-bg-surface-elevated); cursor:pointer; }
      .step-card__surface--selected { border-color:rgba(79,70,229,.3); box-shadow:0 8px 18px var(--pitwriter-shadow-subtle); }
      .step-card__meta { display:flex; justify-content:space-between; gap:.6rem; align-items:center; }
      .step-card__summary { color:var(--pitwriter-text-muted-2); font-size:.88rem; }
      .step-card__actions { opacity:0; pointer-events:none; transition:opacity 140ms ease; }
      .step-card:hover .step-card__actions, .step-card:focus-within .step-card__actions, .step-card--selected .step-card__actions { opacity:1; pointer-events:auto; }
      @media (hover:none) { .step-card__actions { opacity:1; pointer-events:auto; } }
      @media (max-width:960px) { .workspace { grid-template-columns:1fr; } }
      @media (max-width:720px) { .panel__header, .workspace__section-head, .visual-support__header, .step-editor__meta, .visual-support__selection { flex-direction:column; } }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskStepAuthoringEditorComponent implements OnChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly taskLibrary = inject(TaskLibraryService);

  @Input({ required: true }) steps: readonly TaskStepDraftRecord[] = [];
  @Input() disabled = false;

  @Output() stepsChange = new EventEmitter<TaskStepDraftRecord[]>();

  protected readonly symbolCatalog = TASK_SYMBOL_CATALOG;
  protected selectedStepId: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['steps']) {
      return;
    }
    if (!this.steps.length) {
      this.selectedStepId = null;
      return;
    }
    if (!this.selectedStepId || !this.steps.some((step) => step.id === this.selectedStepId)) {
      this.selectedStepId = this.steps[0]?.id ?? null;
    }
  }

  protected currentStep(): TaskStepDraftRecord | null {
    this.ensureSelectedStep();
    return this.steps.find((step) => step.id === this.selectedStepId) ?? null;
  }

  protected currentStepTitle(): string {
    const step = this.currentStep();
    if (!step) {
      return 'Seleziona o crea uno step';
    }
    return step.title?.trim() ? step.title : 'Nuovo step';
  }

  protected selectedStepIndex(): number {
    this.ensureSelectedStep();
    return this.steps.findIndex((step) => step.id === this.selectedStepId);
  }

  protected selectStep(stepId: string): void {
    this.selectedStepId = stepId;
  }

  protected addStep(): void {
    const newStep: TaskStepDraftRecord = {
      id: this.createStepId(),
      position: this.steps.length + 1,
      title: '',
      description: '',
      required: true,
      supportGuidance: '',
      reinforcementNotes: '',
      estimatedMinutes: null,
      visualSupport: createEmptyVisualSupport(),
      uploadState: createIdleUploadState()
    };
    this.selectedStepId = newStep.id;
    this.emit([...this.steps, newStep]);
  }

  protected duplicateStep(index: number): void {
    const source = this.steps[index];
    if (!source) {
      return;
    }
    const duplicated: TaskStepDraftRecord = {
      ...source,
      id: this.createStepId(),
      title: source.title ? `${source.title} copia` : '',
      visualSupport: {
        ...source.visualSupport,
        symbol: source.visualSupport.symbol ? { ...source.visualSupport.symbol } : null,
        image: source.visualSupport.image ? { ...source.visualSupport.image } : null
      },
      uploadState: this.normalizeUploadState(source.uploadState)
    };
    const next = [...this.steps];
    next.splice(index + 1, 0, duplicated);
    this.selectedStepId = duplicated.id;
    this.emit(next);
  }

  protected duplicateSelectedStep(): void {
    const index = this.selectedStepIndex();
    if (index >= 0) {
      this.duplicateStep(index);
    }
  }

  protected removeStep(index: number): void {
    const removed = this.steps[index];
    const next = this.steps.filter((_, currentIndex) => currentIndex !== index);
    if (removed?.id === this.selectedStepId) {
      this.selectedStepId = next[index]?.id ?? next[index - 1]?.id ?? next[0]?.id ?? null;
    }
    this.emit(next);
  }

  protected removeSelectedStep(): void {
    const index = this.selectedStepIndex();
    if (index >= 0) {
      this.removeStep(index);
    }
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

  protected moveSelectedStep(direction: -1 | 1): void {
    const index = this.selectedStepIndex();
    if (index >= 0) {
      this.moveStep(index, direction);
    }
  }

  protected updateSelectedText(field: 'title' | 'description' | 'supportGuidance' | 'reinforcementNotes', value: string): void {
    const stepId = this.selectedStepId;
    if (!stepId) {
      return;
    }
    this.updateStepById(stepId, (step) => ({ ...step, [field]: value }));
  }

  protected updateSelectedRequired(value: boolean): void {
    const stepId = this.selectedStepId;
    if (!stepId) {
      return;
    }
    this.updateStepById(stepId, (step) => ({ ...step, required: value }));
  }

  protected updateSelectedEstimatedMinutes(rawValue: string): void {
    const stepId = this.selectedStepId;
    if (!stepId) {
      return;
    }
    const estimatedMinutes = rawValue.trim() === '' ? null : Number(rawValue);
    this.updateStepById(stepId, (step) => ({
      ...step,
      estimatedMinutes: Number.isNaN(estimatedMinutes) ? null : estimatedMinutes
    }));
  }

  protected updateSelectedVisualSupportText(value: string): void {
    const stepId = this.selectedStepId;
    if (!stepId) {
      return;
    }
    this.updateStepById(stepId, (step) => ({
      ...step,
      visualSupport: { ...this.normalizeVisualSupport(step), text: value }
    }));
  }

  protected selectSelectedSymbol(symbol: TaskSymbolCatalogEntry): void {
    const stepId = this.selectedStepId;
    if (!stepId) {
      return;
    }
    this.updateStepById(stepId, (step) => ({
      ...step,
      visualSupport: {
        ...this.normalizeVisualSupport(step),
        symbol: { library: symbol.library, key: symbol.key, label: symbol.label }
      }
    }));
  }

  protected clearSelectedSymbol(): void {
    const stepId = this.selectedStepId;
    if (!stepId) {
      return;
    }
    this.updateStepById(stepId, (step) => ({
      ...step,
      visualSupport: { ...this.normalizeVisualSupport(step), symbol: null }
    }));
  }

  protected async uploadImage(stepId: string, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    input.value = '';
    if (!file) {
      return;
    }
    const taskId = this.route.snapshot.paramMap.get('taskId');
    if (!taskId) {
      this.updateStepById(stepId, (step) => ({
        ...step,
        uploadState: {
          status: 'error',
          errorMessage: 'Salva o ricarica la task prima di allegare un immagine.',
          localPreviewUrl: step.uploadState?.localPreviewUrl ?? null,
          pendingPersistence: false
        }
      }));
      return;
    }

    this.updateStepById(stepId, (step) => ({
      ...step,
      uploadState: {
        status: 'uploading',
        errorMessage: '',
        localPreviewUrl: step.uploadState?.localPreviewUrl ?? step.visualSupport.image?.url ?? null,
        pendingPersistence: step.uploadState?.pendingPersistence ?? false
      }
    }));

    try {
      const uploaded = await firstValueFrom(this.taskLibrary.uploadTaskMedia(taskId, file));
      this.updateStepById(stepId, (step) => ({
        ...step,
        visualSupport: { ...this.normalizeVisualSupport(step), image: this.mapImage(uploaded) },
        uploadState: {
          status: 'uploaded',
          errorMessage: '',
          localPreviewUrl: uploaded.url,
          pendingPersistence: true
        }
      }));
    } catch {
      this.updateStepById(stepId, (step) => ({
        ...step,
        uploadState: {
          status: 'error',
          errorMessage: 'Upload non riuscito. Riprova senza perdere il resto dello step.',
          localPreviewUrl: step.uploadState?.localPreviewUrl ?? step.visualSupport.image?.url ?? null,
          pendingPersistence: step.uploadState?.pendingPersistence ?? false
        }
      }));
    }
  }

  protected removeSelectedImage(): void {
    const stepId = this.selectedStepId;
    if (!stepId) {
      return;
    }
    this.updateStepById(stepId, (step) => ({
      ...step,
      visualSupport: { ...this.normalizeVisualSupport(step), image: null },
      uploadState: { status: 'idle', errorMessage: '', localPreviewUrl: null, pendingPersistence: false }
    }));
  }

  protected updateSelectedImageAltText(value: string): void {
    const stepId = this.selectedStepId;
    if (!stepId) {
      return;
    }
    this.updateStepById(stepId, (step) => ({
      ...step,
      visualSupport: {
        ...this.normalizeVisualSupport(step),
        image: step.visualSupport.image ? { ...step.visualSupport.image, altText: value.trim() === '' ? null : value } : null
      }
    }));
  }

  protected previewUrl(step: TaskStepDraftRecord): string {
    return step.uploadState?.localPreviewUrl ?? step.visualSupport.image?.url ?? '';
  }

  protected summarizeVisualSupport(step: TaskStepDraftRecord): string {
    const parts = [step.visualSupport.text.trim() ? 'testo' : null, step.visualSupport.symbol ? 'simbolo' : null, step.visualSupport.image ? 'foto' : null].filter((value): value is string => value !== null);
    return parts.length ? parts.join(' + ') : 'Nessun supporto';
  }

  protected isSymbolSelected(step: TaskStepDraftRecord, symbol: TaskSymbolCatalogEntry): boolean {
    return step.visualSupport.symbol?.key === symbol.key && step.visualSupport.symbol?.library === symbol.library;
  }

  protected isStepBusy(step: TaskStepDraftRecord): boolean {
    return step.uploadState?.status === 'uploading';
  }

  protected formatFileSize(fileSizeBytes: number): string {
    if (fileSizeBytes >= 1024 * 1024) {
      return `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (fileSizeBytes >= 1024) {
      return `${Math.round(fileSizeBytes / 1024)} KB`;
    }
    return `${fileSizeBytes} B`;
  }

  protected readValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected readChecked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  protected trackByStepId(_index: number, step: TaskStepDraftRecord): string {
    return step.id;
  }

  private updateStepById(stepId: string, updater: (step: TaskStepDraftRecord) => TaskStepDraftRecord): void {
    this.emit(this.steps.map((step) => (step.id === stepId ? updater(step) : step)));
  }

  private emit(steps: readonly TaskStepDraftRecord[]): void {
    this.stepsChange.emit(steps.map((step, index) => ({
      ...step,
      position: index + 1,
      visualSupport: this.normalizeVisualSupport(step),
      uploadState: this.normalizeUploadState(step.uploadState)
    })));
  }

  private normalizeVisualSupport(step: TaskStepDraftRecord): TaskStepDraftRecord['visualSupport'] {
    return {
      ...createEmptyVisualSupport(),
      ...step.visualSupport,
      symbol: step.visualSupport?.symbol ? { ...step.visualSupport.symbol } : null,
      image: step.visualSupport?.image ? { ...step.visualSupport.image } : null
    };
  }

  private normalizeUploadState(uploadState: TaskStepUploadStateRecord | null | undefined): TaskStepUploadStateRecord {
    return { ...createIdleUploadState(), ...(uploadState ?? {}) };
  }

  private mapImage(uploaded: { mediaId: string; storageKey: string; fileName: string; mimeType: string; fileSizeBytes: number; width: number | null; height: number | null; altText: string | null; url: string; }): TaskStepImageRecord {
    return {
      mediaId: uploaded.mediaId,
      storageKey: uploaded.storageKey,
      fileName: uploaded.fileName,
      mimeType: uploaded.mimeType,
      fileSizeBytes: uploaded.fileSizeBytes,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
      altText: uploaded.altText ?? null,
      url: uploaded.url
    };
  }

  private createStepId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const segment = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
    return `${segment()}${segment()}-${segment()}-4${segment().slice(0, 3)}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${segment().slice(0, 3)}-${segment()}${segment()}${segment()}`;
  }

  private ensureSelectedStep(): void {
    if (!this.steps.length) {
      this.selectedStepId = null;
      return;
    }
    if (!this.selectedStepId || !this.steps.some((step) => step.id === this.selectedStepId)) {
      this.selectedStepId = this.steps[0]?.id ?? null;
    }
  }
}
