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
import { TaskSessionSummaryRecord, TaskShareMode, TaskShareSummaryRecord } from '../../core/tasks/task-library.models';
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
      <form class="entry__shell" [formGroup]="metadataForm" (ngSubmit)="saveTask()">
        <header class="entry__topbar">
          <div class="entry__identity">
            <p class="entry__eyebrow">Workspace task</p>
            <h2>{{ currentTask.title || 'Nuova task analysis' }}</h2>
            <div class="entry__identity-meta">
              <span>{{ currentTask.authorName }}</span>
              <span>{{ currentTask.contextLabel || 'Contesto da definire' }}</span>
              <span>{{ steps().length }} step bozza</span>
            </div>
          </div>

          <div class="entry__topbar-actions">
            <button
              type="button"
              class="entry__rail-toggle"
              [class.entry__rail-toggle--open]="railOpen()"
              [attr.aria-expanded]="railOpen()"
              aria-label="Apri menu workspace"
              (click)="toggleRail()"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <div class="entry__status">
              <span class="entry__pill">{{ currentTask.status }}</span>
              <span class="entry__status-copy">{{ savedSurfaceStateLabel() }}</span>
              <span *ngIf="savedAt() as timestamp">Ultimo salvataggio {{ timestamp | date: 'dd/MM/yyyy HH:mm' }}</span>
              <span *ngIf="!savedAt()">Aggiornata {{ currentTask.lastUpdatedAt | date: 'dd/MM/yyyy HH:mm' }}</span>
            </div>

            <div class="entry__topbar-buttons">
              <a class="entry__nav-link" routerLink="/library">Torna alla libreria</a>
              <button type="submit" class="entry__primary" [disabled]="saving()">Salva task</button>
            </div>
          </div>
        </header>

        <div class="entry__workspace" [class.entry__workspace--rail-open]="railOpen()">
          <aside class="entry__rail" [class.entry__rail--open]="railOpen()" [attr.data-state]="railOpen() ? 'open' : 'closed'" aria-label="Action rail">
            <button type="button" class="entry__rail-button" [disabled]="saving()" (click)="openSupportOverlay('saved')" aria-label="Apri azioni task salvata" title="Azioni task salvata">
              <span aria-hidden="true">S</span>
            </button>
            <button type="button" class="entry__rail-button" [disabled]="saving()" (click)="openSupportOverlay('share')" aria-label="Apri condivisione pubblica" title="Condivisione pubblica">
              <span aria-hidden="true">L</span>
            </button>
            <button type="button" class="entry__rail-button" [disabled]="saving()" (click)="openSupportOverlay('family')" aria-label="Apri famiglia varianti" title="Famiglia varianti">
              <span aria-hidden="true">V</span>
            </button>
            <button type="button" class="entry__rail-button" [disabled]="saving()" (click)="openSupportOverlay('history')" aria-label="Apri storico sessioni" title="Storico sessioni">
              <span aria-hidden="true">H</span>
            </button>
            <button type="button" class="entry__rail-button entry__rail-button--muted" (click)="openSupportOverlay('editor')" aria-label="Apri supporto editor" title="Supporto editor">
              <span aria-hidden="true">?</span>
            </button>
          </aside>

          <div class="entry__canvas">
            <section class="entry__notice" *ngIf="saveNotice() || saveError() || hasPendingDraftMedia()">
              <p class="entry__notice-copy" *ngIf="!saveError() && saveNotice()">{{ saveNotice() }}</p>
              <p class="entry__notice-copy entry__notice-copy--error" *ngIf="saveError()">{{ saveError() }}</p>
              <p class="entry__notice-copy" *ngIf="!saveError() && !saveNotice() && hasPendingDraftMedia()">
                Salva prima la task per includere in anteprima, modalita guidata, export PDF e link pubblici le immagini ancora in bozza.
              </p>
            </section>

            <mtab-task-metadata-form [form]="metadataForm" />

            <section class="entry__workspace-panel">
              <header class="entry__workspace-head">
                <div>
                  <p class="entry__panel-label">Step workspace</p>
                  <h3>Authoring e revisione restano al centro della pagina.</h3>
                </div>
                <p class="entry__hint">
                  Azioni secondarie, link, varianti e storico si aprono dal rail laterale invece di restare fissi nel canvas.
                </p>
              </header>

              <mtab-task-steps-draft-list
                class="entry__steps"
                [steps]="steps()"
                [disabled]="saving()"
                (stepsChange)="updateSteps($event)"
              />
            </section>
          </div>
        </div>

      </form>
    </section>

    <ng-template #loading>
      <article class="entry entry--loading">Caricamento task in corso.</article>
    </ng-template>

    <section class="entry__overlay" *ngIf="supportOverlay() as overlay" (click)="closeSupportOverlay()">
      <article class="entry__overlay-card" (click)="$event.stopPropagation()">
        <header class="entry__overlay-head">
          <div>
            <p class="entry__panel-label">Supporto contestuale</p>
            <h3>{{ supportOverlayTitle(overlay) }}</h3>
          </div>
          <button type="button" class="entry__overlay-close" (click)="closeSupportOverlay()">Chiudi</button>
        </header>

        <div class="entry__overlay-body">
          <ng-container [ngSwitch]="overlay">
            <div *ngSwitchCase="'editor'" class="entry__overlay-copy">
              <p>Questa pagina dovrebbe restare focalizzata su metadata essenziali, step e salvataggio.</p>
              <p>Usa la sezione avanzata del metadata form solo per obiettivi educativi e note team quando servono davvero.</p>
              <p>Preview, present, link pubblici ed export appartengono alla fase di verifica della versione salvata, non al flusso principale di scrittura.</p>
            </div>

            <div *ngSwitchCase="'saved'" class="entry__overlay-copy">
              <p>Anteprima, modalita guidata ed export leggono sempre l ultima versione salvata della task.</p>
              <p>Bozze locali, step non salvati e immagini con persistenza pendente non entrano nelle superfici esterne finche non confermi il salvataggio.</p>
              <div class="entry__action-groups">
                <article class="entry__action-group">
                  <span class="entry__action-group-label">Versione salvata</span>
                  <div class="entry__actions">
                    <button
                      type="button"
                      class="entry__ghost"
                      [disabled]="saving() || !canLaunchSavedPlayback()"
                      (click)="openPreview()"
                    >
                      Verifica anteprima
                    </button>
                    <button
                      type="button"
                      class="entry__ghost"
                      [disabled]="saving() || !canLaunchSavedPlayback()"
                      (click)="openPresentMode()"
                    >
                      Avvia modalita guidata
                    </button>
                    <button
                      type="button"
                      class="entry__ghost"
                      [disabled]="saving() || !canLaunchSavedPlayback()"
                      (click)="openExport()"
                    >
                      Esporta PDF
                    </button>
                  </div>
                </article>

                <article class="entry__action-group">
                  <span class="entry__action-group-label">Gestione task</span>
                  <div class="entry__actions">
                    <button type="button" class="entry__ghost" [disabled]="saving()" (click)="duplicateTask()">
                      Duplica task
                    </button>
                  </div>
                </article>
              </div>
              <p class="entry__panel-note" *ngIf="hasPendingDraftMedia()">
                Salva prima la task per includere in anteprima, modalita guidata, export PDF e link pubblici le immagini
                ancora in bozza.
              </p>
            </div>

            <div *ngSwitchCase="'share'" class="entry__overlay-copy">
              <p>I link pubblici pubblicano solo contenuto gia salvato e separano la lettura pubblica dall editor autenticato.</p>
              <p>Il link Vista apre la lettura pubblica, mentre il link Presenta riusa il percorso guidato in modalita share-safe.</p>
              <p *ngIf="shareError()" class="entry__error">{{ shareError() }}</p>
              <p *ngIf="shareNotice()" class="entry__panel-note">{{ shareNotice() }}</p>
              <p class="entry__panel-note">{{ shareBoundaryNotice() }}</p>

              <article class="entry__share-card" *ngFor="let mode of shareModes">
                <div class="entry__share-card-copy">
                  <div class="entry__share-card-head">
                    <strong>{{ shareModeLabel(mode) }}</strong>
                    <span class="entry__share-pill" [class.entry__share-pill--active]="shareForMode(mode)?.active">
                      {{ shareForMode(mode)?.active ? 'Attivo' : 'Non creato' }}
                    </span>
                  </div>
                  <p>{{ shareModeDescription(mode) }}</p>
                  <code class="entry__share-url" *ngIf="shareForMode(mode) as share">{{ publicShareLink(share) }}</code>
                  <p class="entry__hint" *ngIf="!shareForMode(mode)">
                    Nessun link {{ shareModeLabel(mode).toLowerCase() }} attivo per questa task salvata.
                  </p>
                </div>

                <div class="entry__share-actions">
                  <button
                    type="button"
                    class="entry__ghost"
                    [disabled]="isShareActionDisabled(mode)"
                    (click)="createShare(mode)"
                  >
                    {{ shareForMode(mode) ? 'Ricrea link' : 'Crea link' }}
                  </button>
                  <button
                    type="button"
                    class="entry__ghost"
                    [disabled]="!shareForMode(mode) || isShareActionDisabled(mode)"
                    (click)="copyShareLink(mode)"
                  >
                    Copia link
                  </button>
                  <button
                    type="button"
                    class="entry__ghost"
                    [disabled]="!shareForMode(mode) || isShareActionDisabled(mode)"
                    (click)="regenerateShare(mode)"
                  >
                    Rigenera link
                  </button>
                  <button
                    type="button"
                    class="entry__ghost entry__ghost--danger"
                    [disabled]="!shareForMode(mode) || isShareActionDisabled(mode)"
                    (click)="revokeShare(mode)"
                  >
                    Revoca link
                  </button>
                </div>
              </article>

              <p class="entry__hint">
                La gestione dei link resta solo nell editor autenticato del proprietario. I link pubblici non abilitano
                modifica, salvataggio o sessioni separate dal contenuto salvato.
              </p>
            </div>

            <div *ngSwitchCase="'family'" class="entry__overlay-copy">
              <p>{{ familyContextCopy(task()!) }}</p>

              <dl class="entry__family-facts" *ngIf="task() as familyTask">
                <div>
                  <dt>Base</dt>
                  <dd>{{ familyRootTitle(familyTask) }}</dd>
                </div>
                <div>
                  <dt>Supporto</dt>
                  <dd>{{ familyTask.supportLevel || 'Da definire' }}</dd>
                </div>
                <div>
                  <dt>Task collegate</dt>
                  <dd>{{ familyCountLabel(familyTask) }}</dd>
                </div>
              </dl>

              <div class="entry__family-links" *ngIf="task()?.relatedVariants?.length; else noRelatedVariants">
                <button
                  *ngFor="let related of task()?.relatedVariants"
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
              <p class="entry__panel-note">Le varianti restano copie esplicite della stessa base salvata.</p>
            </div>

            <div *ngSwitchCase="'history'" class="entry__overlay-copy">
              <p>
                Lo storico mostra solo il totale completamenti e le 5 sessioni piu recenti della task aperta, senza
                analytics o filtri.
              </p>
              <p *ngIf="sessionHistoryError()" class="entry__error">{{ sessionHistoryError() }}</p>

              <ng-container *ngIf="!sessionHistoryError()">
                <div class="entry__history-total">
                  <span class="entry__history-total-label">Totale completamenti</span>
                  <strong>{{ currentTaskSessionCount() }}</strong>
                </div>

                <p class="entry__hint" *ngIf="!recentSessions().length && !sessionHistoryLoading()">
                  Nessuna sessione completata registrata per questa task.
                </p>

                <article class="entry__history-item" *ngFor="let session of recentSessions()">
                  <strong>{{ session.completedAt | date: 'dd/MM/yyyy HH:mm' }}</strong>
                  <span>{{ accessContextLabel(session) }}</span>
                  <small>{{ session.stepCount }} step completati</small>
                </article>
              </ng-container>
            </div>
          </ng-container>
        </div>
      </article>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .entry {
        display: grid;
        gap: 1.25rem;
      }

      .entry__eyebrow,
      .entry__panel-label {
        margin: 0 0 0.35rem;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--pitwriter-text-muted-2);
      }

      h2,
      h3,
      p,
      dl,
      dt,
      dd {
        margin: 0;
      }

      .entry__shell {
        display: grid;
        gap: 1rem;
      }

      .entry__topbar,
      .entry__notice,
      .entry__workspace-panel,
      .entry__overlay-card {
        padding: 1.2rem;
        border-radius: 1rem;
        background: rgba(var(--pitwriter-bg-surface-rgb), 0.9);
        border: 1px solid var(--pitwriter-border-subtle);
        box-shadow: 0 10px 24px var(--pitwriter-shadow-subtle);
      }

      .entry__topbar {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
      }

      .entry__identity {
        display: grid;
        gap: 0.5rem;
      }

      .entry__identity-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        color: var(--pitwriter-text-muted);
        font-size: 0.92rem;
      }

      .entry__identity-meta span {
        display: inline-flex;
        align-items: center;
        min-height: 2rem;
        padding: 0 0.8rem;
        border-radius: 999px;
        background: var(--pitwriter-bg-surface);
        border: 1px solid var(--pitwriter-border-subtle);
      }

      .entry__topbar-actions {
        display: grid;
        gap: 0.85rem;
        justify-items: end;
      }

      .entry__status {
        display: grid;
        gap: 0.4rem;
        justify-items: end;
        color: var(--pitwriter-text-muted);
        text-align: right;
      }

      .entry__status-copy {
        font-weight: 600;
        color: var(--pitwriter-primary-from);
      }

      .entry__pill {
        display: inline-flex;
        padding: 0.45rem 0.8rem;
        border-radius: 999px;
        background: rgba(79, 70, 229, 0.08);
        color: var(--pitwriter-primary-from);
        text-transform: capitalize;
      }

      .entry__topbar-buttons {
        display: flex;
        gap: 0.7rem;
        align-items: center;
      }

      .entry__rail-toggle {
        display: none;
        position: relative;
        width: 3rem;
        height: 3rem;
        padding: 0;
        border-radius: 999px;
        border: 1px solid var(--pitwriter-border);
        background: var(--pitwriter-bg-surface);
        cursor: pointer;
      }

      .entry__rail-toggle span {
        position: absolute;
        left: 0.82rem;
        width: 1.35rem;
        height: 2px;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--pitwriter-primary-from), var(--pitwriter-primary-to));
        transition: transform 180ms ease, opacity 180ms ease, top 180ms ease;
      }

      .entry__rail-toggle span:nth-child(1) {
        top: 0.98rem;
      }

      .entry__rail-toggle span:nth-child(2) {
        top: 1.45rem;
      }

      .entry__rail-toggle span:nth-child(3) {
        top: 1.92rem;
      }

      .entry__rail-toggle--open span:nth-child(1) {
        top: 1.45rem;
        transform: rotate(45deg);
      }

      .entry__rail-toggle--open span:nth-child(2) {
        opacity: 0;
      }

      .entry__rail-toggle--open span:nth-child(3) {
        top: 1.45rem;
        transform: rotate(-45deg);
      }

      .entry__primary,
      .entry__nav-link,
      .entry__actions button,
      .entry__actions a,
      .entry__ghost,
      .entry__rail-button,
      .entry__overlay-close,
      .entry__share-actions button,
      .entry__family-link {
        min-height: 2.75rem;
        border-radius: 0.75rem;
        padding: 0 1rem;
        font: inherit;
      }

      .entry__primary {
        border: 0;
        background: #11415b;
        color: #ffffff;
        cursor: pointer;
      }

      .entry__nav-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        border: 1px solid var(--pitwriter-border);
        background: var(--pitwriter-bg-surface);
        color: var(--pitwriter-text);
      }

      .entry__workspace {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 1rem;
        align-items: start;
      }

      .entry__rail {
        display: grid;
        gap: 0.75rem;
        position: sticky;
        top: 1rem;
        padding: 0.8rem;
        border-radius: 1rem;
        background: rgba(var(--pitwriter-bg-surface-rgb), 0.88);
        border: 1px solid var(--pitwriter-border-subtle);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
      }

      .entry__rail-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 3rem;
        padding: 0;
        border: 1px solid var(--pitwriter-border);
        background: var(--pitwriter-bg-surface-elevated);
        color: var(--pitwriter-primary-from);
        cursor: pointer;
        font-weight: 700;
      }

      .entry__rail-button--muted {
        color: var(--pitwriter-text-muted);
      }

      .entry__canvas {
        display: grid;
        gap: 1rem;
      }

      .entry__notice {
        padding-block: 0.9rem;
      }

      .entry__notice-copy {
        display: grid;
        gap: 0.35rem;
        color: var(--pitwriter-text-muted);
      }

      .entry__notice-copy--error,
      .entry__error {
        color: var(--pitwriter-danger-text);
      }

      .entry__action-groups {
        display: grid;
        gap: 0.8rem;
      }

      .entry__action-group {
        display: grid;
        gap: 0.6rem;
        padding: 0.95rem;
        border-radius: 0.9rem;
        background: var(--pitwriter-bg-surface);
        border: 1px solid var(--pitwriter-border-subtle);
      }

      .entry__workspace-panel {
        display: grid;
        gap: 1rem;
      }

      .entry__workspace-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
      }

      .entry__action-group-label,
      dt {
        color: var(--pitwriter-text-muted-2);
        font-size: 0.82rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .entry__ghost {
        border: 1px solid var(--pitwriter-border);
        background: var(--pitwriter-bg-surface-elevated);
        color: var(--pitwriter-text);
        cursor: pointer;
      }

      .entry__ghost--danger {
        border-color: var(--pitwriter-danger-border);
        color: var(--pitwriter-danger-text);
      }

      .entry__actions a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--pitwriter-text);
        background: var(--pitwriter-bg-surface);
      }

      .entry__actions,
      .entry__panel,
      .entry__overlay-body,
      .entry__overlay-copy,
      .entry__share-card-copy,
      .entry__share-actions {
        display: grid;
        gap: 0.75rem;
      }

      .entry__share-header,
      .entry__share-card-head {
        display: flex;
        gap: 0.75rem;
        justify-content: space-between;
        align-items: center;
      }

      .entry__share-card {
        display: grid;
        gap: 0.8rem;
        padding: 0.95rem;
        border-radius: 0.9rem;
        background: var(--pitwriter-bg-surface);
        border: 1px solid var(--pitwriter-border-subtle);
      }

      .entry__history-total,
      .entry__history-item {
        display: grid;
        gap: 0.35rem;
        padding: 0.95rem;
        border-radius: 0.9rem;
        background: var(--pitwriter-bg-surface);
        border: 1px solid var(--pitwriter-border-subtle);
      }

      .entry__history-total-label,
      .entry__history-item small {
        color: var(--pitwriter-text-muted-2);
      }

      .entry__share-state,
      .entry__share-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2rem;
        padding: 0 0.8rem;
        border-radius: 999px;
        background: var(--pitwriter-bg-hover);
        color: var(--pitwriter-text-muted);
        font-size: 0.84rem;
      }

      .entry__share-pill--active {
        background: var(--pitwriter-success-bg);
        color: var(--pitwriter-success-text);
      }

      .entry__share-url {
        display: block;
        padding: 0.75rem 0.9rem;
        border-radius: 0.9rem;
        background: var(--pitwriter-bg-surface-elevated);
        border: 1px dashed rgba(99, 102, 241, 0.25);
        color: var(--pitwriter-primary-from);
        overflow-wrap: anywhere;
      }

      .entry__family-facts {
        display: grid;
        gap: 0.65rem;
      }

      .entry__family-facts div {
        padding: 0.75rem 0.9rem;
        border-radius: 1rem;
        background: var(--pitwriter-bg-surface);
        border: 1px solid var(--pitwriter-border-subtle);
      }

      dd {
        margin-top: 0.2rem;
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
        border: 1px solid var(--pitwriter-border);
        background: var(--pitwriter-bg-surface);
        color: var(--pitwriter-text);
        cursor: pointer;
      }

      .entry__family-link small {
        color: var(--pitwriter-text-muted-2);
      }

      .entry__panel p,
      .entry__workspace-panel p {
        color: var(--pitwriter-text-muted);
        line-height: 1.5;
      }

      .entry__hint,
      .entry__panel-note {
        font-size: 0.92rem;
      }

      .entry__panel-note {
        color: var(--pitwriter-text-muted);
      }

      .entry__overlay {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 1rem;
        background: rgba(15, 23, 42, 0.38);
        z-index: 20;
      }

      .entry__overlay-card {
        width: min(36rem, 100%);
        display: grid;
        gap: 1rem;
        border-radius: 1rem;
        background: var(--pitwriter-bg-surface-elevated);
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
      }

      .entry__overlay-head {
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        align-items: start;
      }

      .entry__overlay-close {
        padding: 0 0.9rem;
        border: 1px solid var(--pitwriter-border);
        background: var(--pitwriter-bg-surface);
        color: var(--pitwriter-text);
        cursor: pointer;
      }

      .entry--loading {
        padding: 1.2rem;
        border-radius: 1rem;
        background: rgba(var(--pitwriter-bg-surface-rgb), 0.88);
        border: 1px solid var(--pitwriter-border-subtle);
        color: var(--pitwriter-text-muted);
      }

      @media (max-width: 860px) {
        .entry__topbar,
        .entry__workspace,
        .entry__workspace-head {
          flex-direction: column;
        }

        .entry__workspace {
          grid-template-columns: 1fr;
        }

        .entry__rail {
          display: none;
          position: static;
        }

        .entry__rail--open {
          display: grid;
          grid-auto-flow: column;
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }

        .entry__status {
          justify-items: start;
          text-align: left;
        }

        .entry__topbar-actions {
          width: 100%;
          justify-items: start;
        }

        .entry__topbar-buttons {
          flex-wrap: wrap;
        }

        .entry__rail-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .entry__overlay-head,
        .entry__share-header,
        .entry__share-card-head {
          flex-direction: column;
          align-items: start;
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
  protected readonly shares = signal<TaskShareSummaryRecord[]>([]);
  protected readonly sessionHistory = signal<TaskSessionSummaryRecord[]>([]);
  protected readonly sessionHistoryLoading = signal(false);
  protected readonly sessionHistoryError = signal('');
  protected readonly shareLoading = signal(false);
  protected readonly shareError = signal('');
  protected readonly shareNotice = signal('');
  protected readonly shareBusyMode = signal<TaskShareMode | null>(null);
  protected readonly railOpen = signal(false);
  protected readonly supportOverlay = signal<'editor' | 'saved' | 'share' | 'family' | 'history' | null>(null);
  protected readonly shareModes: readonly TaskShareMode[] = ['view', 'present'];

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
    if (!currentTask || this.saving() || !this.canLaunchSavedPlayback()) {
      return;
    }

    this.saveNotice.set('Anteprima aperta sulla versione salvata della task.');
    await this.router.navigate(['/tasks', currentTask.id, 'preview']);
  }

  protected async openPresentMode(): Promise<void> {
    const currentTask = this.task();
    if (!currentTask || this.saving() || !this.canLaunchSavedPlayback()) {
      return;
    }

    const launchSubject =
      currentTask.variantRole === 'variant'
        ? 'Modalita guidata aperta sulla variante salvata corrente.'
        : 'Modalita guidata aperta sulla versione salvata della task.';
    this.saveNotice.set(launchSubject);
    await this.router.navigate(['/tasks', currentTask.id, 'present']);
  }

  protected async openExport(): Promise<void> {
    const currentTask = this.task();
    if (!currentTask || this.saving() || !this.canLaunchSavedPlayback()) {
      return;
    }

    this.saveNotice.set('Export PDF aperto sulla versione salvata della task.');
    await this.router.navigate(['/tasks', currentTask.id, 'export']);
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
    await this.refreshShares(detail.id);
    await this.refreshSessionHistory(detail.id);
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

  protected canLaunchSavedPlayback(): boolean {
    return Boolean(this.task()?.id) && !this.hasPendingDraftMedia();
  }

  protected hasPendingDraftMedia(): boolean {
    return this.steps().some((step) => step.uploadState?.pendingPersistence);
  }

  protected savedSurfaceStateLabel(): string {
    if (this.saving()) {
      return 'Salvataggio in corso';
    }

    if (this.hasPendingDraftMedia()) {
      return 'Versione salvata da aggiornare';
    }

    return 'Versione salvata pronta';
  }

  protected shareForMode(mode: TaskShareMode): TaskShareSummaryRecord | null {
    return this.shares().find((share) => share.mode === mode && share.active) ?? null;
  }

  protected currentTaskSessionCount(): number {
    return this.sessionHistory().length;
  }

  protected recentSessions(): TaskSessionSummaryRecord[] {
    return this.sessionHistory().slice(0, 5);
  }

  protected accessContextLabel(session: TaskSessionSummaryRecord): string {
    return session.accessContext === 'shared_present' ? 'Link condiviso' : 'Modalita guidata autenticata';
  }

  protected shareModeLabel(mode: TaskShareMode): string {
    return mode === 'present' ? 'Presenta' : 'Vista';
  }

  protected shareModeDescription(mode: TaskShareMode): string {
    return mode === 'present'
      ? 'Apre il percorso pubblico in modalita guidata, riusando gli step salvati senza esporre l editor.'
      : 'Apre una lettura pubblica della task salvata, separata dai controlli di authoring.';
  }

  protected shareBoundaryNotice(): string {
    if (this.saving()) {
      return 'Salvataggio in corso: attendi la conferma prima di aggiornare o copiare i link pubblici.';
    }

    if (this.hasPendingDraftMedia()) {
      return 'Sono presenti immagini ancora in bozza. Salva prima la task per includerle nei link pubblici.';
    }

    return 'Se hai modificato testo, simboli o step, salva prima la task quando vuoi che i link riflettano quelle modifiche.';
  }

  protected isShareActionDisabled(mode: TaskShareMode): boolean {
    return !this.task()?.id || this.saving() || this.hasPendingDraftMedia() || this.shareBusyMode() === mode;
  }

  protected publicShareLink(share: TaskShareSummaryRecord): string {
    if (/^https?:\/\//.test(share.shareUrl)) {
      return share.shareUrl;
    }

    if (typeof window === 'undefined') {
      return share.shareUrl;
    }

    return new URL(share.shareUrl, window.location.origin).toString();
  }

  protected async createShare(mode: TaskShareMode): Promise<void> {
    const currentTask = this.task();
    if (!currentTask || this.isShareActionDisabled(mode)) {
      return;
    }

    await this.runShareAction(mode, async () => {
      const created = await firstValueFrom(this.taskLibrary.createTaskShare(currentTask.id, { mode }));
      this.upsertShare(created);
      this.shareNotice.set(`Link ${this.shareModeLabel(mode).toLowerCase()} creato sulla versione salvata corrente.`);
    });
  }

  protected async copyShareLink(mode: TaskShareMode): Promise<void> {
    const share = this.shareForMode(mode);
    if (!share || this.isShareActionDisabled(mode)) {
      return;
    }

    const link = this.publicShareLink(share);
    const clipboard = typeof navigator === 'undefined' ? null : navigator.clipboard;

    if (clipboard?.writeText) {
      await clipboard.writeText(link);
      this.shareNotice.set(`Link ${this.shareModeLabel(mode).toLowerCase()} copiato negli appunti.`);
      return;
    }

    this.shareNotice.set(`Copia manuale richiesta per il link ${this.shareModeLabel(mode).toLowerCase()}: ${link}`);
  }

  protected async regenerateShare(mode: TaskShareMode): Promise<void> {
    const currentTask = this.task();
    if (!currentTask || this.isShareActionDisabled(mode)) {
      return;
    }

    await this.runShareAction(mode, async () => {
      const rotated = await firstValueFrom(this.taskLibrary.regenerateTaskShare(currentTask.id, mode));
      this.upsertShare(rotated);
      this.shareNotice.set(
        `Link ${this.shareModeLabel(mode).toLowerCase()} rigenerato. Il token precedente non e piu valido.`
      );
    });
  }

  protected async revokeShare(mode: TaskShareMode): Promise<void> {
    const currentTask = this.task();
    const share = this.shareForMode(mode);
    if (!currentTask || !share || this.isShareActionDisabled(mode)) {
      return;
    }

    await this.runShareAction(mode, async () => {
      const revoked = await firstValueFrom(this.taskLibrary.revokeTaskShare(currentTask.id, share.id));
      this.upsertShare(revoked);
      this.shareNotice.set(`Link ${this.shareModeLabel(mode).toLowerCase()} revocato.`);
    });
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

  protected toggleRail(): void {
    this.railOpen.update((open) => !open);
  }

  protected openSupportOverlay(topic: 'editor' | 'saved' | 'share' | 'family' | 'history'): void {
    this.railOpen.set(false);
    this.supportOverlay.set(topic);
  }

  protected closeSupportOverlay(): void {
    this.supportOverlay.set(null);
  }

  protected supportOverlayTitle(topic: 'editor' | 'saved' | 'share' | 'family' | 'history'): string {
    switch (topic) {
      case 'editor':
        return 'Come usare questa pagina senza sovraccarico';
      case 'saved':
        return 'Azioni task salvata';
      case 'share':
        return 'Condivisione pubblica';
      case 'family':
        return 'Famiglia varianti';
      case 'history':
        return 'Storico sessioni';
    }
  }

  protected async openFamilyTask(taskId: string): Promise<void> {
    if (this.saving()) {
      return;
    }

    await this.router.navigate(['/tasks', taskId]);
  }

  private async refreshShares(taskId: string): Promise<void> {
    this.shareLoading.set(true);
    this.shareError.set('');

    try {
      const shares = await firstValueFrom(this.taskLibrary.listTaskShares(taskId));
      this.shares.set(shares);
    } catch {
      this.shares.set([]);
      this.shareError.set('Impossibile aggiornare i link pubblici della task.');
    } finally {
      this.shareLoading.set(false);
    }
  }

  private async refreshSessionHistory(taskId: string): Promise<void> {
    this.sessionHistoryLoading.set(true);
    this.sessionHistoryError.set('');

    try {
      const sessions = await firstValueFrom(this.taskLibrary.listTaskSessions(taskId));
      this.sessionHistory.set(sessions);
    } catch {
      this.sessionHistory.set([]);
      this.sessionHistoryError.set('Impossibile aggiornare lo storico sessioni della task.');
    } finally {
      this.sessionHistoryLoading.set(false);
    }
  }

  private async runShareAction(mode: TaskShareMode, action: () => Promise<void>): Promise<void> {
    this.shareBusyMode.set(mode);
    this.shareError.set('');
    this.shareNotice.set('');

    try {
      await action();
    } catch {
      this.shareError.set(`Operazione ${this.shareModeLabel(mode).toLowerCase()} non riuscita. Riprova tra poco.`);
    } finally {
      this.shareBusyMode.set(null);
    }
  }

  private upsertShare(share: TaskShareSummaryRecord): void {
    this.shares.update((currentShares) => {
      const nextShares = currentShares.filter(
        (currentShare) => currentShare.id !== share.id && currentShare.mode !== share.mode
      );
      return [...nextShares, share].sort((left, right) => left.mode.localeCompare(right.mode));
    });
  }
}
