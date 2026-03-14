create table if not exists taskbuilder.task_share (
    id uuid primary key default gen_random_uuid(),
    task_analysis_id uuid not null references taskbuilder.task_analysis (id) on delete cascade,
    owner_id uuid not null references taskbuilder.user_accounts (id),
    access_mode text not null,
    share_token text not null,
    active boolean not null default true,
    revoked_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint chk_task_share_access_mode
        check (access_mode in ('view', 'present'))
);

create unique index if not exists uq_task_share_token
    on taskbuilder.task_share (share_token);

create unique index if not exists uq_task_share_active_mode
    on taskbuilder.task_share (task_analysis_id, access_mode)
    where active;

create index if not exists idx_task_share_owner_task_created_at
    on taskbuilder.task_share (owner_id, task_analysis_id, created_at desc);
