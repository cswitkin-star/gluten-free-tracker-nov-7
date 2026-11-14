-- The 100-photo cap in the insert policy counted rows in the same table the policy protects,
-- which made Postgres recurse ("infinite recursion detected in policy"). Enforce the cap
-- with a trigger instead, and keep the policy simple.

drop policy "owner can add" on public.dish_photos;
create policy "owner can add" on public.dish_photos
  for insert to authenticated with check ((select auth.uid()) = user_id);

create function public.enforce_dish_photo_cap()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.dish_photos p where p.user_id = new.user_id) >= 100 then
    raise exception 'Photo limit reached (100)' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- Trigger functions do not need to be callable through the API.
revoke all on function public.enforce_dish_photo_cap() from public, anon, authenticated;

create trigger dish_photos_cap
  before insert on public.dish_photos
  for each row execute function public.enforce_dish_photo_cap();
