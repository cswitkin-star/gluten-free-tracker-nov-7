# Gluten-Free Dining NYC (MVP)

A mobile-first web app that helps people who eat gluten-free find NYC restaurants that fit
their own tolerance, see dish-level GF options, keep a private dining log, and plan group
outings. Built with React, Vite and TypeScript. **Frontend only for now:** no backend, no accounts.

> All restaurants, dishes and reviews are **invented sample data**. Nothing in the app is a
> guarantee of safety. Always confirm with the restaurant.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (match logic, seed data, share links)
npm run typecheck
npm run build
```

## Environment variables

None needed today. `.env.example` lists the keys a future backend would use
(Supabase, Google Places). Put real keys only in a local `.env`, which is git-ignored.

## How it is organized

```
src/
  types.ts          data model (mirrors the planned Postgres tables)
  match/            personal match engine (pure functions, tested)
  data/             CatalogRepo interface, LocalCatalogRepo, seed/ sample data
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
