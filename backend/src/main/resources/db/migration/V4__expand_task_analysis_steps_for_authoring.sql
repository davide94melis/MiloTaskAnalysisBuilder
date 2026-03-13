alter table taskbuilder.task_analysis_step
    add column if not exists required boolean not null default true,
    add column if not exists support_guidance text,
    add column if not exists reinforcement_notes text,
    add column if not exists estimated_minutes integer;

alter table taskbuilder.task_analysis_step
    drop constraint if exists chk_task_analysis_step_estimated_minutes;

alter table taskbuilder.task_analysis_step
    add constraint chk_task_analysis_step_estimated_minutes
        check (estimated_minutes is null or estimated_minutes >= 0);
