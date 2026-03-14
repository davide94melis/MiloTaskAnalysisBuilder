import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MiloAuthService } from '../../core/auth/milo-auth.service';
import { PublicTaskShareRecord, PublicTaskShareStepRecord } from '../../core/tasks/task-library.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { resolveTaskSymbolGlyph } from '../library/task-symbol-catalog';

interface SharedTaskViewRecord {
  token: string;
  taskId: string;
  title: string;
  category: string;
  description: string;
  stepCount: number;
  lastUpdatedAt: string;
  steps: PublicTaskShareStepRecord[];
}

@Component({
  selector: 'mtab-task-shared-view-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="!loading(); else loadingState">
      <article class="shared-shell shared-shell--status shared-shell--error" *ngIf="errorMessage(); else readyState">
        <p class="shared-shell__eyebrow">Task condivisa</p>
        <h1>Link non disponibile</h1>
        <p>{{ errorMessage() }}</p>
      </article>
    </ng-container>

    <ng-template #readyState>
      <section *ngIf="share() as currentShare" class="shared-shell">
        <header class="shared-shell__hero">
          <div class="shared-shell__hero-copy">
            <p class="shared-shell__eyebrow">Task condivisa</p>
            <h1>{{ currentShare.title || 'Task senza titolo' }}</h1>
            <p class="shared-shell__summary">
              Questa pagina mostra solo la versione pubblica e salvata della task. Puoi leggerla, usarla come base e
              poi duplicarla nel tuo spazio Milo senza vedere note private o controlli di authoring.
            </p>
          </div>

          <div class="shared-shell__hero-actions">
            <button type="button" class="shared-shell__ghost" [disabled]="duplicateBusy()" (click)="duplicateTask()">
              Duplica nel mio spazio
            </button>
            <button type="button" class="shared-shell__primary" (click)="openSharedPresent()">
              Apri modalita guidata
            </button>
          </div>
        </header>

        <p *ngIf="notice()" class="shared-shell__notice">{{ notice() }}</p>
        <p *ngIf="duplicateError()" class="shared-shell__error-copy">{{ duplicateError() }}</p>

        <dl class="shared-shell__facts">
          <div>
            <dt>Categoria</dt>
            <dd>{{ currentShare.category || 'Non definita' }}</dd>
          </div>
          <div>
            <dt>Ultimo aggiornamento</dt>
            <dd>{{ currentShare.lastUpdatedAt | date: 'dd/MM/yyyy' }}</dd>
          </div>
          <div>
            <dt>Step condivisi</dt>
            <dd>{{ currentShare.stepCount }}</dd>
          </div>
        </dl>

        <section class="shared-shell__copy" *ngIf="currentShare.description">
          <article *ngIf="currentShare.description">
            <p class="shared-shell__eyebrow">Descrizione</p>
            <p>{{ currentShare.description }}</p>
          </article>
        </section>

        <section class="shared-shell__steps" aria-label="Step condivisi">
          <article class="shared-step" *ngFor="let step of orderedSteps()">
            <div class="shared-step__header">
              <p class="shared-shell__eyebrow">Step {{ step.position }}</p>
              <span class="shared-step__pill">{{ step.required ? 'Richiesto' : 'Opzionale' }}</span>
            </div>

            <h2>{{ step.title || 'Step senza titolo' }}</h2>
            <p class="shared-step__description">{{ step.description || 'Nessuna descrizione aggiuntiva.' }}</p>

            <section class="shared-step__supports">
              <article class="shared-step__support" *ngIf="step.visualSupport.text.trim()">
                <span>Testo visivo</span>
                <strong>{{ step.visualSupport.text }}</strong>
              </article>

              <article class="shared-step__support" *ngIf="step.visualSupport.symbol as symbol">
                <span>Simbolo</span>
                <span class="shared-step__symbol-glyph" aria-hidden="true">{{ symbolGlyph(symbol) }}</span>
                <strong>{{ symbol.label }}</strong>
                <small>{{ symbol.library }} | {{ symbol.key }}</small>
              </article>

              <figure class="shared-step__support shared-step__support--image" *ngIf="step.visualSupport.image as image">
                <img [src]="image.url" [alt]="image.altText || image.fileName" />
                <figcaption>
                  <strong>{{ image.altText || image.fileName }}</strong>
                  <small>{{ image.fileName }}</small>
                </figcaption>
              </figure>

              <p class="shared-step__empty" *ngIf="!hasVisualSupport(step)">
                Nessun supporto visivo pubblico per questo step.
              </p>
            </section>
          </article>
        </section>
      </section>
    </ng-template>

    <ng-template #loadingState>
      <article class="shared-shell shared-shell--status">
        <p class="shared-shell__eyebrow">Task condivisa</p>
        <h1>Caricamento link</h1>
        <p>Sto recuperando la versione pubblica e salvata della task.</p>
      </article>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
        padding: clamp(1rem, 2vw, 1.5rem);
        background:
          radial-gradient(circle at top left, rgba(255, 233, 189, 0.6), transparent 28%),
          linear-gradient(180deg, #f7fafc, #eef6f8);
      }

      .shared-shell {
        display: grid;
        gap: 1rem;
        max-width: 72rem;
        margin: 0 auto;
        color: #123446;
      }

      .shared-shell__hero,
      .shared-shell__facts,
      .shared-shell__copy,
      .shared-step,
      .shared-shell--status {
        padding: 1.25rem;
        border-radius: 1.75rem;
        border: 1px solid rgba(18, 52, 70, 0.12);
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 18px 40px rgba(18, 52, 70, 0.08);
      }

      .shared-shell__hero,
      .shared-shell__copy,
      .shared-step,
      .shared-shell__hero-actions,
      .shared-shell__hero-copy,
      .shared-step__supports {
        display: grid;
        gap: 0.9rem;
      }

      .shared-shell__hero {
        grid-template-columns: minmax(0, 1.2fr) minmax(16rem, 0.8fr);
        align-items: start;
      }

      .shared-shell__eyebrow {
        margin: 0;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #8e6236;
      }

      .shared-shell__summary,
      .shared-step__description,
      .shared-shell__copy p,
      .shared-step__empty,
      .shared-step__support small {
        color: #49606c;
        line-height: 1.55;
      }

      .shared-shell__hero-actions {
        justify-items: stretch;
      }

      .shared-shell__primary,
      .shared-shell__ghost {
        min-height: 3.1rem;
        padding: 0 1.1rem;
        border-radius: 999px;
        font: inherit;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .shared-shell__primary {
        border: 0;
        background: linear-gradient(180deg, #123446, #235772);
        color: #ffffff;
      }

      .shared-shell__ghost {
        border: 1px solid rgba(18, 52, 70, 0.16);
        background: rgba(247, 250, 252, 0.96);
        color: #123446;
      }

      .shared-shell__ghost:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .shared-shell__notice {
        margin: 0;
        color: #0f766e;
      }

      .shared-shell__error-copy,
      .shared-shell--error p,
      .shared-shell--error h1 {
        color: #b42318;
      }

      .shared-shell__facts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
        gap: 0.75rem;
      }

      .shared-shell__facts div {
        padding: 0.85rem;
        border-radius: 1.1rem;
        background: rgba(247, 250, 252, 0.96);
      }

      .shared-shell__steps {
        display: grid;
        gap: 1rem;
      }

      .shared-step__header {
        display: flex;
        gap: 0.75rem;
        justify-content: space-between;
        align-items: center;
      }

      .shared-step__pill {
        display: inline-flex;
        align-items: center;
        min-height: 2rem;
        padding: 0 0.85rem;
        border-radius: 999px;
        background: rgba(18, 52, 70, 0.08);
        color: #123446;
      }

      .shared-step__supports {
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      }

      .shared-step__support {
        padding: 1rem;
        border-radius: 1.2rem;
        border: 1px solid rgba(18, 52, 70, 0.08);
        background: rgba(247, 250, 252, 0.96);
        display: grid;
        gap: 0.45rem;
      }

      .shared-step__support span {
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #8e6236;
      }

      .shared-step__support strong {
        font-size: 1.2rem;
      }

      .shared-step__symbol-glyph {
        font-size: clamp(2.8rem, 6vw, 4.5rem);
        line-height: 1;
      }

      .shared-step__support--image {
        grid-column: 1 / -1;
      }

      .shared-step__support img {
        width: 100%;
        max-height: 24rem;
        object-fit: contain;
        border-radius: 1rem;
        background: linear-gradient(180deg, rgba(255, 243, 202, 0.72), rgba(228, 242, 247, 0.82));
      }

      h1,
      h2,
      p,
      figure,
      figcaption,
      dl,
      dt,
      dd {
        margin: 0;
      }

      @media (max-width: 860px) {
        .shared-shell__hero {
          grid-template-columns: 1fr;
        }

        .shared-step__supports {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskSharedViewPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskLibrary = inject(TaskLibraryService);
  private readonly auth = inject(MiloAuthService);

  protected readonly share = signal<SharedTaskViewRecord | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly duplicateBusy = signal(false);
  protected readonly duplicateError = signal('');
  protected readonly notice = signal('');
  protected readonly orderedSteps = computed(() =>
    [...(this.share()?.steps ?? [])].sort((left, right) => left.position - right.position)
  );

  constructor() {
    this.route.paramMap.subscribe((params) => {
      void this.loadShare(params.get('token'));
    });
  }

  protected hasVisualSupport(step: PublicTaskShareStepRecord): boolean {
    return Boolean(step.visualSupport.text.trim() || step.visualSupport.symbol || step.visualSupport.image);
  }

  protected symbolGlyph(symbol: { library: string; key: string; label: string } | null | undefined): string {
    return resolveTaskSymbolGlyph(symbol?.library, symbol?.key) ?? symbol?.label.slice(0, 1) ?? '?';
  }

  protected async openSharedPresent(): Promise<void> {
    const currentShare = this.share();
    if (!currentShare) {
      return;
    }

    await this.router.navigate(['/shared', currentShare.token, 'present']);
  }

  protected async duplicateTask(): Promise<void> {
    const currentShare = this.share();
    if (!currentShare || this.duplicateBusy()) {
      return;
    }

    this.notice.set('');
    this.duplicateError.set('');

    if (!this.auth.isLoggedIn()) {
      const redirectTo = `/shared/${currentShare.token}`;
      this.notice.set('Per duplicare la task devi accedere con Milo. Ti reindirizzo al login.');
      await this.router.navigateByUrl(
        this.auth.buildLoginBridgeUrl({
          intent: 'duplicate-share',
          shareToken: currentShare.token,
          redirectTo
        })
      );
      return;
    }

    this.duplicateBusy.set(true);

    try {
      const duplicated = await firstValueFrom(this.taskLibrary.duplicateTaskFromShare(currentShare.token));
      await this.router.navigate(['/tasks', duplicated.id]);
    } catch {
      this.duplicateError.set('Duplicazione non riuscita. Riprova tra poco.');
    } finally {
      this.duplicateBusy.set(false);
    }
  }

  private async loadShare(token: string | null): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    this.share.set(null);
    this.notice.set('');
    this.duplicateError.set('');

    if (!token) {
      this.loading.set(false);
      this.errorMessage.set('Token di condivisione non valido.');
      return;
    }

    try {
      const share = await firstValueFrom(this.taskLibrary.getPublicTaskShare(token));
      this.share.set({
        token,
        taskId: share.taskId,
        title: share.title,
        category: share.category,
        description: share.description,
        stepCount: share.stepCount,
        lastUpdatedAt: share.lastUpdatedAt,
        steps: share.steps
      });
    } catch {
      this.errorMessage.set('Il link condiviso non e disponibile o e stato revocato.');
    } finally {
      this.loading.set(false);
    }
  }
}
