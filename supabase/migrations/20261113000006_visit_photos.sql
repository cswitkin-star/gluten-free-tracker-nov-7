-- Private photos attached to a logged visit. Same rules as dish photos: only the owner
-- can see them, files live in the private `dish-photos` bucket under "<user id>/", and
-- images are re-encoded to JPEG (metadata removed) in the app before upload.
-- Visits themselves live in the user's own data document, so visit_id is not a foreign key.

create table public.visit_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  visit_id text not null,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  path text not null unique,
  created_at timestamptz not null default now(),
  constraint visit_photos_path_owner check (path like user_id::text || '/%')
);
create index visit_photos_user_visit_idx on public.visit_photos (user_id, visit_id);

alter table public.visit_photos enable row level security;
revoke all on public.visit_photos from anon;

create policy "owner can read" on public.visit_photos
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "owner can add" on public.visit_photos
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owner can delete" on public.visit_photos
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Caps: 6 photos per visit, 100 per person. (A trigger, not a policy, to avoid policy recursion.)
create function public.enforce_visit_photo_cap()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.visit_photos p where p.user_id = new.user_id and p.visit_id = new.visit_id) >= 6 then
    raise exception 'Visit photo limit reached (6)' using errcode = 'check_violation';
  end if;
  if (select count(*) from public.visit_photos p where p.user_id = new.user_id) >= 100 then
    raise exception 'Photo limit reached (100)' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_visit_photo_cap() from public, anon, authenticated;

create trigger visit_photos_cap
  before insert on public.visit_photos
  for each row execute function public.enforce_visit_photo_cap();
