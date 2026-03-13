alter table taskbuilder.task_analysis_step
    add column if not exists visual_text text,
    add column if not exists symbol_library text,
    add column if not exists symbol_key text,
    add column if not exists symbol_label text;

create table if not exists taskbuilder.task_analysis_step_media (
    id uuid primary key default gen_random_uuid(),
    task_analysis_id uuid not null references taskbuilder.task_analysis (id) on delete cascade,
    task_analysis_step_id uuid references taskbuilder.task_analysis_step (id) on delete set null,
    kind text not null,
    storage_provider text not null,
    storage_bucket text not null,
    storage_key text not null,
    file_name text,
    mime_type text not null,
    file_size_bytes bigint not null,
    width integer,
    height integer,
    alt_text text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint chk_task_analysis_step_media_kind
        check (kind in ('image')),
    constraint chk_task_analysis_step_media_size
        check (file_size_bytes >= 0),
    constraint chk_task_analysis_step_media_width
        check (width is null or width > 0),
    constraint chk_task_analysis_step_media_height
        check (height is null or height > 0)
);

create unique index if not exists ux_task_analysis_step_media_storage_key
    on taskbuilder.task_analysis_step_media (storage_bucket, storage_key);

create index if not exists idx_task_analysis_step_media_task
    on taskbuilder.task_analysis_step_media (task_analysis_id, created_at, id);

create index if not exists idx_task_analysis_step_media_step
    on taskbuilder.task_analysis_step_media (task_analysis_step_id);
