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
        border-radius: 1.35rem;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(17, 65, 91, 0.12);
      }

      label {
        display: grid;
        gap: 0.32rem;
      }

      span {
        color: #6b7280;
        font-size: 0.84rem;
      }

      input,
      select,
      button {
        min-height: 2.6rem;
        border-radius: 1rem;
        border: 1px solid rgba(17, 65, 91, 0.12);
        background: rgba(247, 250, 252, 0.96);
        padding: 0 0.8rem;
        font: inherit;
      }

      button {
        align-self: end;
        cursor: pointer;
        color: #31566b;
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
