-- Enable required extension for UUID generation
create extension if not exists "pgcrypto";

-- Emails table
create table if not exists public.emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

-- Enable Row Level Security
alter table public.emails enable row level security;

-- Allow anonymous inserts (for your public site form)
create policy "Allow insert for anon"
  on public.emails
  for insert
  with check (auth.role() = 'anon');

-- (Optional) Allow authenticated users to view records
create policy "Allow select for authenticated"
  on public.emails
  for select
  using (auth.role() = 'authenticated');
