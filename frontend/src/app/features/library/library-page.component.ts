import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  EMPTY_LIBRARY_FILTERS,
  EMPTY_LIBRARY_OPTIONS,
  TaskCardRecord,
  TaskLibraryFilterOptions,
  TaskLibraryFilters
} from '../../core/tasks/task-library.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';
import { LibraryFiltersComponent } from './library-filters.component';
import { TaskCardComponent } from './task-card.component';

@Component({
  selector: 'mtab-library-page',
  standalone: true,
  imports: [CommonModule, LibraryFiltersComponent, TaskCardComponent],
  template: `
    <section class="page-header">
      <div>
        <p class="page-header__eyebrow">Libreria task analysis</p>
        <h2>Trova velocemente task, bozze e template gia pronti.</h2>
      </div>
      <button type="button" (click)="createTask()">Nuova task</button>
    </section>

    <mtab-library-filters
      [filters]="filters()"
      [options]="filterOptions()"
      (filtersChange)="updateFilters($event)"
    />

    <section class="results">
      <header class="results__header">
        <strong>{{ items().length }} task</strong>
        <span>Filtri rapidi, riapertura e duplicazione dallo stesso spazio.</span>
      </header>

      <div class="results__grid" *ngIf="items().length; else empty">
        <mtab-task-card
          *ngFor="let task of items()"
          [task]="task"
          [openLabel]="task.status === 'template' ? 'Usa template' : 'Apri'"
          [duplicateLabel]="task.status === 'template' ? 'Duplica nel mio spazio' : 'Copia task'"
          (openTask)="openTask($event)"
          (duplicateTask)="duplicateTask($event)"
        />
      </div>
    </section>

    <ng-template #empty>
      <article class="empty-state">
        Nessun risultato con i filtri correnti. Prova a semplificare la ricerca o crea una nuova task.
      </article>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: 1rem;
      }

      .page-header,
      .results,
      .empty-state {
        border-radius: 1.6rem;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(17, 65, 91, 0.12);
        box-shadow: 0 16px 30px rgba(17, 65, 91, 0.08);
      }

      .page-header,
      .results,
      .empty-state {
        padding: 1.2rem;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: end;
      }

      .page-header__eyebrow {
        margin: 0 0 0.35rem;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #7c5f3b;
      }

      h2,
      p {
        margin: 0;
      }

      button {
        min-height: 2.75rem;
        border-radius: 999px;
        border: 0;
        padding: 0 1rem;
        font: inherit;
        color: #ffffff;
        background: #11415b;
        cursor: pointer;
      }

      .results__header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
        color: #6b7280;
      }

      .results__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: 1rem;
      }

      .empty-state {
        color: #4b5563;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryPageComponent {
  private readonly taskLibrary = inject(TaskLibraryService);
  private readonly router = inject(Router);

  protected readonly filters = signal<TaskLibraryFilters>({ ...EMPTY_LIBRARY_FILTERS });
  protected readonly filterOptions = signal<TaskLibraryFilterOptions>({ ...EMPTY_LIBRARY_OPTIONS });
  protected readonly items = signal<TaskCardRecord[]>([]);

  constructor() {
    void this.loadLibrary();
  }

  async updateFilters(filters: TaskLibraryFilters): Promise<void> {
    this.filters.set(filters);
    await this.loadLibrary();
  }

  async createTask(): Promise<void> {
    const created = await firstValueFrom(this.taskLibrary.createDraft());
    await this.router.navigate(['/tasks', created.id]);
  }

  async openTask(task: TaskCardRecord): Promise<void> {
    if (task.status === 'template') {
      const created = await firstValueFrom(this.taskLibrary.createDraft({ templateId: task.id }));
      await this.router.navigate(['/tasks', created.id]);
      return;
    }

    await this.router.navigate(['/tasks', task.id]);
  }

  async duplicateTask(task: TaskCardRecord): Promise<void> {
    const created = await firstValueFrom(this.taskLibrary.duplicateTask(task.id));
    await this.router.navigate(['/tasks', created.id]);
  }

  private async loadLibrary(): Promise<void> {
    const response = await firstValueFrom(this.taskLibrary.listLibrary(this.filters()));
    this.items.set(response.items);
    this.filterOptions.set(response.availableFilters);
  }
}
