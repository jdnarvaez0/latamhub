-- Migration 00003: jobs (vacancies)
-- Cascade FK so deleting a startup removes its jobs.

create table jobs (
  id           uuid primary key default gen_random_uuid(),
  startup_id   uuid not null references startups(id) on delete cascade,
  title        text not null,
  area         text,
  location     text,
  modality     text not null default 'onsite',
  salary_range text,
  apply_url    text not null,
  status       text not null default 'active',
  created_at   timestamptz not null default now()
);

create index idx_jobs_startup on jobs(startup_id);
create index idx_jobs_status  on jobs(status);
