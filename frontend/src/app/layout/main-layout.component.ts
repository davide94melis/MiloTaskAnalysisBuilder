import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MiloAuthService } from '../core/auth/milo-auth.service';

@Component({
  selector: 'mtab-main-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <main class="shell">
      <header class="shell__header">
        <div class="shell__brand">
          <p class="shell__eyebrow">Milo ecosystem</p>
          <div>
            <h1>Milo Task Analysis Builder</h1>
            <p class="shell__subtitle">
              Organizza task analysis chiare, riapribili e pronte da condividere con il team educativo.
            </p>
          </div>
        </div>

        <div class="shell__account">
          <div class="shell__user" *ngIf="user() as currentUser; else restoring">
            <span class="shell__avatar">{{ initials(currentUser.email || currentUser.id) }}</span>
            <div>
              <p class="shell__user-label">Sessione Milo attiva</p>
              <strong>{{ currentUser.email || currentUser.id }}</strong>
            </div>
          </div>

          <ng-template #restoring>
            <p class="shell__user-label">Ripristino sessione Milo in corso.</p>
          </ng-template>

          <button type="button" class="shell__logout" (click)="logout()">Esci</button>
        </div>
      </header>

      <section class="shell__frame">
        <nav class="shell__nav" aria-label="Sezioni principali">
          <a routerLink="/dashboard" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">
            Dashboard
          </a>
          <a routerLink="/library" routerLinkActive="is-active">Libreria</a>
          <a routerLink="/tasks/new" routerLinkActive="is-active">Nuova scheda</a>
        </nav>

        <section class="shell__content">
          <router-outlet />
        </section>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
        color: #1f2a37;
        background:
          radial-gradient(circle at top left, rgba(191, 219, 254, 0.8), transparent 28%),
          radial-gradient(circle at right top, rgba(254, 240, 138, 0.65), transparent 25%),
          linear-gradient(180deg, #f4f0df 0%, #f8f6ef 24%, #f7fbfd 100%);
      }

      .shell {
        width: min(78rem, 100%);
        margin: 0 auto;
        padding: 1.5rem 1.1rem 2.5rem;
      }

      .shell__header {
        display: flex;
        justify-content: space-between;
        gap: 1.5rem;
        align-items: flex-start;
        margin-bottom: 1.5rem;
      }

      .shell__brand {
        display: grid;
        gap: 0.35rem;
      }

      .shell__eyebrow {
        margin: 0;
        color: #6b7280;
        font-size: 0.84rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        font-size: clamp(1.75rem, 3vw, 2.6rem);
        color: #11415b;
      }

      .shell__subtitle,
      .shell__user-label {
        margin: 0;
      }

      .shell__subtitle {
        margin-top: 0.35rem;
        max-width: 38rem;
        line-height: 1.5;
        color: #4b5563;
      }

      .shell__account {
        display: flex;
        gap: 0.9rem;
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .shell__user {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 0.7rem 0.9rem;
        border-radius: 1.4rem;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(17, 65, 91, 0.12);
        box-shadow: 0 16px 30px rgba(17, 65, 91, 0.08);
      }

      .shell__avatar {
        display: grid;
        place-items: center;
        width: 2.6rem;
        height: 2.6rem;
        border-radius: 999px;
        background: linear-gradient(135deg, #ffd67b, #f4a261);
        color: #11415b;
        font-weight: 700;
      }

      .shell__user strong {
        font-size: 0.95rem;
      }

      .shell__user-label {
        color: #6b7280;
        font-size: 0.78rem;
      }

      .shell__logout {
        border: 0;
        border-radius: 999px;
        padding: 0.85rem 1.05rem;
        font: inherit;
        font-weight: 600;
        color: #11415b;
        background: rgba(255, 255, 255, 0.82);
        box-shadow: 0 10px 18px rgba(17, 65, 91, 0.08);
        cursor: pointer;
      }

      .shell__frame {
        display: grid;
        gap: 1rem;
      }

      .shell__nav {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .shell__nav a {
        padding: 0.82rem 1.05rem;
        border-radius: 999px;
        text-decoration: none;
        color: #31566b;
        background: rgba(255, 255, 255, 0.74);
        border: 1px solid rgba(17, 65, 91, 0.12);
        transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
      }

      .shell__nav a:hover,
      .shell__nav a:focus-visible,
      .shell__nav a.is-active {
        transform: translateY(-1px);
        background: #11415b;
        color: #ffffff;
        box-shadow: 0 12px 20px rgba(17, 65, 91, 0.18);
      }

      .shell__content {
        min-width: 0;
      }

      @media (max-width: 720px) {
        .shell {
          padding-inline: 0.9rem;
        }

        .shell__header {
          flex-direction: column;
        }

        .shell__account {
          width: 100%;
          justify-content: space-between;
        }
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

  protected initials(value: string): string {
    return value
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/auth/login');
  }
}
