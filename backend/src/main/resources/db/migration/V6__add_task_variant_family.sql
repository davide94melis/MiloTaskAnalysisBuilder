alter table taskbuilder.task_analysis
    add column if not exists variant_family_id uuid references taskbuilder.task_analysis (id);

create index if not exists idx_task_analysis_variant_family_id
    on taskbuilder.task_analysis (variant_family_id);

create index if not exists idx_task_analysis_owner_variant_family_updated_at
    on taskbuilder.task_analysis (owner_id, variant_family_id, updated_at desc);
