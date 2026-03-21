import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EMPTY_LIBRARY_FILTERS,
  EMPTY_LIBRARY_OPTIONS,
  TaskLibraryFilterOptions,
  TaskLibraryFilters
} from '../../core/tasks/task-library.models';

@Component({
  selector: 'mtab-library-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="filters">
      <label>
        <span>Cerca</span>
        <input [(ngModel)]="model.search" (ngModelChange)="emitChange()" placeholder="Titolo o keyword" />
      </label>

      <label>
        <span>Categoria</span>
        <select [(ngModel)]="model.category" (ngModelChange)="emitChange()">
          <option value="">Tutte</option>
          <option *ngFor="let category of options.categories" [value]="category">{{ category }}</option>
        </select>
      </label>

      <label>
        <span>Contesto</span>
        <select [(ngModel)]="model.context" (ngModelChange)="emitChange()">
          <option value="">Tutti</option>
          <option *ngFor="let context of options.contexts" [value]="context">{{ context }}</option>
        </select>
      </label>

      <label>
        <span>Destinatario</span>
        <select [(ngModel)]="model.targetLabel" (ngModelChange)="emitChange()">
          <option value="">Tutti</option>
          <option *ngFor="let target of options.targetLabels" [value]="target">{{ target }}</option>
        </select>
      </label>

      <label>
        <span>Autore</span>
        <select [(ngModel)]="model.author" (ngModelChange)="emitChange()">
          <option value="">Tutti</option>
          <option *ngFor="let author of options.authors" [value]="author">{{ author }}</option>
        </select>
      </label>

      <label>
        <span>Stato</span>
        <select [(ngModel)]="model.status" (ngModelChange)="emitChange()">
          <option value="">Tutti</option>
          <option *ngFor="let status of options.statuses" [value]="status">{{ status }}</option>
        </select>
      </label>

      <label>
        <span>Supporto</span>
        <select [(ngModel)]="model.supportLevel" (ngModelChange)="emitChange()">
          <option value="">Tutti</option>
          <option *ngFor="let supportLevel of options.supportLevels" [value]="supportLevel">{{ supportLevel }}</option>
        </select>
      </label>

      <button type="button" (click)="reset()">Reset</button>
    </section>
  `,
  styles: [
    `
      .filters {
        display: grid;
        gap: 0.85rem;
        grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
        padding: 1rem;
        border-radius: 1rem;
        background: rgba(var(--pitwriter-bg-surface-rgb), 0.88);
        border: 1px solid var(--pitwriter-border-subtle);
        box-shadow: 0 10px 24px var(--pitwriter-shadow-subtle);
      }

      label {
        display: grid;
        gap: 0.32rem;
      }

      span {
        color: var(--pitwriter-text-muted);
        font-size: 0.84rem;
      }

      input,
      select,
      button {
        min-height: 2.6rem;
        border-radius: 0.7rem;
        border: 1px solid var(--pitwriter-border);
        background: var(--pitwriter-input-bg);
        padding: 0 0.8rem;
        font: inherit;
        color: var(--pitwriter-text);
      }

      button {
        align-self: end;
        cursor: pointer;
        color: var(--pitwriter-text);
        background: var(--pitwriter-bg-surface);
      }

      button:hover {
        background: var(--pitwriter-bg-hover);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryFiltersComponent {
  @Input() set filters(value: TaskLibraryFilters) {
    this.model = { ...value };
  }

  @Input() options: TaskLibraryFilterOptions = EMPTY_LIBRARY_OPTIONS;

  @Output() filtersChange = new EventEmitter<TaskLibraryFilters>();

  protected model: TaskLibraryFilters = { ...EMPTY_LIBRARY_FILTERS };

  protected emitChange(): void {
    this.filtersChange.emit({ ...this.model });
  }

  protected reset(): void {
    this.model = { ...EMPTY_LIBRARY_FILTERS };
    this.emitChange();
  }
}
