# Proposal: Phase 1 — MVP Colombia (Public Startup Directory)

## Intent

Turn the Phase 0 `/` placeholder into the public directory: anyone discovers approved Colombian startups, filters, searches, opens details. No login, no private actions.

## Scope

**In:** `app/page.tsx` directory (server → `DirectoryClient`); `app/startups/[slug]/page.tsx` detail + `generateMetadata` + not-found; filters (`country/industry/stage/city/search`); `pagination` (8/page, reset on filter change); `empty-state` (empty, Supabase failure, incomplete data); `src/lib/queries.ts`; `use-debounce` (~250ms); `INDUSTRY_LABELS`; SEO (`canonical`, `openGraph`, `noindex` 404); mobile sidebar.

**Out:** auth/dashboards (Phase 2+); `/jobs`, `/ecosystem`, newsletter (404 OK); server `textSearch()` (client substring for 20 rows; flip at >500 per ARCHITECTURE.md §4); OG images, sitemap, robots.txt; test framework — verify: `typecheck` + `build` + manual.

## Capabilities

> `openspec/specs/` is empty — all below are **new**.

### New
- `startup-directory`: public approved-startups list at `/`.
- `startup-detail`: public per-startup page at `/startups/[slug]` with SEO + not-found.
- `startup-filters`: industry, country, city, stage, modality, debounced free-text search.
- `directory-pagination`: numbered pagination, size 8, reset on filter change.
- `directory-states`: empty, Supabase failure, incomplete-data states.

### Modified
- None.

## Approach

**Option C — Hybrid (locked).** Port `StartupRow` + detail-aside from `../colombia-startup-hub/` (link/field remap per exploration); build filters + `StartupGrid`. `queries.ts` ships full future shape; client filters locally. Server: `app/page.tsx` + detail. Client: `DirectoryClient` + filters. 6 chained PRs (≤400 each).

## Affected Areas

- `src/app/page.tsx` — Replaced.
- `src/app/startups/[slug]/page.tsx` + `not-found.tsx` — New.
- `src/components/directory-client.tsx` — New.
- `src/components/filters/*` — New.
- `src/components/{startup-row,startup-grid,pagination,empty-state}.tsx` — New.
- `src/hooks/use-debounce.ts` — New.
- `src/lib/queries.ts` — New.
- `src/lib/constants.ts` — Modified (add `INDUSTRY_LABELS`).

## Risks

- **~1,100–1,500 lines > 800-line budget (High)** — `force-chained` PRs (6 slices, ≤400 each).
- **`StartupGrid` semantics ambiguous** — lock as row-list + count + empty-state.
- **Spanish `plainto_tsquery` partial-word misses** — client `.includes()`; reserve `textSearch` for >500.
- **No test runner** — manual spot check; flag for Phase 2.
- **Coming-soon for BR/CL/AR/MX** — disabled pill + count 0 + tooltip "Próximamente".
- **Unapproved slug leaks data** — query filters `status='approved'`; 404 + `noindex`.

## Rollback Plan

Revert PR (or slice): deletes new files, restores Phase 0 placeholder in `app/page.tsx`. No migrations, no schema changes.

## Dependencies

Supabase `ijqctniftzjerdugfdbp` (`bun run verify-seed`). Phase 0: Supabase clients/middleware, `globals.css` tokens, `types.ts`, `constants.ts`.

## Success Criteria

- `bun run typecheck` + `bun run build` pass per slice.
- `/` renders 20 seeded startups; filters narrow; search debounces ~250ms.
- Pagination numbered (8/page), resets on filter change.
- `/startups/{slug}` renders approved; unknown → 404 + `noindex`; metadata: title, description, canonical, OpenGraph.
- Empty, Supabase failure, incomplete-data states each distinct.
- 375 px mobile usable; `bun run lint` clean; no new deps.

## Assumptions (user-confirmed)

Discovery-only; approved-only, no auth; explicit empty/failure/incomplete states; numbered pagination; technical artifacts in English.
