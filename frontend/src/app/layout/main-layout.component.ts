import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
          <div class="shell__product-tags" aria-label="Punti chiave prodotto">
            <span>Editor visuale</span>
            <span>Present mode</span>
            <span>Export PDF</span>
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

        <section class="shell__section-header" aria-label="Orientamento workspace">
          <div>
            <p class="shell__section-eyebrow">Workspace operativo</p>
            <strong>{{ currentSection().title }}</strong>
            <p class="shell__section-copy">{{ currentSection().description }}</p>
          </div>
          <div class="shell__section-meta">
            <span class="shell__section-badge">{{ currentSection().tag }}</span>
            <small>{{ currentUrl() }}</small>
          </div>
        </section>

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

      .shell__product-tags {
        display: flex;
        gap: 0.55rem;
        flex-wrap: wrap;
        margin-top: 0.4rem;
      }

      .shell__product-tags span,
      .shell__section-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2rem;
        padding: 0 0.8rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(17, 65, 91, 0.12);
        color: #31566b;
        box-shadow: 0 10px 18px rgba(17, 65, 91, 0.06);
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

      .shell__section-header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        padding: 0.95rem 1.1rem;
        border-radius: 1.35rem;
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid rgba(17, 65, 91, 0.1);
      }

      .shell__section-copy,
      .shell__section-meta small {
        margin: 0;
        color: #4b5563;
        line-height: 1.45;
      }

      .shell__section-meta {
        display: grid;
        gap: 0.35rem;
        justify-items: end;
      }

      .shell__section-eyebrow {
        margin: 0 0 0.18rem;
        color: #7c5f3b;
        font-size: 0.78rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
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

        .shell__section-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .shell__section-meta {
          justify-items: start;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  private readonly auth = inject(MiloAuthService);
  private readonly router = inject(Router);
  protected readonly currentUrl = signal(this.router.url || '/dashboard');

  protected readonly user = computed(() => this.auth.currentUser());
  protected readonly currentSection = computed(() => this.describeSection(this.currentUrl()));

  constructor() {
    void this.auth.restoreSession();
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);
      }
    });
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

  private describeSection(url: string): { title: string; description: string; tag: string } {
    if (url.startsWith('/dashboard')) {
      return {
        title: 'Dashboard operativa',
        description: 'Raccoglie i percorsi principali per creare, riprendere, presentare e stampare task salvate.',
        tag: 'Dashboard'
      };
    }

    if (url.startsWith('/library')) {
      return {
        title: 'Libreria task',
        description: 'Aiuta a ritrovare varianti, task recenti e contenuti pronti da aprire nell editor.',
        tag: 'Libreria'
      };
    }

    if (url.includes('/preview')) {
      return {
        title: 'Anteprima salvata',
        description: 'Verifica la resa della task salvata prima di presentarla o esportarla in PDF.',
        tag: 'Anteprima'
      };
    }

    if (url.includes('/present')) {
      return {
        title: 'Modalita guidata',
        description: 'Usa la task salvata in un contesto di esecuzione guidata per il bambino.',
        tag: 'Presenta'
      };
    }

    if (url.includes('/export')) {
      return {
        title: 'Export PDF',
        description: 'Prepara un documento stampabile dalla stessa versione salvata usata in anteprima e presentazione.',
        tag: 'Export'
      };
    }

    if (url.startsWith('/tasks/new') || /^\/tasks\/[^/]+$/.test(url)) {
      return {
        title: 'Editor task',
        description: 'Qui salvi la task e controlli le azioni collegate: anteprima, presentazione, condivisione ed export.',
        tag: 'Editor'
      };
    }

    return {
      title: 'Milo Task Analysis Builder',
      description: 'Una superficie unica per organizzare, verificare, presentare, condividere ed esportare task analysis.',
      tag: 'App'
    };
  }
}
