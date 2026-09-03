# Design: Phase 1 — MVP Colombia (Public Startup Directory)

## Technical Approach

Option C (locked in proposal). The directory is a server `app/page.tsx` that fetches all approved startups via `queries.ts` and hydrates one client island, `DirectoryClient`. **The URL search params are the single source of truth for filter + search + page state** (corrects the prior component-only design, which contradicted `startup-directory`/`directory-pagination` specs — both mandate "the URL reflects the selected filter state"). `DirectoryClient` derives state from `useSearchParams()`, applies a pure isomorphic predicate (`filtering.ts`), and on every change writes the new URL via `router.replace(url, { scroll: false })`. The server fetch is unchanged across filters (in-memory filtering stays correct under ARCHITECTURE.md §4's >500-row threshold); SSR markup matches the URL so there is no hydration mismatch. Industry filter is **multi-select** (matches the spec's "one or more industry values").

## Architecture Decisions

| # | Decision | Choice | Rejected alternative | Rationale |
|---|---|---|---|---|
| 1 | Filter state source | **URL search params = single source of truth**; component state is derived, never primary | Filter state in component state + `?page=N` only | `startup-directory` spec mandates "URL reflects the selected filter state"; shareable/reloadable views; no hydration mismatch (SSR + client both read the same URL). |
| 2 | Industry filter cardinality | **Multi-select checkboxes** (`values: string[]`) | Single-select dropdown | Spec: "filter by one or more industry values"; prototype `industriasSel` parity; `Startup.industry` is a single slug matched against the selected set. |
| 3 | Multi-value URL encoding | Repeated keys `industry=fintech&industry=ai` via `getAll` | Comma-joined `industry=fintech,ai` | HTTP-idiomatic; `URLSearchParams.getAll` reads it natively; slugs are kebab-case (no comma). |
| 4 | URL mutation API | `router.replace(url, { scroll: false })` for all mutations | `router.push` / `window.history` | Filter/pagination are exploration, not navigation destinations — keep history clean; `scroll:false` avoids jump-to-top on filter change. |
| 5 | Page reset on filter change | Any change to `q|industry|country|city|stage|modality` omits `page` (≡ resets to 1) | Keep last page | Specs (`startup-filters`, `directory-pagination`) mandate reset-to-1 on filter/search change. |
| 6 | Unknown/coming-soon values in URL | Dropped on parse (BR/CL/AR/MX, unknown slugs, `city` without matching `country`) | Render partial state | Defensive parse keeps URL authoritative; coming-soon countries can never be set via the UI. |
| 7 | SSR + `useSearchParams` | Wrap `<DirectoryClient>` in `<Suspense>` in `app/page.tsx` | Read params in server component | Next 16 requires Suspense around `useSearchParams` for prerendering (`bun run build`); island derives from URL on both SSR + client → matched markup. |
| 8 | Search path (Phase 1) | Client `.toLowerCase().includes()` over server-fetched array | Server `textSearch('search_vector',…)` | 20 seeded rows → in-memory is O(1); `plainto_tsquery('spanish')` misses partial words ("bog"→"Bogotá"); prototype substring UX wins. `queries.ts` reserves the server signature for >500. |
| 9 | Industry labels | Static `INDUSTRY_LABELS` map in `constants.ts` | Query `industries` table per render | Catalog is migration-locked (DATA_MODEL.md §2.1); avoids per-render round trip. |
| 10 | `StartupGrid` semantics | Row-list + count + empty-state wrapper | 3-column card grid | Prototype is a vertical row list; spec acceptance is row-list parity. |
| 11 | shadcn primitives in Phase 1 | NOT pulled; reuse raw Tailwind utilities (`tag`, `data-label`, `row-hover`) | Install shadcn `button`/`select` | Only `monogram`/`site-nav`/`site-footer` exist; primitives add churn + PR size with no parity gain. |
| 12 | Mobile filter layout | `<details>` disclosure ("Filtros") stacked above the grid on `<md`; same `<FilterPanel/>` as sticky aside on `≥md` | JS drawer / slide-over | Native disclosure → no extra client state; shares one panel component; prototype stacking parity; zero new deps. |
| 13 | Homepage metadata | Explicit `export const metadata` in `app/page.tsx` (directory-specific title/description + canonical `/` + OG `es_CO`) | Rely on root `layout.tsx` metadata | Page metadata overrides layout; makes the live directory's SEO explicit and adds a canonical the root layout lacks. |
| 14 | Error-state retry | Client `DirectoryErrorState` island calling `router.refresh()` | Server-only error page | Server Components can't self-retry; the island is the smallest bridge. |
| 15 | Next 16 `params` | `await params` (Promise) in detail page + `generateMetadata` | Sync access | Next 16 async request APIs (verified: `server.ts` already `await cookies()`). |

## URL Contract

| Param | Cardinality | Encoding | Default | Behaviour |
|---|---|---|---|---|
| `q` | single | URL-encoded string | `""` (omitted) | debounced-text search |
| `industry` | **multi** (repeated) | `industry=<slug>` per value | `[]` (omitted) | startup matches iff its `industry` ∈ set |
| `country` | single | `CO` only live; others disabled | `""` (omitted) | drives `city` option list |
| `city` | single | URL-encoded label | `""` (omitted) | ignored unless valid for selected `country`; clearing `country` clears `city` |
| `stage` | single | enum slug | `""` (omitted) | — |
| `modality` | single | enum slug | `""` (omitted) | — |
| `page` | single | integer ≥ 1 | `1` (omitted) | **reset (omitted) when any other param changes**; clamped to `[1, totalPages]` |

Parsing is single-venue (`parseDirectoryUrl(searchParams): DirectoryFilter`) and validated against `INDUSTRY_LABELS`/`COUNTRY_LABELS`/`STAGE_LABELS`/`MODALITY_LABELS`. Empty/unset = no filter. Unknown or coming-soon values are dropped (URL stays authoritative but harmless).

## Data Flow

```
GET /  (Server Component)
  └─ queries.getApprovedStartups() → Startup[] (RLS hides non-approved; .eq('status','approved') defense-in-depth)
  └─ error? → <DirectoryErrorState/> (client island, router.refresh on retry)
  └─ ok?   → <Suspense fallback={<DirectorySkeleton/>}>
              <DirectoryClient startups={rows}/>   (client island, uses useSearchParams)
            └─ parseDirectoryUrl(searchParams) → DirectoryFilter   (single source of truth)
            └─ useMemo: filterStartups(rows, filter) → visible[]
            └─ slice((page-1)*8, page*8) → pageRows
            └─ <FilterPanel/> <StartupGrid rows pageRows count=visible.length/> <Pagination/>
            └─ onChange any control → buildUrl(nextFilter|nextPage) → router.replace(url,{scroll:false})
                                       (filter change omits `page`; page change keeps other params)

GET /startups/[slug]  (Server Component)
  └─ await params → slug → queries.getStartupBySlug(slug) → Startup | null
     ├─ null → notFound() + not-found.tsx (robots noindex)
     └─ ok → detail + generateMetadata (title/desc/canonical/og)
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/lib/queries.ts` | Create | `getApprovedStartups()`, `getStartupBySlug(slug)`, snake→camel mappers; forward-compat server signatures for `textSearch`/`range`. |
| `src/lib/filtering.ts` | Create | Pure isomorphic `DirectoryFilter`, `parseDirectoryUrl(sp): DirectoryFilter`, `buildDirectoryUrl(filter, page): string`, `filterStartups(rows, filter)`. Used by both SSR + client → one parse venue. |
| `src/lib/constants.ts` | Modify | Add `INDUSTRY_LABELS: Record<string,string>` (industry slug → Spanish label). |
| `src/hooks/use-debounce.ts` | Create | `useDebounce<T>(value, delayMs=250): T`. |
| `src/components/startup-row.tsx` | Create | Port prototype row; null-safe; "No proporcionado" for missing optional fields; `<Link href={`/startups/${slug}`}>`. |
| `src/components/startup-grid.tsx` | Create | Row-list + count + empty-state wrapper (renders `<EmptyState/>` when 0). |
| `src/components/pagination.tsx` | Create | Numbered buttons; current highlight; prev/next disabled at boundaries. |
| `src/components/empty-state.tsx` | Create | Reusable `{ icon, title, hint, action? }`. |
| `src/components/directory-error-state.tsx` | Create | Client island; retry via `router.refresh()`. |
| `src/components/filters/filter-panel.tsx` | Create | Shared panel (all filters + clear); reused by desktop aside + mobile disclosure. |
| `src/components/filters/{country,industry,stage,modality,city-select,search-input}.tsx` | Create | Named controlled filter components. **`industry` = multi-select checkboxes.** `country`: CO live, BR/CL/AR/MX disabled + "Próximamente" tooltip + count 0. `city-select`: disabled unless `country`, options = selected country's cities; clearing `country` clears `city`. `search-input` uses `use-debounce`. |
| `src/components/directory-client.tsx` | Create | `'use client'` island; **derives state from `useSearchParams`** (single source of truth); `useMemo` filter via `filtering.ts`; writes URL via `router.replace({scroll:false})`. |
| `src/app/page.tsx` | Replace | Server: `getApprovedStartups()` try/catch → `<Suspense><DirectoryClient/></Suspense>` or `<DirectoryErrorState/>`; **`export const metadata`** (directory title/description/canonical `/`/OG `es_CO`). |
| `src/app/startups/[slug]/page.tsx` | Create | Server + async `generateMetadata`; `await params`; `notFound()` on null. |
| `src/app/startups/[slug]/not-found.tsx` | Create | 404 + `robots:{index:false}`. |

## Interfaces / Contracts

```ts
// filtering.ts — isomorphic, pure, no 'use client'
export interface DirectoryFilter {
  q: string;
  industry: string[];          // multi; [] = no filter
  country: Country | null;     // CO only live in Phase 1
  city: string | null;
  stage: Stage | null;
  modality: Modality | null;
  page: number;               // ≥1
}
export function parseDirectoryUrl(sp: URLSearchParams | ReadonlyURLSearchParams): DirectoryFilter;
export function buildDirectoryUrl(filter: DirectoryFilter): string;   // omits page when 1, omits empty filters
export function filterStartups(rows: Startup[], filter: DirectoryFilter): Startup[];

// directory-client.tsx — 'use client'
export function DirectoryClient({ startups }: { startups: Startup[] });

// filters — controlled, single-value or multi-value
type Option = { value: string; label: string; count: number; disabled?: boolean };
<CountryFilter   value={country}   options={Option[]}            onChange={...} />
<IndustryFilter  values={string[]} options={Option[]}            onChange={...} />   // multi-select
<StageFilter     value={stage}     options={Option[]}            onChange={...} />
<ModalityFilter  value={modality}  options={Option[]}            onChange={...} />
<CitySelect      value={city}      options={Option[]}            disabled={!country} onChange={...} />
<SearchInput     value={q}                                       onChange={...} />   // use-debounce inside

// queries.ts — server-only
export type DirectoryQuery = { ok: true; startups: Startup[] } | { ok: false; error: string };
export function getApprovedStartups(): Promise<DirectoryQuery>;
export function getStartupBySlug(slug: string): Promise<Startup | null>;

// use-debounce.ts
export function useDebounce<T>(value: T, delayMs = 250): T;
```

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit | — | No test runner (testing-capabilities). Deferred to Phase 2 (Vitest + RTL). |
| Type | All new code | `bun run typecheck` (strict) per slice — primary automated gate. |
| Build | Production render | `bun run build` (Turbopack) per slice — catches RSC/client-boundary + `useSearchParams` Suspense + `generateMetadata` errors. |
| Lint | Style/regressions | `bun run lint` (eslint flat, next/core-web-vitals + typescript). |
| Manual E2E | Acceptance scenarios | Spot-check: `/` 20 rows; filters narrow + **URL updates + reload restores state**; search debounces ~250ms; pagination 8/8/4 + reset on filter change; `?industry=a&industry=b` multi-select; `/startups/{slug}` approved renders + unknown 404/noindex; three distinct states; 375px mobile `<details>` filter disclosure; BR/CL/AR/MX disabled "Próximamente". |

No test framework is added in Phase 1 (proposal scope-out).

## Migration / Rollout

No DB migration, no schema change, no feature flag. RLS already hides non-approved; only the anon key is used. Rollout = merge chained PRs to `main`; Vercel auto-deploy. **Rollback**: revert the offending PR (or slice) — deletes new files, restores the Phase 0 placeholder in `app/page.tsx`, reverts the `INDUSTRY_LABELS` line in `constants.ts`. Slices are independent and each reversible on its own.

## Delivery Forecast (force-chained, 800-line review budget)

Session delivery strategy is **force-chained**; review budget is **800 changed lines** per PR. Estimated ~1,100–1,500 added lines → 6 chained slices, each ≤400 lines:

1. `queries.ts` + `INDUSTRY_LABELS` + `use-debounce` + `filtering.ts` (URL contract + isomorphic predicate).
2. `startup-row` + `startup-grid` + `pagination` + `empty-state` (presentational).
3. Filter family: `country` (**incl. coming-soon disabled + "Próximamente" tooltip**), `industry` (**multi-select**), `stage`, `modality`, `city-select`, `search-input` + `filter-panel` (**incl. mobile `<details>` disclosure**).
4. `directory-client` (URL-as-source-of-truth island) + `directory-error-state` + `app/page.tsx` wiring (**`<Suspense>` + homepage `metadata` export**).
5. `app/startups/[slug]/page.tsx` + `not-found.tsx` + `generateMetadata` (detail SEO: title/desc/canonical/OG + `noindex` 404).
6. Cross-route SEO/canonical consistency sweep + `lint`/`typecheck`/`build` regression closure (≤250 lines; autonomous, rollback-safe).

- **Decision needed before apply**: No (force-chained locked).
- **Chained PRs recommended**: Yes.
- **800-line budget risk**: High → 6 slices.

Slice 6's prior heterogeneity (SEO + coming-soon badge + mobile verification + lint) is sharpened: coming-soon now lives in Slice 3 (with `country`), mobile behaviour in Slice 3 (with the panel), homepage metadata in Slice 4, detail SEO in Slice 5. Slice 6 is homogeneous final quality-gate closure.

## Phase Boundaries

- **In**: public approved directory; URL-synced filters (incl. multi-select industry) + debounced search; numbered pagination + reset; distinct empty/error/incomplete states; detail page + SEO + not-found; homepage metadata.
- **Out (explicit)**: auth/dashboards (Phase 2+); `/jobs` & `/ecosystem` routes (404 acceptable); newsletter; server `textSearch()` (Phase 4+ at >500 rows); OG image generation, sitemap, robots.txt; test framework; `getRelatedStartups` (reserved, not built).

## Open Questions

- [ ] `getRelatedStartups` for the detail page: defer entirely to Phase 4, or ship a minimal same-industry list now? (Recommendation: defer.)
- [ ] Confirm `router.replace` (not `push`) for all filter/page mutations — i.e., the back button leaves the directory rather than replaying filters. (Recommendation: `replace`.)

## State Artifact

A hybrid DAG state artifact is bootstrapped at `openspec/changes/phase-1-mvp/state.yaml` (+ Engram topic `sdd/phase-1-mvp/state`) in this correction pass to unblock compaction recovery, because the prior pass shipped without it. Per `persistence-contract.md §State Persistence`, **ongoing phase-transition state is owned by the orchestrator**; this file is an emergency bootstrap and the orchestrator must update it on every subsequent phase transition.