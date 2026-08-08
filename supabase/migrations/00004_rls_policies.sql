-- Migration 00004: row level security policies
-- All three tables get RLS. Reads are public for catalog and approved rows.
-- Writes require authentication and (for startups) ownership of the row.

-- Industries: fully public catalog.
create policy "Public read industries"
  on industries for select
  using (true);

-- Startups: anyone can read approved rows.
create policy "Public read approved startups"
  on startups for select
  using (status = 'approved');

-- Authenticated users can submit new startups (status defaults to 'pending').
create policy "Authenticated users can submit"
  on startups for insert
  with check (auth.uid() = submitted_by);

-- Users can update their own pending submissions.
create policy "Users update own pending startups"
  on startups for update
  using (auth.uid() = submitted_by and status = 'pending')
  with check (auth.uid() = submitted_by);

-- Jobs: public can read active jobs from approved startups only.
create policy "Public read active jobs"
  on jobs for select
  using (
    status = 'active'
    and exists (
      select 1
      from startups
      where startups.id = jobs.startup_id
        and startups.status = 'approved'
    )
  );
