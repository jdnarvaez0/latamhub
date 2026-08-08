-- Migration 00002: startups table
-- Main entity of the directory. Includes full-text search (tsvector) and an
-- updated_at trigger so any change refreshes the timestamp.

create table startups (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text unique not null,
  description      text not null,
  long_description text,
  logo_url         text,
  website          text,
  linkedin_url     text,

  country          text not null,
  city             text,

  industry         text not null references industries(slug),
  stage            text,
  founded_year     int,
  employee_range   text,

  investors        jsonb not null default '[]'::jsonb,

  status           text not null default 'pending',
  submitted_by     uuid references auth.users(id),

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  search_vector    tsvector generated always as (
    to_tsvector(
      'spanish',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(city, '')
    )
  ) stored
);

create index idx_startups_country  on startups(country);
create index idx_startups_industry on startups(industry);
create index idx_startups_status   on startups(status);
create index idx_startups_slug     on startups(slug);
create index idx_startups_search   on startups using gin(search_vector);

-- Auto-bump updated_at on row changes.
create or replace function update_modified_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_startups_updated_at
  before update on startups
  for each row
  execute function update_modified_column();
