import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MiloAuthService } from '../core/auth/milo-auth.service';

@Component({
  selector: 'mtab-main-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="shell">
      <header class="shell__header">
        <div>
          <p class="shell__eyebrow">Milo ecosystem</p>
          <h1>Milo Task Analysis Builder</h1>
        </div>
        <button type="button" (click)="logout()">Esci</button>
      </header>

      <section class="shell__content">
        <article class="panel">
          <h2>Sessione autenticata</h2>
          <p *ngIf="user() as currentUser; else loading">
            Utente corrente: <strong>{{ currentUser.email || currentUser.id }}</strong>
          </p>
          <ng-template #loading>
            <p>Ripristino sessione Milo in corso.</p>
          </ng-template>
        </article>

        <article class="panel panel--muted">
          <h2>Stato fase 1</h2>
          <p>Frontend config, token persistence, interceptor e route protection sono pronti per le fasi successive.</p>
        </article>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
        background: radial-gradient(circle at top, #eff6ff 0, #f9fafb 45%, #f3f4f6 100%);
        color: #0f172a;
      }

      .shell {
        width: min(72rem, 100%);
        margin: 0 auto;
        padding: 2rem 1.25rem 3rem;
      }

      .shell__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .shell__eyebrow {
        margin: 0 0 0.35rem;
        color: #64748b;
        font-size: 0.85rem;
      }

      h1,
      h2 {
        margin: 0;
      }

      .shell__content {
        display: grid;
        gap: 1rem;
      }

      .panel {
        padding: 1.5rem;
        border-radius: 1.25rem;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.3);
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
      }

      .panel--muted p {
        color: #475569;
      }

      button {
        border: 0;
        border-radius: 999px;
        padding: 0.8rem 1rem;
        font: inherit;
        color: #ffffff;
        background: linear-gradient(90deg, #4f46e5, #ec4899);
        cursor: pointer;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  private readonly auth = inject(MiloAuthService);
  private readonly router = inject(Router);

  protected readonly user = computed(() => this.auth.currentUser());

  constructor() {
    void this.auth.restoreSession();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/auth/login');
  }
}
