import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
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
          <h3>Costruisci la sequenza operativa step per step.</h3>
          <p class="panel__copy">
            Ogni step puo includere testo visivo, un simbolo e una foto di supporto senza uscire dal flusso di authoring.
          </p>
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
              <button type="button" [disabled]="isStepBusy(step) || disabled || index === 0" (click)="moveStep(index, -1)">
                Su
              </button>
              <button
                type="button"
                [disabled]="isStepBusy(step) || disabled || index === steps.length - 1"
                (click)="moveStep(index, 1)"
              >
                Giu
              </button>
              <button type="button" [disabled]="isStepBusy(step) || disabled" (click)="duplicateStep(index)">Duplica</button>
              <button type="button" class="step__danger" [disabled]="isStepBusy(step) || disabled" (click)="removeStep(index)">
                Elimina
              </button>
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

          <section class="visual-support">
            <header class="visual-support__header">
              <div>
                <p class="visual-support__eyebrow">Visual support</p>
                <h4>Supporto bambino</h4>
                <p class="visual-support__copy">Combina testo, simbolo e foto senza cambiare schermata.</p>
              </div>
              <span class="visual-support__summary">{{ summarizeVisualSupport(step) }}</span>
            </header>

            <div class="visual-support__grid">
              <label class="field field--wide">
                <span>Testo visivo</span>
                <textarea
                  rows="2"
                  [value]="step.visualSupport.text"
                  [disabled]="disabled"
                  (input)="updateVisualSupportText(index, readValue($event))"
                ></textarea>
              </label>

              <div class="visual-support__section field field--wide">
                <span>Simbolo</span>
                <div class="symbol-grid">
                  <button
                    *ngFor="let symbol of symbolCatalog"
                    type="button"
                    class="symbol-chip"
                    [class.symbol-chip--selected]="isSymbolSelected(step, symbol)"
                    [disabled]="disabled"
                    (click)="selectSymbol(index, symbol)"
                  >
                    <span class="symbol-chip__glyph" aria-hidden="true">{{ symbol.glyph }}</span>
                    <span>{{ symbol.label }}</span>
                  </button>
                </div>
                <div class="visual-support__selection" *ngIf="step.visualSupport.symbol as symbol">
                  <span>Selezionato: {{ symbol.label }}</span>
                  <button type="button" [disabled]="disabled" (click)="clearSymbol(index)">Rimuovi simbolo</button>
                </div>
              </div>

              <div class="visual-support__section field field--wide">
                <span>Foto o immagine</span>
                <div class="media-actions">
                  <label class="media-actions__upload" [class.media-actions__upload--disabled]="disabled || isStepBusy(step)">
                    <input
                      type="file"
                      accept="image/*"
                      [disabled]="disabled || isStepBusy(step)"
                      (change)="uploadImage(step.id, $event)"
                    />
                    <span>{{ isStepBusy(step) ? 'Caricamento...' : 'Carica immagine' }}</span>
                  </label>
                  <button
                    type="button"
                    class="entry__ghost"
                    *ngIf="step.visualSupport.image"
                    [disabled]="disabled || isStepBusy(step)"
                    (click)="removeImage(index)"
                  >
                    Rimuovi immagine
                  </button>
                </div>

                <p class="visual-support__status" *ngIf="step.uploadState?.status === 'uploading'">
                  Upload in corso solo per questo step.
                </p>
                <p class="visual-support__status visual-support__status--success" *ngIf="step.uploadState?.pendingPersistence">
                  Immagine caricata in bozza. Salva la task per renderla persistente.
                </p>
                <p class="visual-support__status visual-support__status--error" *ngIf="step.uploadState?.errorMessage">
                  {{ step.uploadState?.errorMessage }}
                </p>

                <article class="media-preview" *ngIf="step.visualSupport.image as image">
                  <img [src]="previewUrl(step)" [alt]="image.altText || image.fileName" />
                  <div class="media-preview__body">
                    <strong>{{ image.fileName }}</strong>
                    <span>{{ image.mimeType }} · {{ formatFileSize(image.fileSizeBytes) }}</span>
                    <span *ngIf="image.width && image.height">{{ image.width }} x {{ image.height }} px</span>
                  </div>

                  <label class="field field--wide">
                    <span>Alt text</span>
                    <input
                      type="text"
                      [value]="image.altText ?? ''"
                      [disabled]="disabled || isStepBusy(step)"
                      (input)="updateImageAltText(index, readValue($event))"
                    />
                  </label>
                </article>
              </div>
            </div>
          </section>
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
      .step__header,
      .visual-support__header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
      }

      .panel__eyebrow,
      .step__badge,
      .visual-support__eyebrow {
        margin: 0 0 0.35rem;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #7c5f3b;
      }

      .panel__copy,
      .panel__empty,
      .field span,
      .visual-support__copy,
      .visual-support__status {
        color: #4b5563;
      }

      h3,
      h4,
      p {
        margin: 0;
      }

      .panel__primary,
      .step__actions button,
      .symbol-chip,
      .visual-support__selection button,
      .entry__ghost {
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

      .step__grid,
      .visual-support__grid {
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

      .visual-support {
        display: grid;
        gap: 0.85rem;
        padding: 1rem;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(17, 65, 91, 0.08);
      }

      .visual-support__summary {
        padding: 0.45rem 0.8rem;
        border-radius: 999px;
        background: rgba(17, 65, 91, 0.08);
        color: #11415b;
        align-self: start;
      }

      .visual-support__section {
        padding: 0.85rem;
        border-radius: 1rem;
        background: rgba(247, 250, 252, 0.92);
      }

      .symbol-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
        gap: 0.55rem;
      }

      .symbol-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.45rem;
        min-height: 3rem;
      }

      .symbol-chip--selected {
        border-color: rgba(17, 65, 91, 0.4);
        background: rgba(17, 65, 91, 0.12);
        color: #11415b;
      }

      .symbol-chip__glyph {
        font-size: 1.1rem;
      }

      .visual-support__selection {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-top: 0.75rem;
      }

      .media-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        align-items: center;
      }

      .media-actions__upload {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.4rem;
        padding: 0 1rem;
        border-radius: 999px;
        background: #11415b;
        color: #ffffff;
        cursor: pointer;
      }

      .media-actions__upload input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
      }

      .media-actions__upload--disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .visual-support__status--success {
        color: #0b6b4b;
      }

      .visual-support__status--error {
        color: #b42318;
      }

      .media-preview {
        display: grid;
        gap: 0.85rem;
        margin-top: 0.85rem;
        padding: 0.85rem;
        border-radius: 1rem;
        border: 1px solid rgba(17, 65, 91, 0.12);
        background: rgba(255, 255, 255, 0.96);
      }

      .media-preview img {
        width: min(100%, 18rem);
        border-radius: 0.9rem;
        object-fit: cover;
        border: 1px solid rgba(17, 65, 91, 0.12);
      }

      .media-preview__body {
        display: grid;
        gap: 0.25rem;
        color: #4b5563;
      }

      @media (max-width: 720px) {
        .panel__header,
        .step__header,
        .visual-support__header,
        .visual-support__selection {
          flex-direction: column;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskStepAuthoringEditorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly taskLibrary = inject(TaskLibraryService);

  @Input({ required: true }) steps: readonly TaskStepDraftRecord[] = [];
  @Input() disabled = false;

  @Output() stepsChange = new EventEmitter<TaskStepDraftRecord[]>();

  protected readonly symbolCatalog = TASK_SYMBOL_CATALOG;

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
        estimatedMinutes: null,
        visualSupport: createEmptyVisualSupport(),
        uploadState: createIdleUploadState()
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

  protected updateVisualSupportText(index: number, value: string): void {
    this.updateStep(index, (step) => ({
      ...step,
      visualSupport: {
        ...this.normalizeVisualSupport(step),
        text: value
      }
    }));
  }

  protected selectSymbol(index: number, symbol: TaskSymbolCatalogEntry): void {
    this.updateStep(index, (step) => ({
      ...step,
      visualSupport: {
        ...this.normalizeVisualSupport(step),
        symbol: {
          library: symbol.library,
          key: symbol.key,
          label: symbol.label
        }
      }
    }));
  }

  protected clearSymbol(index: number): void {
    this.updateStep(index, (step) => ({
      ...step,
      visualSupport: {
        ...this.normalizeVisualSupport(step),
        symbol: null
      }
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
        visualSupport: {
          ...this.normalizeVisualSupport(step),
          image: this.mapImage(uploaded)
        },
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

  protected removeImage(index: number): void {
    this.updateStep(index, (step) => ({
      ...step,
      visualSupport: {
        ...this.normalizeVisualSupport(step),
        image: null
      },
      uploadState: {
        status: 'idle',
        errorMessage: '',
        localPreviewUrl: null,
        pendingPersistence: false
      }
    }));
  }

  protected updateImageAltText(index: number, value: string): void {
    this.updateStep(index, (step) => ({
      ...step,
      visualSupport: {
        ...this.normalizeVisualSupport(step),
        image: step.visualSupport.image
          ? {
              ...step.visualSupport.image,
              altText: value.trim() === '' ? null : value
            }
          : null
      }
    }));
  }

  protected previewUrl(step: TaskStepDraftRecord): string {
    return step.uploadState?.localPreviewUrl ?? step.visualSupport.image?.url ?? '';
  }

  protected summarizeVisualSupport(step: TaskStepDraftRecord): string {
    const parts = [
      step.visualSupport.text.trim() ? 'testo' : null,
      step.visualSupport.symbol ? 'simbolo' : null,
      step.visualSupport.image ? 'foto' : null
    ].filter((value): value is string => value !== null);

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

  private updateStep(index: number, updater: (step: TaskStepDraftRecord) => TaskStepDraftRecord): void {
    this.emit(this.steps.map((step, currentIndex) => (currentIndex === index ? updater(step) : step)));
  }

  private updateStepById(stepId: string, updater: (step: TaskStepDraftRecord) => TaskStepDraftRecord): void {
    this.emit(this.steps.map((step) => (step.id === stepId ? updater(step) : step)));
  }

  private emit(steps: readonly TaskStepDraftRecord[]): void {
    this.stepsChange.emit(
      steps.map((step, index) => ({
        ...step,
        position: index + 1,
        visualSupport: this.normalizeVisualSupport(step),
        uploadState: this.normalizeUploadState(step.uploadState)
      }))
    );
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
    return {
      ...createIdleUploadState(),
      ...(uploadState ?? {})
    };
  }

  private mapImage(uploaded: {
    mediaId: string;
    storageKey: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    width: number | null;
    height: number | null;
    altText: string | null;
    url: string;
  }): TaskStepImageRecord {
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
    return `step-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }
}
