import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MiloAuthService } from '../core/auth/milo-auth.service';
import { TaskCardRecord } from '../core/tasks/task-library.models';
import { TaskLibraryService } from '../core/tasks/task-library.service';

@Component({
  selector: 'mtab-main-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <main class="layout">
      <div
        class="layout__backdrop"
        [class.layout__backdrop--visible]="sidebarOpen()"
        (click)="closeSidebar()"
        aria-hidden="true"
      ></div>

      <aside class="sidebar" [class.sidebar--open]="sidebarOpen()" aria-label="Navigazione principale">
        <a routerLink="/dashboard" class="sidebar__brand" (click)="closeSidebar()">
          <span class="sidebar__logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3L2 9l10 6 10-6-10-6z"/>
              <path d="M2 17l10 6 10-6"/>
              <path d="M2 13l10 6 10-6"/>
            </svg>
          </span>
          <span class="sidebar__brand-copy">
            <strong>Milo Task Builder</strong>
            <small>Milo ecosystem</small>
          </span>
        </a>

        <button type="button" class="sidebar__primary" (click)="openNewTask()">
          <span aria-hidden="true">+</span>
          <span>Nuova task</span>
        </button>

        <nav class="sidebar__nav">
          <a
            routerLink="/dashboard"
            routerLinkActive="is-active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="sidebar__link"
            (click)="closeSidebar()"
          >
            <span class="sidebar__icon" aria-hidden="true">⌂</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/library" routerLinkActive="is-active" class="sidebar__link" (click)="closeSidebar()">
            <span class="sidebar__icon" aria-hidden="true">▤</span>
            <span>Libreria</span>
          </a>
          <a routerLink="/tasks/new" routerLinkActive="is-active" class="sidebar__link" (click)="closeSidebar()">
            <span class="sidebar__icon" aria-hidden="true">✎</span>
            <span>Editor task</span>
          </a>
        </nav>

        <section class="sidebar__section">
          <header class="sidebar__section-head">
            <span>Workspace</span>
            <span class="sidebar__section-pill">{{ currentSection().tag }}</span>
          </header>
          <p class="sidebar__section-title">{{ currentSection().title }}</p>
          <p class="sidebar__section-copy">{{ currentSection().description }}</p>
        </section>

        <section class="sidebar__section sidebar__section--list">
          <button
            type="button"
            class="sidebar__section-toggle"
            (click)="toggleSection('recentDrafts')"
            [attr.aria-expanded]="!recentDraftsCollapsed()"
          >
            <span class="sidebar__section-toggle-left">
              <span class="sidebar__section-chevron" [class.sidebar__section-chevron--collapsed]="recentDraftsCollapsed()">
                ▾
              </span>
              <span>Bozze recenti</span>
            </span>
            <span class="sidebar__section-pill">{{ recentDrafts().length }}</span>
          </button>

          <ng-container *ngIf="!recentDraftsCollapsed()">
            <p class="sidebar__empty" *ngIf="!recentDrafts().length">Nessuna bozza recente disponibile.</p>

            <div class="sidebar__items" *ngIf="recentDrafts().length">
              <button type="button" class="sidebar__item" *ngFor="let task of recentDrafts()" (click)="openTask(task.id)">
                <span class="sidebar__item-title">{{ task.title || 'Task senza titolo' }}</span>
                <span class="sidebar__item-meta">
                  {{ task.supportLevel || 'Supporto libero' }} · {{ task.stepCount }} step
                </span>
              </button>
            </div>
          </ng-container>
        </section>

        <section class="sidebar__section sidebar__section--list">
          <button
            type="button"
            class="sidebar__section-toggle"
            (click)="toggleSection('templates')"
            [attr.aria-expanded]="!templatesCollapsed()"
          >
            <span class="sidebar__section-toggle-left">
              <span class="sidebar__section-chevron" [class.sidebar__section-chevron--collapsed]="templatesCollapsed()">
                ▾
              </span>
              <span>Template pronti</span>
            </span>
            <span class="sidebar__section-pill">{{ templates().length }}</span>
          </button>

          <ng-container *ngIf="!templatesCollapsed()">
            <p class="sidebar__empty" *ngIf="!templates().length">Nessun template disponibile.</p>

            <div class="sidebar__items" *ngIf="templates().length">
              <button
                type="button"
                class="sidebar__item sidebar__item--template"
                *ngFor="let task of templates()"
                (click)="startFromTemplate(task.id)"
              >
                <span class="sidebar__item-title">{{ task.title || 'Template senza titolo' }}</span>
                <span class="sidebar__item-meta">
                  {{ task.category || 'Template operativo' }}
                </span>
              </button>
            </div>
          </ng-container>
        </section>

        <footer class="sidebar__footer">
          <div class="sidebar__user" *ngIf="user() as currentUser; else restoring">
            <span class="sidebar__avatar">{{ initials(currentUser.email || currentUser.id) }}</span>
            <div class="sidebar__user-copy">
              <small>Sessione Milo attiva</small>
              <strong>{{ currentUser.email || currentUser.id }}</strong>
            </div>
          </div>

          <ng-template #restoring>
            <p class="sidebar__user-copy sidebar__user-copy--muted">Ripristino sessione Milo in corso.</p>
          </ng-template>

          <button type="button" class="sidebar__logout" (click)="logout()">Esci</button>
        </footer>
      </aside>

      <section class="layout__main">
        <header class="topbar">
          <button
            type="button"
            class="topbar__hamburger"
            [class.topbar__hamburger--open]="sidebarOpen()"
            [attr.aria-expanded]="sidebarOpen()"
            aria-label="Apri navigazione"
            (click)="toggleSidebar()"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div class="topbar__copy">
            <p class="topbar__eyebrow">Workspace operativo</p>
            <strong>{{ currentSection().title }}</strong>
          </div>

          <div class="topbar__meta">
            <span class="topbar__pill">{{ currentSection().tag }}</span>
            <small>{{ currentUrl() }}</small>
          </div>
        </header>

        <section class="layout__content">
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
        color: var(--pitwriter-text);
        background: var(--pitwriter-bg-page);
      }

      .layout {
        min-height: 100dvh;
      }

      .layout__backdrop {
        display: none;
      }

      .sidebar {
        width: 260px;
        flex-shrink: 0;
        background: var(--pitwriter-bg-surface-elevated);
        border-right: 1px solid var(--pitwriter-border-subtle);
        display: flex;
        flex-direction: column;
        padding: 0.75rem 0;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        z-index: 30;
        overflow: hidden;
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .sidebar__brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        margin: 0 0.75rem 0.5rem;
        text-decoration: none;
        color: var(--pitwriter-text);
        border-radius: 0.75rem;
      }

      .sidebar__brand:hover {
        background: var(--pitwriter-bg-hover);
      }

      .sidebar__logo {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        color: var(--pitwriter-primary-from);
      }

      .sidebar__logo svg {
        width: 1.4rem;
        height: 1.4rem;
      }

      .sidebar__brand-copy {
        display: grid;
        gap: 0.1rem;
      }

      .sidebar__brand-copy strong {
        font-size: 0.92rem;
      }

      .sidebar__brand-copy small {
        color: var(--pitwriter-text-muted-2);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.72rem;
      }

      .sidebar__primary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        margin: 0 0.75rem 0.75rem;
        padding: 0.75rem;
        border: none;
        border-radius: 0.75rem;
        background: linear-gradient(135deg, var(--pitwriter-primary-from), var(--pitwriter-primary-to));
        color: #fff;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
      }

      .sidebar__nav {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 0 0.75rem;
      }

      .sidebar__link {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.62rem 0.75rem;
        border-radius: 0.75rem;
        color: var(--pitwriter-text-muted);
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 500;
      }

      .sidebar__link:hover {
        background: var(--pitwriter-bg-hover);
        color: var(--pitwriter-text);
      }

      .sidebar__link.is-active {
        background: var(--pitwriter-bg-hover);
        color: var(--pitwriter-primary-from);
      }

      .sidebar__link.is-active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0.4rem;
        bottom: 0.4rem;
        width: 3px;
        border-radius: 0 2px 2px 0;
        background: linear-gradient(180deg, var(--pitwriter-primary-from), var(--pitwriter-primary-to));
      }

      .sidebar__icon {
        width: 1.125rem;
        text-align: center;
        flex-shrink: 0;
      }

      .sidebar__section {
        margin: 0.75rem;
        padding: 0.9rem;
        border-radius: 0.9rem;
        border: 1px solid var(--pitwriter-border-subtle);
        background: var(--pitwriter-bg-surface);
        display: grid;
        gap: 0.55rem;
      }

      .sidebar__section-head {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: center;
        color: var(--pitwriter-text-muted-2);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .sidebar__section-toggle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--pitwriter-text-muted-2);
        cursor: pointer;
        font: inherit;
        text-align: left;
      }

      .sidebar__section-toggle-left {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        min-width: 0;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .sidebar__section-chevron {
        display: inline-flex;
        transition: transform 200ms ease;
      }

      .sidebar__section-chevron--collapsed {
        transform: rotate(-90deg);
      }

      .sidebar__section-pill {
        display: inline-flex;
        align-items: center;
        min-height: 1.8rem;
        padding: 0 0.7rem;
        border-radius: 999px;
        background: rgba(79, 70, 229, 0.08);
        color: var(--pitwriter-primary-from);
      }

      .sidebar__section-title,
      .sidebar__section-copy {
        margin: 0;
      }

      .sidebar__section-title {
        font-weight: 600;
      }

      .sidebar__section-copy {
        color: var(--pitwriter-text-muted);
        line-height: 1.45;
        font-size: 0.9rem;
      }

      .sidebar__section--list {
        min-height: 0;
      }

      .sidebar__items {
        display: grid;
        gap: 0.45rem;
      }

      .sidebar__item {
        display: grid;
        gap: 0.2rem;
        width: 100%;
        padding: 0.7rem 0.75rem;
        border: 1px solid var(--pitwriter-border-subtle);
        border-radius: 0.75rem;
        background: var(--pitwriter-bg-surface-elevated);
        text-align: left;
        color: var(--pitwriter-text);
        cursor: pointer;
      }

      .sidebar__item:hover {
        background: var(--pitwriter-bg-hover);
      }

      .sidebar__item--template {
        background: rgba(79, 70, 229, 0.04);
      }

      .sidebar__item-title {
        font-size: 0.88rem;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .sidebar__item-meta,
      .sidebar__empty {
        color: var(--pitwriter-text-muted);
        font-size: 0.78rem;
        line-height: 1.4;
      }

      .sidebar__footer {
        margin-top: auto;
        padding: 0.75rem;
        border-top: 1px solid var(--pitwriter-border-subtle);
        display: grid;
        gap: 0.65rem;
      }

      .sidebar__user {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.4rem 0.25rem;
      }

      .sidebar__avatar {
        display: grid;
        place-items: center;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--pitwriter-primary-from), var(--pitwriter-primary-to));
        color: #fff;
        font-weight: 700;
        flex-shrink: 0;
      }

      .sidebar__user-copy {
        display: grid;
        min-width: 0;
      }

      .sidebar__user-copy small {
        color: var(--pitwriter-text-muted-2);
        font-size: 0.75rem;
      }

      .sidebar__user-copy strong,
      .sidebar__user-copy--muted {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .sidebar__user-copy--muted {
        color: var(--pitwriter-text-muted);
        font-size: 0.85rem;
      }

      .sidebar__logout {
        border: 1px solid var(--pitwriter-border);
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        font: inherit;
        font-weight: 600;
        color: var(--pitwriter-text);
        background: var(--pitwriter-bg-surface);
        cursor: pointer;
      }

      .sidebar__logout:hover {
        background: var(--pitwriter-bg-hover);
      }

      .layout__main {
        min-height: 100dvh;
        margin-left: 260px;
        display: flex;
        flex-direction: column;
      }

      .topbar {
        display: flex;
        align-items: center;
        gap: 1rem;
        min-height: 3.75rem;
        padding: 0 1.25rem;
        background: rgba(var(--pitwriter-bg-surface-rgb), 0.82);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--pitwriter-border-subtle);
        position: sticky;
        top: 0;
        z-index: 20;
      }

      .topbar__hamburger {
        display: none;
        position: relative;
        width: 2.5rem;
        height: 2.5rem;
        padding: 0;
        border: none;
        border-radius: 0.5rem;
        background: transparent;
        color: var(--pitwriter-text);
        cursor: pointer;
      }

      .topbar__hamburger span {
        position: absolute;
        left: 0.68rem;
        width: 1.15rem;
        height: 2px;
        background: currentColor;
        border-radius: 1px;
        transition: transform 250ms ease, opacity 200ms ease, top 250ms ease;
      }

      .topbar__hamburger span:nth-child(1) {
        top: 0.8rem;
      }

      .topbar__hamburger span:nth-child(2) {
        top: 1.18rem;
      }

      .topbar__hamburger span:nth-child(3) {
        top: 1.56rem;
      }

      .topbar__hamburger--open span:nth-child(1) {
        top: 1.18rem;
        transform: rotate(45deg);
      }

      .topbar__hamburger--open span:nth-child(2) {
        opacity: 0;
      }

      .topbar__hamburger--open span:nth-child(3) {
        top: 1.18rem;
        transform: rotate(-45deg);
      }

      .topbar__copy {
        display: grid;
        gap: 0.12rem;
        min-width: 0;
      }

      .topbar__eyebrow {
        margin: 0;
        color: var(--pitwriter-text-muted-2);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .topbar__meta {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-left: auto;
        color: var(--pitwriter-text-muted);
        min-width: 0;
      }

      .topbar__pill {
        display: inline-flex;
        align-items: center;
        min-height: 1.9rem;
        padding: 0 0.75rem;
        border-radius: 999px;
        background: var(--pitwriter-bg-surface);
        border: 1px solid var(--pitwriter-border-subtle);
        color: var(--pitwriter-primary-from);
      }

      .layout__content {
        padding: 1.25rem;
        min-width: 0;
      }

      @media (max-width: 1024px) {
        .layout__backdrop {
          display: block;
          position: fixed;
          inset: 0;
          background: var(--pitwriter-modal-backdrop);
          z-index: 25;
          opacity: 0;
          pointer-events: none;
          transition: opacity 200ms ease;
        }

        .layout__backdrop--visible {
          opacity: 1;
          pointer-events: auto;
        }

        .sidebar {
          transform: translateX(-100%);
          box-shadow: 4px 0 24px var(--pitwriter-shadow);
        }

        .sidebar--open {
          transform: translateX(0);
        }

        .layout__main {
          margin-left: 0;
        }

        .topbar__hamburger {
          display: inline-flex;
        }
      }

      @media (max-width: 720px) {
        .topbar {
          padding-inline: 1rem;
        }

        .layout__content {
          padding: 1rem;
        }

        .topbar__meta {
          display: none;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  private readonly auth = inject(MiloAuthService);
  private readonly router = inject(Router);
  private readonly taskLibrary = inject(TaskLibraryService);
  protected readonly currentUrl = signal(this.router.url || '/dashboard');
  protected readonly sidebarOpen = signal(false);
  protected readonly recentDrafts = signal<TaskCardRecord[]>([]);
  protected readonly templates = signal<TaskCardRecord[]>([]);
  protected readonly recentDraftsCollapsed = signal(false);
  protected readonly templatesCollapsed = signal(false);

  protected readonly user = computed(() => this.auth.currentUser());
  protected readonly currentSection = computed(() => this.describeSection(this.currentUrl()));

  constructor() {
    void this.auth.restoreSession();
    this.restoreSidebarPreferences();
    void this.loadSidebarCollections();
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);
        this.sidebarOpen.set(false);
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

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  openNewTask(): void {
    this.closeSidebar();
    void this.router.navigateByUrl('/tasks/new');
  }

  openTask(taskId: string): void {
    this.closeSidebar();
    void this.router.navigate(['/tasks', taskId]);
  }

  async startFromTemplate(templateId: string): Promise<void> {
    this.closeSidebar();
    const created = await firstValueFrom(this.taskLibrary.createDraft({ templateId }));
    await this.router.navigate(['/tasks', created.id]);
  }

  toggleSection(section: 'recentDrafts' | 'templates'): void {
    if (section === 'recentDrafts') {
      const next = !this.recentDraftsCollapsed();
      this.recentDraftsCollapsed.set(next);
      this.persistSidebarPreference('recentDraftsCollapsed', next);
      return;
    }

    const next = !this.templatesCollapsed();
    this.templatesCollapsed.set(next);
    this.persistSidebarPreference('templatesCollapsed', next);
  }

  private async loadSidebarCollections(): Promise<void> {
    try {
      const dashboard = await firstValueFrom(this.taskLibrary.getDashboard());
      this.recentDrafts.set(dashboard.recentDrafts.slice(0, 5));
      this.templates.set(dashboard.seedTemplates.slice(0, 5));
    } catch {
      this.recentDrafts.set([]);
      this.templates.set([]);
    }
  }

  private restoreSidebarPreferences(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.recentDraftsCollapsed.set(window.localStorage.getItem('mtab.sidebar.recentDraftsCollapsed') === 'true');
    this.templatesCollapsed.set(window.localStorage.getItem('mtab.sidebar.templatesCollapsed') === 'true');
  }

  private persistSidebarPreference(key: 'recentDraftsCollapsed' | 'templatesCollapsed', value: boolean): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(`mtab.sidebar.${key}`, String(value));
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
