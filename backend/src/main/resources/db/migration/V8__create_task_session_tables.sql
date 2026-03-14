create table if not exists taskbuilder.task_session (
    id uuid primary key default gen_random_uuid(),
    task_analysis_id uuid not null references taskbuilder.task_analysis (id) on delete cascade,
    owner_id uuid not null references taskbuilder.user_accounts (id),
    task_share_id uuid references taskbuilder.task_share (id) on delete set null,
    access_context text not null,
    step_count integer not null,
    completed boolean not null default true,
    completed_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    constraint chk_task_session_access_context
        check (access_context in ('owner_present', 'shared_present')),
    constraint chk_task_session_step_count
        check (step_count >= 0),
    constraint chk_task_session_completed_true
        check (completed)
);

create index if not exists idx_task_session_owner_task_completed_at
    on taskbuilder.task_session (owner_id, task_analysis_id, completed_at desc, id desc);

create index if not exists idx_task_session_task_completed_at
    on taskbuilder.task_session (task_analysis_id, completed_at desc, id desc);

create index if not exists idx_task_session_share_completed_at
    on taskbuilder.task_session (task_share_id, completed_at desc, id desc)
    where task_share_id is not null;
