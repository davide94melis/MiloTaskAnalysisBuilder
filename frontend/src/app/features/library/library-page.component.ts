import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  EMPTY_LIBRARY_FILTERS,
  EMPTY_LIBRARY_OPTIONS,
  TaskCardRecord,
  TaskLibraryFilterOptions,
  TaskLibraryFilters,
  TaskVariantRole
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
        <p class="page-header__copy">
          Filtra, riapri e duplica dalla stessa vista. Il livello di supporto resta il segnale principale per
          orientarti tra task singole e famiglie variante.
        </p>
      </div>
      <button type="button" (click)="createTask()">Crea nuova task</button>
    </section>

    <mtab-library-filters
      [filters]="filters()"
      [options]="filterOptions()"
      (filtersChange)="updateFilters($event)"
    />

    <section class="results">
      <header class="results__header">
        <strong>{{ orderedItems().length }} task</strong>
        <span>{{ familySummary() }}</span>
      </header>

      <div class="results__grid" *ngIf="orderedItems().length; else empty">
        <mtab-task-card
          *ngFor="let task of orderedItems()"
          [task]="task"
          [openLabel]="task.status === 'template' ? 'Usa template' : 'Apri'"
          [duplicateLabel]="task.status === 'template' ? 'Duplica nel mio spazio' : 'Copia task'"
          [showCreateVariant]="task.status !== 'template'"
          (openTask)="openTask($event)"
          (duplicateTask)="duplicateTask($event)"
          (createVariant)="createVariant($event)"
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

      .page-header__copy {
        margin-top: 0.45rem;
        max-width: 42rem;
        color: #4b5563;
        line-height: 1.5;
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
  protected readonly orderedItems = computed(() => orderLibraryItems(this.items()));
  protected readonly familySummary = computed(() => {
    const familyCards = this.orderedItems().filter((task) => variantRole(task) !== 'standalone');
    if (!familyCards.length) {
      return 'Filtri rapidi, riapertura e duplicazione dallo stesso spazio.';
    }

    const familyRoots = new Set(familyCards.map((task) => familyGroupKey(task))).size;
    return `${familyRoots} famiglie variante visibili. Il supporto resta il primo indizio, senza togliere velocita al flusso.`;
  });

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

  async createVariant(task: TaskCardRecord): Promise<void> {
    const requestedSupportLevel = window.prompt(
      `Livello di supporto per la variante di "${task.title}"`,
      task.supportLevel || ''
    );
    const supportLevel = requestedSupportLevel?.trim();

    if (!supportLevel) {
      return;
    }

    const created = await firstValueFrom(
      this.taskLibrary.createVariant(task.id, {
        supportLevel
      })
    );
    await this.router.navigate(['/tasks', created.id]);
  }

  private async loadLibrary(): Promise<void> {
    const response = await firstValueFrom(this.taskLibrary.listLibrary(this.filters()));
    this.items.set(response.items);
    this.filterOptions.set(response.availableFilters);
  }
}

function orderLibraryItems(items: TaskCardRecord[]): TaskCardRecord[] {
  return [...items].sort((left, right) => {
    const leftGroupTitle = (left.variantRootTitle || left.title || '').toLocaleLowerCase();
    const rightGroupTitle = (right.variantRootTitle || right.title || '').toLocaleLowerCase();
    const titleCompare = leftGroupTitle.localeCompare(rightGroupTitle, 'it', { sensitivity: 'base' });
    if (titleCompare !== 0) {
      return titleCompare;
    }

    const familyCompare = familyGroupPriority(left) - familyGroupPriority(right);
    if (familyCompare !== 0) {
      return familyCompare;
    }

    const roleCompare = familyRolePriority(variantRole(left)) - familyRolePriority(variantRole(right));
    if (roleCompare !== 0) {
      return roleCompare;
    }

    const supportCompare = (left.supportLevel || '').localeCompare(right.supportLevel || '', 'it', {
      sensitivity: 'base'
    });
    if (supportCompare !== 0) {
      return supportCompare;
    }

    return (right.lastUpdatedAt || '').localeCompare(left.lastUpdatedAt || '');
  });
}

function familyGroupPriority(task: TaskCardRecord): number {
  return variantRole(task) === 'standalone' ? 1 : 0;
}

function familyRolePriority(role: TaskVariantRole): number {
  switch (role) {
    case 'root':
      return 0;
    case 'variant':
      return 1;
    default:
      return 2;
  }
}

function familyGroupKey(task: TaskCardRecord): string {
  return task.variantRootTaskId || task.variantFamilyId || task.id;
}

function variantRole(task: TaskCardRecord): TaskVariantRole {
  return task.variantRole ?? 'standalone';
}
