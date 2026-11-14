-- Per-user private data (profile, saved places, visit log, dish/safety edits,
-- own reviews, groups) stored as one JSON document per signed-in user.
-- Only the owner can read or write their row. Anonymous visitors get nothing.

create table public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_data_size check (octet_length(data::text) < 1000000)
);

alter table public.user_data enable row level security;
revoke all on public.user_data from anon;

create policy "owner can read" on public.user_data
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "owner can insert" on public.user_data
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owner can update" on public.user_data
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owner can delete" on public.user_data
  for delete to authenticated using ((select auth.uid()) = user_id);
