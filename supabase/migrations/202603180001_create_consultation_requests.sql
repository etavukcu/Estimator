create table if not exists public.consultation_requests (
  id bigint generated always as identity primary key,
  full_name text not null,
  phone text not null,
  email text not null,
  preferred_callback_time text,
  project_address text,
  notes text,
  estimate_summary jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists consultation_requests_created_at_idx
  on public.consultation_requests (created_at desc);
