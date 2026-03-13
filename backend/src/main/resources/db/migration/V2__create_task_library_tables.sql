create table if not exists taskbuilder.task_analysis (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid references taskbuilder.user_accounts (id),
    source_task_id uuid references taskbuilder.task_analysis (id),
    title text not null,
    category text,
    target_label text,
    support_level text,
    context_label text,
    status text not null,
    visibility text not null,
    step_count integer not null default 0,
    author_name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint chk_task_analysis_status
        check (status in ('draft', 'template')),
    constraint chk_task_analysis_visibility
        check (visibility in ('private', 'template'))
);

create index if not exists idx_task_analysis_owner_id
    on taskbuilder.task_analysis (owner_id);

create index if not exists idx_task_analysis_status_updated_at
    on taskbuilder.task_analysis (status, updated_at desc);

create index if not exists idx_task_analysis_filters
    on taskbuilder.task_analysis (category, context_label, target_label, support_level);

insert into taskbuilder.task_analysis (
    id,
    owner_id,
    source_task_id,
    title,
    category,
    target_label,
    support_level,
    context_label,
    status,
    visibility,
    step_count,
    author_name
)
select
    gen_random_uuid(),
    null,
    null,
    seed.title,
    seed.category,
    seed.target_label,
    seed.support_level,
    seed.context_label,
    'template',
    'template',
    seed.step_count,
    'Milo'
from (
    values
        ('Lavarsi le mani', 'Autonomia personale', 'Bambino', 'Guidato', 'Bagno', 6),
        ('Preparare lo zaino', 'Routine scolastica', 'Classe', 'Supportato', 'Casa', 7),
        ('Routine del mattino', 'Routine quotidiana', 'Bambino', 'Visivo', 'Casa', 8)
) as seed(title, category, target_label, support_level, context_label, step_count)
where not exists (
    select 1
    from taskbuilder.task_analysis existing
    where existing.title = seed.title
      and existing.status = 'template'
);
