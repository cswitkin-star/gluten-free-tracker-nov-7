-- Private dish photos. Each photo belongs to the signed-in user who uploaded it and is
-- only visible to them (no moderation exists yet, so nothing is public).
-- Files live in the private `dish-photos` bucket under "<user id>/<random>.jpg".
-- The app re-encodes every image to JPEG in the browser, which also strips EXIF/location data.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dish-photos', 'dish-photos', false, 5242880, array['image/jpeg']);

create policy "photos owner can read" on storage.objects
  for select to authenticated
  using (bucket_id = 'dish-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "photos owner can upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dish-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "photos owner can delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dish-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create table public.dish_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  -- Not a foreign key: dishes you add yourself only exist in your own data.
  dish_id text not null,
  path text not null unique,
  created_at timestamptz not null default now(),
  constraint dish_photos_path_owner check (path like user_id::text || '/%')
);
create index dish_photos_user_restaurant_idx on public.dish_photos (user_id, restaurant_id);

alter table public.dish_photos enable row level security;
revoke all on public.dish_photos from anon;

create policy "owner can read" on public.dish_photos
  for select to authenticated using ((select auth.uid()) = user_id);
-- Also caps each person at 100 photos.
create policy "owner can add" on public.dish_photos
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select count(*) from public.dish_photos p where p.user_id = (select auth.uid())) < 100
  );
create policy "owner can delete" on public.dish_photos
  for delete to authenticated using ((select auth.uid()) = user_id);
