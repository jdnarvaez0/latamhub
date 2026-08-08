-- Migration 00001: industries catalog
-- Prevents inconsistencies like "Fintech" vs "FinTech" vs "Finanzas".
-- RLS is enabled here so the policy file (00004) only has to add policies.

create table industries (
  slug  text primary key,
  label text not null,
  icon  text
);

alter table industries enable row level security;
