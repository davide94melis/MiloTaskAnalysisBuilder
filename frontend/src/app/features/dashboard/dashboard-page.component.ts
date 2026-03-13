import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { TaskCardRecord, TaskDashboardSummary } from '../../core/tasks/task-library.models';
import { TaskCardComponent } from '../library/task-card.component';

@Component({
  selector: 'mtab-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TaskCardComponent],
  template: `
    <section class="hero">
      <div>
        <p class="hero__eyebrow">Dashboard operativa</p>
        <h2>Apri una bozza, duplica un template e riparti da dove eri.</h2>
        <p class="hero__copy">
          La home mostra le task che usi davvero: bozze recenti, template pronti
          e scorciatoie chiare per preparare il lavoro quotidiano.
        </p>
      </div>

      <div class="hero__actions">
        <button type="button" class="hero__primary" (click)="createTask()">Nuova task</button>
        <a routerLink="/library">Apri libreria</a>
      </div>
    </section>

    <section class="stats" *ngIf="dashboard() as vm; else loading">
      <article>
        <span>Bozze attive</span>
        <strong>{{ vm.stats.draftCount }}</strong>
      </article>
      <article>
        <span>Template pronti</span>
        <strong>{{ vm.stats.templateCount }}</strong>
      </article>
      <article>
        <span>Task condivise</span>
        <strong>{{ vm.stats.sharedCount }}</strong>
      </article>
    </section>

    <section class="section" *ngIf="dashboard() as vm">
      <header class="section__header">
        <div>
          <p class="section__eyebrow">Riprendi il lavoro</p>
          <h3>Bozze recenti</h3>
        </div>
        <a routerLink="/library">Vedi tutto</a>
      </header>

      <div class="grid" *ngIf="vm.recentDrafts.length; else noDrafts">
        <mtab-task-card
          *ngFor="let task of vm.recentDrafts"
          [task]="task"
          (openTask)="openTask($event)"
          (duplicateTask)="duplicateTask($event)"
        />
      </div>
    </section>

    <section class="section" *ngIf="dashboard() as vm">
      <header class="section__header">
        <div>
          <p class="section__eyebrow">Template pronti</p>
          <h3>Partenze consigliate</h3>
        </div>
      </header>

      <div class="grid">
        <mtab-task-card
          *ngFor="let task of vm.seedTemplates"
          [task]="task"
          openLabel="Usa template"
          duplicateLabel="Duplica nel mio spazio"
          (openTask)="startFromTemplate($event)"
          (duplicateTask)="duplicateTask($event)"
        />
      </div>
    </section>

    <ng-template #loading>
      <article class="placeholder">Caricamento dashboard in corso.</article>
    </ng-template>

    <ng-template #noDrafts>
      <article class="placeholder">
        Nessuna bozza recente. Crea una task vuota o parti da un template operativo.
      </article>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: 1rem;
      }

      .hero,
      .stats,
      .section,
      .placeholder {
        border-radius: 1.6rem;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(17, 65, 91, 0.12);
        box-shadow: 0 16px 30px rgba(17, 65, 91, 0.08);
      }

      .hero,
      .section,
      .placeholder {
        padding: 1.2rem;
      }

      .hero {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 1rem;
        background:
          linear-gradient(135deg, rgba(255, 227, 153, 0.28), rgba(191, 219, 254, 0.24)),
          rgba(255, 255, 255, 0.84);
      }

      .hero__eyebrow,
      .section__eyebrow {
        margin: 0 0 0.35rem;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #7c5f3b;
      }

      h2,
      h3,
      p {
        margin: 0;
      }

      .hero__copy {
        margin-top: 0.6rem;
        max-width: 42rem;
        color: #4b5563;
        line-height: 1.55;
      }

      .hero__actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .hero__actions a,
      .hero__actions button {
        min-height: 2.75rem;
        padding: 0 1rem;
        border-radius: 999px;
        text-decoration: none;
        font: inherit;
      }

      .hero__primary {
        border: 0;
        color: #ffffff;
        background: #11415b;
        cursor: pointer;
      }

      .hero__actions a {
        display: inline-flex;
        align-items: center;
        color: #11415b;
        background: rgba(255, 255, 255, 0.9);
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
        gap: 0.8rem;
        padding: 1rem;
      }

      .stats article {
        padding: 0.9rem 1rem;
        border-radius: 1.1rem;
        background: rgba(247, 250, 252, 0.94);
      }

      .stats span {
        display: block;
        color: #6b7280;
        margin-bottom: 0.35rem;
      }

      .stats strong {
        font-size: 1.8rem;
        color: #11415b;
      }

      .section__header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: end;
        margin-bottom: 1rem;
      }

      .section__header a {
        color: #31566b;
        text-decoration: none;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: 1rem;
      }

      .placeholder {
        color: #4b5563;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  private readonly taskLibrary = inject(TaskLibraryService);
  private readonly router = inject(Router);

  protected readonly dashboard = signal<TaskDashboardSummary | null>(null);

  constructor() {
    void this.loadDashboard();
  }

  async createTask(): Promise<void> {
    const created = await firstValueFrom(this.taskLibrary.createDraft());
    await this.router.navigate(['/tasks', created.id]);
  }

  async openTask(task: TaskCardRecord): Promise<void> {
    await this.router.navigate(['/tasks', task.id]);
  }

  async startFromTemplate(task: TaskCardRecord): Promise<void> {
    const created = await firstValueFrom(this.taskLibrary.createDraft({ templateId: task.id }));
    await this.router.navigate(['/tasks', created.id]);
  }

  async duplicateTask(task: TaskCardRecord): Promise<void> {
    const created = await firstValueFrom(this.taskLibrary.duplicateTask(task.id));
    await this.router.navigate(['/tasks', created.id]);
  }

  private async loadDashboard(): Promise<void> {
    this.dashboard.set(await firstValueFrom(this.taskLibrary.getDashboard()));
  }
}
