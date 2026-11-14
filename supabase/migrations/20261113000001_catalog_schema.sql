-- Restaurant catalog: restaurants, safety signals, dishes, reviews.
-- Public read-only for the app (anon key). Writes happen through migrations or,
-- later, authenticated policies. Safety facts are "reported", never guarantees.

create table public.restaurants (
  id text primary key,
  google_place_id text not null unique,
  name text not null,
  neighborhood text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  cuisine text not null,
  price smallint not null check (price between 1 and 4),
  -- Hours since midnight in NYC time. hours_close > 24 means past midnight.
  hours_open numeric(4,1) not null,
  hours_close numeric(4,1) not null,
  blurb text not null default '',
  has_gf_beer boolean not null default false,
  has_gf_desserts boolean not null default false,
  sample boolean not null default true
);

create table public.restaurant_safety (
  restaurant_id text primary key references public.restaurants (id) on delete cascade,
  fryer text not null check (fryer in ('dedicated', 'shared', 'no_fryer', 'unknown')),
  kitchen text not null check (kitchen in ('dedicated_gf', 'separate_prep', 'shared', 'unknown')),
  staff_knowledge text not null check (staff_knowledge in ('knowledgeable', 'some', 'unaware', 'unknown')),
  flagged_gf_food boolean not null default false,
  last_confirmed date
);

create table public.dishes (
  id text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  name text not null,
  gf_status text not null check (gf_status in ('gf_as_served', 'can_be_gf', 'not_gf')),
  modification_note text not null default '',
  fried boolean not null default false,
  allergens text[] not null default '{}',
  last_confirmed date not null,
  source text not null default 'seed' check (source in ('seed', 'user'))
);
create index dishes_restaurant_id_idx on public.dishes (restaurant_id);

create table public.reviews (
  id text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  author text not null,
  reviewer_tolerance text not null check (reviewer_tolerance in ('celiac', 'sensitive', 'preference')),
  safety_rating smallint check (safety_rating between 1 and 5),
  taste_rating smallint not null check (taste_rating between 1 and 5),
  text text not null default '',
  date date not null,
  sample boolean not null default true
);
create index reviews_restaurant_id_idx on public.reviews (restaurant_id);

-- Row level security: anyone can read the catalog; nobody can write through the API yet.
alter table public.restaurants enable row level security;
alter table public.restaurant_safety enable row level security;
alter table public.dishes enable row level security;
alter table public.reviews enable row level security;

create policy "catalog is publicly readable" on public.restaurants for select to anon, authenticated using (true);
create policy "catalog is publicly readable" on public.restaurant_safety for select to anon, authenticated using (true);
create policy "catalog is publicly readable" on public.dishes for select to anon, authenticated using (true);
create policy "catalog is publicly readable" on public.reviews for select to anon, authenticated using (true);
