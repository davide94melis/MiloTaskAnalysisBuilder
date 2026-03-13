import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TaskCardRecord } from '../../core/tasks/task-library.models';
import { TaskLibraryService } from '../../core/tasks/task-library.service';

@Component({
  selector: 'mtab-task-shell-editor-entry',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="entry" *ngIf="task() as currentTask; else loading">
      <p class="entry__eyebrow">Task shell pronta</p>
      <h2>{{ currentTask.title }}</h2>
      <p class="entry__copy">
        La task e stata creata o riaperta correttamente. Questa schermata mantiene stabile
        l'handoff verso la fase 3, dove arriveranno metadata completi e editor step-by-step.
      </p>

      <dl class="entry__facts">
        <div>
          <dt>Categoria</dt>
          <dd>{{ currentTask.category || 'Da definire' }}</dd>
        </div>
        <div>
          <dt>Supporto</dt>
          <dd>{{ currentTask.supportLevel || 'Da definire' }}</dd>
        </div>
        <div>
          <dt>Contesto</dt>
          <dd>{{ currentTask.contextLabel || 'Da definire' }}</dd>
        </div>
        <div>
          <dt>Stato</dt>
          <dd>{{ currentTask.status }}</dd>
        </div>
      </dl>

      <div class="entry__actions">
        <a routerLink="/library">Torna alla libreria</a>
        <button type="button" (click)="duplicateTask()">Duplica task</button>
      </div>
    </section>

    <ng-template #loading>
      <article class="entry entry--loading">Caricamento task in corso.</article>
    </ng-template>
  `,
  styles: [
    `
      .entry {
        padding: 1.2rem;
        border-radius: 1.6rem;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(17, 65, 91, 0.12);
        box-shadow: 0 16px 30px rgba(17, 65, 91, 0.08);
      }

      .entry__eyebrow {
        margin: 0 0 0.35rem;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #7c5f3b;
      }

      h2,
      p,
      dl,
      dt,
      dd {
        margin: 0;
      }

      .entry__copy {
        margin-top: 0.65rem;
        max-width: 48rem;
        line-height: 1.55;
        color: #4b5563;
      }

      .entry__facts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
        gap: 0.8rem;
        margin-top: 1rem;
      }

      .entry__facts div {
        padding: 0.9rem;
        border-radius: 1.1rem;
        background: rgba(247, 250, 252, 0.96);
      }

      dt {
        color: #6b7280;
        font-size: 0.82rem;
      }

      dd {
        margin-top: 0.2rem;
      }

      .entry__actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-top: 1rem;
      }

      .entry__actions a,
      .entry__actions button {
        min-height: 2.75rem;
        border-radius: 999px;
        padding: 0 1rem;
        font: inherit;
        text-decoration: none;
      }

      .entry__actions a {
        display: inline-flex;
        align-items: center;
        background: rgba(247, 250, 252, 0.96);
        color: #31566b;
      }

      .entry__actions button {
        border: 0;
        background: #11415b;
        color: #ffffff;
        cursor: pointer;
      }

      .entry--loading {
        color: #4b5563;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskShellEditorEntryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskLibrary = inject(TaskLibraryService);

  protected readonly task = signal<TaskCardRecord | null>(null);

  constructor() {
    void this.loadTask();
  }

  async duplicateTask(): Promise<void> {
    const currentTask = this.task();
    if (!currentTask) {
      return;
    }

    const duplicated = await firstValueFrom(this.taskLibrary.duplicateTask(currentTask.id));
    await this.router.navigate(['/tasks', duplicated.id]);
  }

  private async loadTask(): Promise<void> {
    const taskId = this.route.snapshot.paramMap.get('taskId');
    if (!taskId) {
      const created = await firstValueFrom(this.taskLibrary.createDraft());
      this.task.set(created);
      await this.router.navigate(['/tasks', created.id], { replaceUrl: true });
      return;
    }

    this.task.set(await firstValueFrom(this.taskLibrary.getTask(taskId)));
  }
}
