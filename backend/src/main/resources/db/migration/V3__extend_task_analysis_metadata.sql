alter table taskbuilder.task_analysis
    add column if not exists description text,
    add column if not exists educational_objective text,
    add column if not exists professional_notes text,
    add column if not exists difficulty_level text;

create table if not exists taskbuilder.task_analysis_step (
    id uuid primary key default gen_random_uuid(),
    task_analysis_id uuid not null references taskbuilder.task_analysis (id) on delete cascade,
    position integer not null,
    title text,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint chk_task_analysis_step_position
        check (position >= 0)
);

create index if not exists idx_task_analysis_step_task_position
    on taskbuilder.task_analysis_step (task_analysis_id, position);
