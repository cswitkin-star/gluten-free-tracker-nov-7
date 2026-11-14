# Gluten-Free Dining NYC (MVP)

A mobile-first web app that helps people who eat gluten-free find NYC restaurants that fit
their own tolerance, see dish-level GF options, keep a private dining log, and plan group
outings. Built with React, Vite and TypeScript. **Frontend only for now:** no backend, no accounts.

> All restaurants, dishes and reviews are **invented sample data**. Nothing in the app is a
> guarantee of safety. Always confirm with the restaurant.

## What is in the MVP

- Onboarding and a tolerance profile (Celiac / strict, Sensitive, Preference) with optional toggles.
- Discover: map + list, search, cuisine, neighborhood, price and open-now filters, and a personal
  match label (Great for you / Workable / Skip) with a one-line reason.
- Restaurant detail: safety signals kept apart from taste, dish tags (GF as served, can be made GF,
  not GF) with "what to ask for", last-confirmed dates, "Still accurate?", and reviews that show the
  reviewer's tolerance level.
- My list: saved places, a private dining log, pattern hints.
- Group dinners: shortlist builder, a share link, a no-account vote page, and vote merging.
- Order card: a full-screen card for a server, tailored to your profile.

## Known limitations

- Group votes are not live: each friend sends their votes back as a link.
  Share links only work for others once the app is hosted somewhere they can reach (not `localhost`).
- The catalog comes from Supabase, but without an account your own data lives in one browser (localStorage). With an account it syncs between devices.
- Restaurants, dishes, reviews and safety facts are invented samples. Map tiles come from OpenStreetMap.
- Menu parsing with the Claude API and Google Places ingest are not built (they need a backend or keys).

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (match logic, seed data, share links)
npm run typecheck
npm run build
```

## Backend (Supabase)

The restaurant catalog (restaurants, safety signals, dishes, reviews) is read from Supabase.
If the env vars below are missing or the request fails, the app falls back to the bundled
sample data so it always opens.

```bash
cp .env.example .env   # then fill in the two values
```

| Variable | What it is |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL, e.g. `https://<ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The **publishable** key (Project Settings > API). Never the secret/service key. |

`.env` is git-ignored. Restart `npm run dev` after changing it.

Schema and sample data live in `supabase/migrations/` (already applied to the project).
Row level security: the catalog is public **read** only. `user_data` is readable and writable
only by its owner.

### Accounts and sync

Signing in is optional (Profile > Account, email and password). When signed in, your profile,
saved places, visit log, dish and safety edits, own reviews and groups are saved to one private
row in `user_data` and follow you across devices.

- First sign-in on a device merges what is already here with your account. After that, your
  account's copy wins on load, so deletions on another device stick.
- Changes save a moment after you make them. If a save fails, you will see a retry button, and
  signing out refuses to clear the device until your latest changes are saved.
- Email confirmation is a Supabase dashboard setting (Authentication > Providers > Email). With it
  on, new users must click a link before signing in.
- Edits are last-write-wins. Two devices changing the same thing at once can overwrite each other.

Not connected yet: live group voting (votes still return as links).

## How it is organized

```
src/
  types.ts          data model (mirrors the planned Postgres tables)
  match/            personal match engine (pure functions, tested)
  data/             CatalogRepo, local + Supabase implementations, seed/ sample data
  sync/             account sync: merge logic (tested) and the push/pull engine
  store/            local state (persisted in the browser) and merged data hook
  group/            shortlist + share-link encoding
  copy/             all safety wording and disclaimers, in one reviewable place
  lib/              date helpers
```

- Your profile, saved places, visits and edits are stored in this browser's localStorage.
  Clearing site data erases them.
- Group voting works without a server: the shortlist travels inside the share link, and
  friends send their votes back as a reply link. It is not live tallying.

## Going to production later

- Implement `CatalogRepo` against Supabase and swap it in `src/data/index.ts`.
- Add a Google Places ingest for base listings (do not scrape other apps).
- Stretch: use the Claude API to propose dish tags from menus, labeled as suggestions until confirmed.
