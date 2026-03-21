import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'mtab-task-metadata-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="panel" [formGroup]="form">
      <header class="panel__header">
        <div>
          <p class="panel__eyebrow">Metadata task</p>
          <h3>Definisci gli elementi chiave della task analysis.</h3>
        </div>
      </header>

      <div class="panel__grid">
        <label class="field field--wide">
          <span>Titolo</span>
          <input type="text" formControlName="title" placeholder="Es. Preparare lo zaino" />
        </label>

        <label class="field">
          <span>Categoria</span>
          <input type="text" formControlName="category" placeholder="Routine scolastica" />
        </label>

        <label class="field">
          <span>Target libero</span>
          <input type="text" formControlName="targetLabel" placeholder="Bambino, gruppo, classe" />
        </label>

        <label class="field">
          <span>Difficolta</span>
          <select formControlName="difficultyLevel">
            <option value="">Da definire</option>
            <option *ngFor="let option of difficultyOptions" [value]="option">{{ option }}</option>
          </select>
        </label>

        <label class="field">
          <span>Ambiente</span>
          <input type="text" formControlName="environmentLabel" placeholder="Casa, scuola, palestra" />
        </label>

        <label class="field">
          <span>Visibilita</span>
          <select formControlName="visibility">
            <option value="">Da definire</option>
            <option *ngFor="let option of visibilityOptions" [value]="option">{{ option }}</option>
          </select>
        </label>

        <label class="field">
          <span>Livello di supporto</span>
          <select formControlName="supportLevel">
            <option value="">Da definire</option>
            <option *ngFor="let option of supportLevelOptions" [value]="option">{{ option }}</option>
          </select>
        </label>

        <label class="field field--wide">
          <span>Descrizione</span>
          <textarea formControlName="description" rows="4" placeholder="Obiettivo pratico della task"></textarea>
        </label>
      </div>

      <details class="panel__advanced">
        <summary>Approfondimenti educativi e note team</summary>

        <div class="panel__advanced-grid">
          <label class="field field--wide">
            <span>Obiettivo educativo</span>
            <textarea
              formControlName="educationalObjective"
              rows="3"
              placeholder="Competenze o autonomia che vuoi consolidare"
            ></textarea>
          </label>

          <label class="field field--wide">
            <span>Note professionali</span>
            <textarea
              formControlName="professionalNotes"
              rows="3"
              placeholder="Indicazioni per il team educativo"
            ></textarea>
          </label>
        </div>
      </details>
    </section>
  `,
  styles: [
    `
      .panel {
        display: grid;
        gap: 1rem;
        padding: 1.2rem;
        border-radius: 1rem;
        background: rgba(var(--pitwriter-bg-surface-rgb), 0.88);
        border: 1px solid var(--pitwriter-border-subtle);
        box-shadow: 0 10px 24px var(--pitwriter-shadow-subtle);
      }

      .panel__eyebrow {
        margin: 0 0 0.35rem;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--pitwriter-text-muted-2);
      }

      h3,
      p {
        margin: 0;
      }

      .panel__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
        gap: 0.9rem;
      }

      .field {
        display: grid;
        gap: 0.45rem;
      }

      .field--wide {
        grid-column: 1 / -1;
      }

      .field span {
        font-size: 0.88rem;
        color: var(--pitwriter-text-muted);
      }

      .field input,
      .field select,
      .field textarea {
        width: 100%;
        border-radius: 0.75rem;
        border: 1px solid var(--pitwriter-border);
        background: var(--pitwriter-input-bg);
        padding: 0.82rem 0.95rem;
        font: inherit;
        color: var(--pitwriter-text);
      }

      .field textarea {
        resize: vertical;
      }

      .panel__advanced {
        border-radius: 0.9rem;
        border: 1px solid var(--pitwriter-border-subtle);
        background: var(--pitwriter-bg-surface);
        padding: 0.9rem 1rem;
      }

      .panel__advanced summary {
        cursor: pointer;
        color: var(--pitwriter-text);
        font-weight: 600;
        list-style: none;
      }

      .panel__advanced summary::-webkit-details-marker {
        display: none;
      }

      .panel__advanced-grid {
        display: grid;
        gap: 0.9rem;
        margin-top: 0.9rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskMetadataFormComponent {
  @Input({ required: true }) form!: FormGroup;

  protected readonly difficultyOptions = ['Base', 'Intermedia', 'Avanzata'];
  protected readonly supportLevelOptions = ['Autonomo', 'Visivo', 'Guidato', 'Supportato'];
  protected readonly visibilityOptions = ['private', 'template'];
}
