alter table public.consultation_requests enable row level security;

-- Allow public form submissions when using the anon key.
drop policy if exists "Allow anon inserts for consultation requests" on public.consultation_requests;
create policy "Allow anon inserts for consultation requests"
  on public.consultation_requests
  for insert
  to anon
  with check (true);

-- Optional: allow authenticated users to insert as well.
drop policy if exists "Allow authenticated inserts for consultation requests" on public.consultation_requests;
create policy "Allow authenticated inserts for consultation requests"
  on public.consultation_requests
  for insert
  to authenticated
  with check (true);
