-- Migration 00006: enable RLS on startups + jobs and harden moderation policies.
--
-- Root cause of security advisor finding `rls_disabled_in_public`: migration
-- 00001 enabled RLS only on `industries`. Policies for `startups` and `jobs`
-- were created in 00004 but never activated because `enable row level security`
-- was never issued for those tables. In Postgres, policies are inert until RLS
-- is enabled, so both tables were fully public (read/write/delete).

-- 1. Activate RLS on the previously unprotected tables.
alter table startups enable row level security;
alter table jobs enable row level security;

-- 2. Harden the startups policies so an authenticated user cannot bypass
--    moderation by inserting or updating a row with status = 'approved'.
drop policy if exists "Authenticated users can submit" on startups;
create policy "Authenticated users can submit"
  on startups for insert
  with check (auth.uid() = submitted_by and status = 'pending');

drop policy if exists "Users update own pending startups" on startups;
create policy "Users update own pending startups"
  on startups for update
  using (auth.uid() = submitted_by and status = 'pending')
  with check (auth.uid() = submitted_by and status = 'pending');

-- No DELETE policies exist on either table, so with RLS now enabled all
-- anonymous/app write+delete access is blocked (owner/seed retains access).