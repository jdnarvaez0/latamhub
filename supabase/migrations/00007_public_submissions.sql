-- Migration 00007: allow public submissions of startups with pending status.
-- Removes the auth requirement so anyone in the community can submit a startup.

drop policy if exists "Authenticated users can submit" on startups;

create policy "Anyone can submit startups"
  on startups for insert
  with check (status = 'pending');
