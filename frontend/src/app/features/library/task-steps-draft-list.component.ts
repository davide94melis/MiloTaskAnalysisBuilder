import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskStepDraftRecord } from '../../core/tasks/task-detail.models';
import { TaskStepAuthoringEditorComponent } from './task-step-authoring-editor.component';

@Component({
  selector: 'mtab-task-steps-draft-list',
  standalone: true,
  imports: [CommonModule, TaskStepAuthoringEditorComponent],
  template: `
    <mtab-task-step-authoring-editor
      [steps]="steps"
      [disabled]="disabled"
      (stepsChange)="stepsChange.emit($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskStepsDraftListComponent {
  @Input({ required: true }) steps: readonly TaskStepDraftRecord[] = [];
  @Input() disabled = false;

  @Output() stepsChange = new EventEmitter<TaskStepDraftRecord[]>();
}
