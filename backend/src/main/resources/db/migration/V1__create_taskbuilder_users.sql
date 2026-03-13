create extension if not exists pgcrypto;

create schema if not exists taskbuilder;

create table if not exists taskbuilder.user_accounts (
    id uuid primary key default gen_random_uuid(),
    milo_user_id uuid not null unique,
    email text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_taskbuilder_user_accounts_email
    on taskbuilder.user_accounts (email);
