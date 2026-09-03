# Tasks: Phase 1 — MVP Colombia (Public Startup Directory)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,100–1,500 total; 7 slices ≤800 each |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 7 chained slices (see below) |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

```
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

> **Chain strategy locked to `stacked-to-main`.** Each PR targets `main` after the previous PR merges (or, during stacking, the previous PR's branch). Work Unit 1 = PR 1, base = `main`. Work Unit 2 = PR 2, base = `main` after PR #1 merge (`533a25c`).

---

## Suggested Work Units

| Unit | Goal | Slice PR | Base | Verification |
|------|------|----------|------|-------------|
| 1 | Infrastructure foundation (queries, filtering, constants, hooks) | PR 1 | `main` | `bun run lint && bun run typecheck && bun run build` |
| 2 | Presentational components (row, grid, pagination, empty-state) | PR 2 | `main` | same gates |
| 3A | Core filters (country, industry, stage, modality) | PR 3A | `main` | same gates |
| 3B | City, search, filter panel, and mobile disclosure | PR 3B | `main` after PR 3A | same gates |
| 4 | DirectoryClient island + homepage (`<Suspense>` + metadata export) | PR 4 | `main` after PR 3B | same gates |
| 5 | Detail page (`/startups/[slug]`) + SEO + not-found | PR 5 | `main` | same gates |
| 6 | SEO canonical consistency + quality-gate closure | PR 6 | `main` | same gates |

Each slice: clear start → clear finish → autonomous scope → `bun run lint && bun run typecheck && bun run build` → rollback = revert PR.

---

## Phase 1: Infrastructure (Unit 1)

- [x] 1.1 Create `src/lib/queries.ts` — `getApprovedStartups()` (server, fetches all approved), `getStartupBySlug(slug)` (server), snake→camel mappers; reserve `textSearch()` and range-query signatures for >500-row threshold (Phase 4+)
- [x] 1.2 Create `src/lib/filtering.ts` — Isomorphic `DirectoryFilter` type `{q,industry:string[],country,city,stage,modality,page}`, `parseDirectoryUrl(searchParams)`, `buildDirectoryUrl(filter)`, `filterStartups(rows, filter)`; **single parse venue for SSR + client** (prevents hydration mismatch); multi-select industry via `URLSearchParams.getAll`
- [x] 1.3 Modify `src/lib/constants.ts` — Add `INDUSTRY_LABELS: Record<string, string>` (slug→Spanish label map; catalog is migration-locked, no per-render round-trip)
- [x] 1.4 Create `src/hooks/use-debounce.ts` — `useDebounce<T>(value: T, delay: 250ms)`

**Verification**: `bun run lint && bun run typecheck && bun run build`  
**Rollback**: delete new files; no schema changes needed

---

## Phase 2: Presentational Components (Unit 2)

- [x] 2.1 Create `src/components/startup-row.tsx` — Port from prototype; null-safe display; `Link` to `/startups/[slug]`; shows: logo, name, industry, stage, city, jobs count
- [x] 2.2 Create `src/components/startup-grid.tsx` — Row-list layout (not 3-col grid); wraps `startup-row`; shows "X resultados" count; renders `empty-state` when rows=0
- [x] 2.3 Create `src/components/pagination.tsx` — Numbered page buttons (1–N); highlights current page; disables prev on page 1, next on last page; each button updates `page` URL param via `buildDirectoryUrl`
- [x] 2.4 Create `src/components/empty-state.tsx` — Reusable `{icon,title,hint,action?}` component for distinct empty/error/incomplete states

**Verification**: `bun run lint && bun run typecheck && bun run build`  
**Rollback**: delete component files

#### Unit 2 Handoff Note — `<Pagination/>` uses `buildHref(page)`, not `buildDirectoryUrl`

Task 2.3's wording says each button "updates `page` URL param via `buildDirectoryUrl`", but the
implemented `src/components/pagination.tsx` does **not** import `buildDirectoryUrl`. Instead it
takes a `buildHref: (page: number) => string` callback prop and renders real
`<Link href={buildHref(p)} replace scroll={false}>` elements.

**Why this preserves URL SSOT (it is intentional, not a deviation):**

- The component stays decoupled from the filter contract. It receives only `currentPage`,
  `totalPages`, and the URL builder — never `DirectoryFilter`, `useSearchParams`, or
  `buildDirectoryUrl` itself.
- The parent (`DirectoryClient`, Unit 4) remains the single venue that calls
  `buildDirectoryUrl`. The recommended wiring is:
  ```tsx
  <Pagination
    currentPage={filter.page}
    totalPages={totalPages}
    buildHref={(page) => buildDirectoryUrl({ ...filter, page }, pathname)}
  />
  ```
- `<Link replace scroll={false}>` is exactly `router.replace(url, { scroll: false })` from the
  design's data-flow (decision §4) — encoded directly in the Link props, not via a parent-side
  callback. Same effect, smaller parent, no hydration risk.
- SEO + a11y wins: real `href`s in the markup (crawlable, right-click "open in new tab",
  screen-reader announced as links) versus a button + `onPageChange` that goes through the
  parent's `router.replace` would lose.

**What the component does NOT do** (left to Unit 4): it does not read `useSearchParams`, does
not slice or paginate, does not own URL mutation policy beyond the per-Link `replace` +
`scroll={false}` props. If Unit 4 forgets to pass `buildHref`, the `<Link>` renders
`href={undefined}` and Next.js fails the build — caught at compile time.

Reference: see `src/components/pagination.tsx` docblock and the Unit 2 apply-progress
observation (`sdd/phase-1-mvp/apply-progress`) for the full design rationale.

---

## Phase 3: Filter Family + Mobile Behavior (Unit 3)

- [x] 3.1 Create `src/components/filters/country-filter.tsx` — Radio/checkgroup; CO active; **BR/CL/AR/MX disabled + "Próximamente" tooltip + count 0**; onChange calls `buildDirectoryUrl` (clears city when country changes)
- [x] 3.2 Create `src/components/filters/industry-filter.tsx` — **Multi-select checkboxes**; `values: string[]` prop; each checkbox toggles its slug in the array; renders via `INDUSTRY_LABELS`; URL encoding: repeated `industry=<slug>` keys
- [x] 3.3 Create `src/components/filters/stage-filter.tsx` — Single-select; `STAGE_LABELS` display
- [x] 3.4 Create `src/components/filters/modality-filter.tsx` — Single-select; `MODALITY_LABELS` display
- [x] 3.5 Create `src/components/filters/city-select.tsx` — **Disabled unless country=CO**; city options derived from current country; cleared when country cleared. Implemented with a native `<select>` and a `__all__` sentinel value (`<select>` cannot represent `null` directly). Disabled state fuses the parent's `disabled` signal with the empty-options defense (`disabled || options.length === 0`). The "Selecciona un país para filtrar por ciudad." hint is rendered via `aria-describedby` and only when the control is disabled. The currently-selected city stays visible in the disabled state so the URL is never "lost" between filter changes.
- [x] 3.6 Create `src/components/filters/search-input.tsx` — Text input; debounced via `useDebounce` (~250ms); `useCallback` stable reference. Internal `draft` state mirrors the visible input; `useDebounce(draft, 250)` produces the parent-facing value. A `lastValueRef` guard plus a `isInitialMount` skip avoid the parent-update / re-sync feedback loop and the redundant `router.replace` on a reload. The `<input>` carries a `sr-only` visible label ("Buscar en el directorio") so screen readers can name the control, and a `sr-only` description noting the debounce. The `delayMs` is exposed as a prop (default 250 — the design's locked value).
- [x] 3.7 Create `src/components/filters/filter-panel.tsx` — Composes all filter sub-components; desktop: sticky aside; **mobile (<md): `<details>` disclosure stacked above grid; mobile uses same FilterPanel** (not a separate component). One `<details>` element with the `<summary>` `md:hidden` hides the disclosure chrome on desktop and lets the browser own the toggle on mobile. Page reset (design §5: any `q | industry | country | city | stage | modality` change omits `page`) is centralized in the `applyChange(patch)` helper that every `onChange` flows through. Country cascade (spec "Visitor clears country selection → city filter is also cleared") is centralized in `handleCountryChange(next)`, which always emits `{ ...filter, country: next, city: null, page: 1 }` — Unit 4's `DirectoryClient` does not have to know about either rule. A small `useEffect` forces `details.open = true` on `≥768px` viewports so a user who collapses the panel on mobile and then resizes to desktop still sees the filters (browsers cannot force `<details>` open via CSS). The component renders a "Limpiar filtros" button only when `hasActiveFilters(filter)` is `true`; the default `onClearAll` resets every field and the parent can override via the optional prop.
- [x] 3.8 Verify coming-soon tooltip + disabled state on BR/CL/AR/MX; verify city-select disabled without country. Verified by reading the merged and untracked Unit 3 family files: `<CountryFilter/>` forces `count: 0, disabled: true, title="Próximamente"` on any value in `COMING_SOON_COUNTRIES` (defense-in-depth on top of the URL parser drop), plus `aria-disabled` and `aria-describedby` for screen readers. `<CitySelect/>` is disabled when the parent passes `disabled === true` (canonical signal: `filter.country === null`) OR when `options.length === 0`. `<FilterPanel/>` passes `disabled={filter.country === null}` to city-select and emits `city: null` on every country change. All three automated gates (`bun run test`, `bun run lint`, `bun run typecheck`, `bun run build`) pass; tasks.md and state.yaml updated for the Unit 3B transition (history of Units 1, 2, and 3A preserved verbatim above and in Engram `sdd/phase-1-mvp/apply-progress`).

#### Unit 3A Handoff Note

PR 3A contains the shared option contract and core country, industry, stage, and modality controls. PR 3B contains city selection, debounced search, the composed filter panel, mobile `<details>` behavior, and the barrel export. Unit 3B must preserve the controlled props and URL SSOT contract established here.

#### Unit 3B Handoff Note — Controlled Inputs Finalized

PR 3B closes the controlled-input layer of `Phase 1`. The seven filter
files plus `option.ts` are now merged together; `Unit 4 (DirectoryClient)`
is the only remaining client island in the public-directory chain.

**What ships in 3B specifically** (all on the new branch
`feat/phase-1-directory-filters-panel`, four files):

- `src/components/filters/city-select.tsx` — native `<select>` with
  the `__all__` sentinel; disabled when `country === null` or options
  are empty; hint via `aria-describedby`; current selection is preserved
  in the disabled state so the URL is never visually "lost".
- `src/components/filters/search-input.tsx` — internal `draft` state,
  `useDebounce(250)` from Unit 1, `lastValueRef` + initial-mount skip
  guards to prevent parent-update / re-sync feedback loops.
- `src/components/filters/filter-panel.tsx` — single `<details>` used
  for both the desktop sticky aside (`md:sticky md:top-20`) and the
  mobile disclosure (`<summary>` visible `<md`, hidden `md:hidden`);
  page reset and country cascade centralized in `applyChange` /
  `handleCountryChange`; `<details>.open` forced true on `≥768px` via
  `matchMedia` so a resize across the breakpoint still shows filters.
- `src/components/filters/index.ts` — barrel re-exporting the seven
  components, the four `*FilterOption` types, and `hasActiveFilters`.

**Cross-cutting invariants that 3B confirms** (so Unit 4 can compose
with confidence):

- **URL SSOT preserved.** None of the seven filter files imports
  `useSearchParams`, `URLSearchParams`, `parseDirectoryUrl`, or
  `buildDirectoryUrl`. `FilterPanel` imports `DirectoryFilter` only
  as a **type** from `@/lib/filtering`; URL mutation stays the
  parent's job in `DirectoryClient` (`router.replace(url, { scroll: false })`).
- **Page reset (`design.md` §5) is enforced in one place.** Every
  control in `FilterPanel` flows through `applyChange(patch)` which
  always emits `{ ...filter, ...patch, page: 1 }`. Because
  `buildDirectoryUrl` already drops `page === 1` from the serialized
  URL, the parent can call it without an extra "reset page" step.
- **Country cascade (`startup-filters` "Visitor clears country
  selection → city filter is also cleared") is enforced in one place.**
  `handleCountryChange(next)` emits `{ ...filter, country: next,
  city: null, page: 1 }` — clearing the country nulls the city
  atomically. Switching to a new country also clears any stale city
  that belonged to the previous country.
- **Coming-soon enforcement stays in `<CountryFilter/>`.** The URL
  parser already drops `BR|CL|AR|MX`, but the UI layer enforces
  `count: 0, disabled: true, title="Próximamente"` regardless of
  the parent's count (defense-in-depth).
- **`<CitySelect/>` uses a sentinel value** — `__all__` in the DOM,
  `null` at the parent boundary. Native `<select>` cannot represent
  `null` directly, and using `value=""` would collide with a real
  city literally named "" if one ever exists.
- **`<SearchInput/>` debounce is ~250 ms** — the locked design value
  (`design.md` §8). The `delayMs` prop defaults to 250 and is exposed
  for tests / future callers that want a longer delay on mobile.
- **`hasActiveFilters(filter)`** is the predicate the panel uses to
  decide whether to render "Limpiar filtros". Unit 4 can reuse the
  same helper (re-exported from the barrel) for its own "Limpiar"
  affordance in the empty state.

**Responsive layout note (design §12).** The single `<details>` is
deliberately not split into two components. The browser owns the
toggle semantics (keyboard `Enter`/`Space`, screen-reader
announcement, reduced-motion support), and the only client state in
the panel beyond the form callbacks is the `matchMedia` effect that
forces `details.open = true` when the viewport crosses to `≥768px`.
That effect is the only place where the panel needs React's
client-render boundary on top of `useSearchParams`-less URL SSOT.

**No new dependencies, no schema change, no env var change, no
migration.** The Vitest foundation (PR #8 / commit `2858532`) is the
last baseline addition; the four 3B files import only from Unit 1
(`@/lib/filtering` type, `@/lib/constants`, `@/lib/utils`, `@/lib/types`,
`@/hooks/use-debounce`) and from the 3A files (`./option`, `./country-filter`,
`./industry-filter`, `./stage-filter`, `./modality-filter`).

**Rollback boundary.** Reverting PR 3B deletes the four new files in
`src/components/filters/` (city-select, search-input, filter-panel,
index) and reverts the tasks.md / state.yaml diffs. No edits to
filtering, use-debounce, constants, queries, the app shell, or any
Phase 0 / Phase 2 / Phase 3A component.

**Verification performed in this batch:**
- `bun run test` → 57 passed (existing filtering + option tests still green)
- `bun run typecheck` → 0 errors
- `bun run lint` → 0 errors, 0 warnings
- `bun run build` → compiled successfully (Next 16.3.0 Turbopack,
  4/4 static pages)

**Manual E2E scenarios to spot-check in Unit 4** (carried over from
the cross-cutting checklist):
- CO active in country filter; BR/CL/AR/MX disabled with tooltip and `0`;
- city-select disabled when country is `null`; selecting CO enables it;
- industry checkbox toggle adds/removes `industry=<slug>` in the URL;
- clearing country clears city (single URL mutation, no stale city param);
- "Limpiar filtros" resets every field and the URL becomes `?` (or empty);
- search input debounces ~250 ms — no `q=` written per keystroke;
- 375 px viewport shows the mobile `<details>` summary that toggles
  the filter list; ≥768 px shows the sticky aside (no summary chrome).

**Verification**: `bun run lint && bun run typecheck && bun run build`  
**Rollback**: delete `src/components/filters/` directory

#### Unit 3 Handoff Notes — for the orchestrator + Unit 4 executor

The seven filter files plus the shared `option.ts` module form the
"controlled inputs" layer that `DirectoryClient` (Unit 4) composes.
Key contracts and decisions for Unit 4:

- **URL SSOT preserved.** None of the seven filter components imports
  `@/lib/filtering`, `useSearchParams`, or `URLSearchParams`. Every
  control is a pure props-in / callback-out island. The parent
  (`DirectoryClient`) owns the URL via `parseDirectoryUrl` +
  `buildDirectoryUrl` + `router.replace(url, { scroll: false })`.

- **Page reset is centralized in `<FilterPanel/>`.** Every
  sub-control's `onChange` is wrapped by `FilterPanel` to add
  `page: 1` (design §5). `DirectoryClient` does not need to know about
  page reset — it just calls `buildDirectoryUrl(nextFilter, pathname)`
  and `buildDirectoryUrl` already drops `page=1` from the serialized
  URL.

- **Country cascade is centralized in `<FilterPanel/>`.** Country
  changes always clear `city` (spec "Visitor clears country selection
  → city filter is also cleared"). The cascade lives in
  `FilterPanel.handleCountryChange`, NOT in the country filter itself,
  so the filter stays a pure "select a country" component. `DirectoryClient`
  does not need to enforce the cascade.

- **Coming-soon countries are enforced in `<CountryFilter/>`.** The
  filter reads `COMING_SOON_COUNTRIES` from `@/lib/constants` and
  forces `count=0` + `disabled=true` + `title="Próximamente"` on any
  option whose value is in that array. The component does not trust
  the parent's option counts for coming-soon values — defense in
  depth (the URL parser drops them too).

- **`<CitySelect/>` uses a sentinel value.** Native `<select>` cannot
  represent `null` directly, so the component maps
  `__all__` → `onChange(null)` and `value ?? __all__` for the DOM.
  `DirectoryClient` always sees `string | null`, never the sentinel.

- **`<SearchInput/>` debounce.** The component owns the
  `useDebounce(value, 250)` + the draft state. The parent's
  `onChange` callback fires only on the **debounced** value, never per
  keystroke (spec "no filtering occurs between each keystroke"). The
  parent's `onChange` should be wrapped in `useCallback` so the
  debounce effect does not re-fire on every parent re-render.

- **Responsive layout.** `<FilterPanel/>` uses a single `<details>`
  element with the `<summary>` hidden via `md:hidden`. On mobile, the
  user collapses/expands via the summary. On desktop, the panel is
  `md:sticky md:top-20` and follows the visitor as they scroll.
  A small `useEffect` forces `details.open = true` on viewport ≥ 768px
  so a user who collapses the panel on mobile and resizes to desktop
  still sees the filters. This is the only client-side state in the
  panel aside from the form callbacks.

- **`hasActiveFilters(filter)` helper.** Exported from
  `@/components/filters/option.ts` (also re-exported from the barrel).
  Used by the panel to decide whether to render the "Limpiar filtros"
  button. `DirectoryClient` can use the same helper for its own
  "Limpiar" affordance in the empty state, if desired.

- **No new dependencies.** The filter family adds zero dependencies.
  All primitives (`useDebounce`, `INDUSTRY_LABELS`, `COMING_SOON_COUNTRIES`,
  `cn`) come from the Unit 1 surface.

- **Manual E2E scenarios to spot-check in Unit 4** (carried over from
  the cross-cutting checklist): CO active in country filter; BR/CL/AR/MX
  disabled with tooltip and `0`; city-select disabled when country is
  null; industry checkbox toggle adds/removes `industry=<slug>` in URL;
  clearing country clears city; "Limpiar filtros" resets all fields;
  search input debounces ~250ms; 375px viewport shows `<details>`
  summary that toggles the filter list; ≥768px shows sticky aside.

---

## Phase 4: DirectoryClient Island + Homepage (Unit 4)

- [x] 4.1 Create `src/components/directory-client.tsx` — **'use client' island**; `parseDirectoryUrl(useSearchParams())`; `useMemo` applies `filterStartups`; `useCallback` builds URL on filter/page change; `router.replace(url, { scroll: false })` for all mutations (filter changes omit `page`); wraps in `<Suspense>` in parent
- [x] 4.2 Create `src/components/directory-error-state.tsx` — Client island; shows error message + retry button; retry calls `router.refresh()`
- [x] 4.3 Replace `src/app/page.tsx` — Server component; `getApprovedStartups()`; error? `<DirectoryErrorState/>` : `<Suspense><DirectoryClient startups/></Suspense>`; **explicit `export const metadata`** (directory title, description, canonical `/`, openGraph `es_CO`); no metadata relying on root layout alone
- [x] 4.4 Verify URL updates on filter change and reload restores state; verify page resets to 1 on any filter/search change

**Verification**: `bun run lint && bun run typecheck && bun run build`  
**Rollback**: restore Phase 0 placeholder in `src/app/page.tsx`; delete new component files

#### Unit 4 Handoff Note — DirectoryClient composes the chain

PR 4 is the **client-island closure** of Phase 1's public-directory
chain. The four previous chained PRs shipped the seven controlled
filter components + the four presentational components + the
foundation surface; this PR plugs them into a single
`<DirectoryClient/>` island that the homepage Server Component
hydrates.

**What ships in 4 specifically** (five files on branch
`feat/phase-1-directory-client`, ~966 source / ~982 changed lines):

- `src/lib/directory-options.ts` (190 lines, pure module, isomorphic).
  The static-count contract for `<FilterPanel/>`: each option's
  `count` is "approved startups that match when ONLY this filter is
  applied" (every other filter at default). Coming-soon countries
  (BR/CL/AR/MX) emit `count: 0` regardless of input data so the count
  chip stays honest even if a future caller forgets the
  `<CountryFilter/>` defense-in-depth layer. City options are computed
  for the selected country only and sorted alphabetically with the
  Spanish locale (`"es"`); empty when no country is selected. The
  module imports `filterStartups` from `@/lib/filtering` so the count
  rules stay coupled with the predicate.
- `src/lib/directory-options.test.ts` (373 lines, 23 Vitest tests).
  Mandatory pure-logic coverage (no React Testing Library / jsdom).
  Covers the six user-required scenarios: counts, deterministic
  ordering, selected-country city options, no-country empty city
  options, modality job matching (per-startup, not per-job), and
  coming-soon country count 0. Plus label correctness against the
  Spanish `*_LABELS` maps.
- `src/components/directory-client.tsx` (162 lines, `'use client'`).
  Derives `DirectoryFilter` from `useSearchParams()` via
  `parseDirectoryUrl` (URL is SSOT). `useMemo` runs `filterStartups`,
  `computeFilterPanelOptions`, `totalPages`, `clampPage`,
  `paginateStartups`. `useCallback`'d `goToFilter` /
  `buildPageHref` callbacks keep the children's deps stable. The
  island composes `<FilterPanel/>`, `<StartupGrid/>`, `<Pagination/>`
  with the page-reset, country cascade, and coming-soon enforcement
  already centralized inside `<FilterPanel/>`. Empty results wire a
  client-side "Limpiar filtros" action into `<StartupGrid/>`'s
  `emptyAction` slot; no URL parsing or shadow filter state.
- `src/components/directory-error-state.tsx` (105 lines, `'use client'`).
  Visually distinct from the empty state: dashed-card layout
  (shared with `<EmptyState/>`), circular exclamation icon,
  "No pudimos cargar el directorio" headline, transient-failure hint,
  primary retry button. Retry calls `router.refresh()`, which re-runs
  the Server Component (and re-invokes `getApprovedStartups()`). No
  `useSearchParams` — retry preserves whatever filter was active.
  Spanish copy throughout, matching the project convention.
- `src/app/page.tsx` (152 lines, Server Component, replaces the
  Phase 0 placeholder). Calls `getApprovedStartups()` once via the
  Unit 1 surface, branches on the discriminated union (`ok: false` →
  `<DirectoryErrorState/>`; `ok: true` → `<Suspense fallback={
  <DirectorySkeleton/>}><DirectoryClient startups/></Suspense>`).
  Exports explicit `Metadata`: directory title / description,
  `alternates.canonical: "https://latamhub.com/"`, `openGraph.type:
  "website"`, `openGraph.locale: "es_CO"`. Reads the Next 16
  metadata merging rules — page-level metadata replaces root-layout
  fields when both define them.

**Cross-cutting invariants that 4 confirms:**

- **URL SSOT preserved end-to-end.** `<DirectoryClient/>` is the only
  island that touches `useSearchParams` and `URLSearchParams`. The
  seven filter files (Units 3A + 3B) and `<DirectoryErrorState/>` do
  NOT. URL mutations all funnel through `buildDirectoryUrl` +
  `router.replace(url, { scroll: false })`.
- **Pure logic testable without React.** `directory-options.ts`
  imports nothing React-shaped; tests run under Vitest's `node`
  environment (no jsdom). The user's "no RTL / no jsdom" constraint
  is satisfied.
- **Standard mode, not strict TDD.** `strict_tdd: false` per
  `sdd-init/latamhub`. The tests are written in the same commit as
  the production module (Vitest is the gate); the order is
  module-then-test rather than test-first, which matches Standard
  mode conventions.
- **No new dependencies, no schema change, no env var change, no
  migration.** `package.json` is unchanged. The Supabase call is
  unchanged. The build emits no new warnings beyond the pre-existing
  `middleware` → `proxy` deprecation.
- **Next 16 async APIs respected.** `params` is read via
  `getApprovedStartups` which already uses `await cookies()`
  internally (`server.ts` from Unit 1). `useSearchParams` is wrapped
  in `<Suspense>` per Next 16's "Missing Suspense boundary with
  useSearchParams" requirement (production builds fail without it).

**Rollback boundary.** Reverting PR 4 deletes the four new files in
`src/lib/` (directory-options.ts + test) and `src/components/`
(directory-client.tsx, directory-error-state.tsx) and restores the
Phase 0 placeholder in `src/app/page.tsx`. No edits to filtering,
constants, types, queries, the filter family (3A + 3B), the
presentational components (2), the foundation (1), or the Vitest
test runner (PR #8). Fully independently verifiable and rollbackable.

**Verification performed in this batch:**
- `bun run test` → 80 passed (57 existing + 23 new in
  `directory-options.test.ts`); 3 test files all green.
- `bun run typecheck` → 0 errors.
- `bun run lint` → 0 errors, 0 warnings.
- `bun run build` → Next 16.3.0 (Turbopack) compiled successfully
  in ~2.4s; 4/4 static pages generated; `/` route is now `ƒ`
  (dynamic, server-rendered on demand) because the Server Component
  calls `getApprovedStartups()` at request time.

**Manual E2E scenarios to spot-check in Unit 5** (carried over from
the cross-cutting checklist, now end-to-end reachable):
- `/` renders 20 seeded startups; filter chips show correct counts
  (CO 20, BR/CL/AR/MX 0); industries / stages / modalities show
  catalog order with non-zero counts for the live ones.
- Filter narrowing: tapping any country / industry / stage / modality
  pill updates the URL (`?country=CO&page=1` etc.), the count
  reflects the filtered set, and the page resets to 1.
- Search: typing in the search box debounces ~250ms (no per-keystroke
  URL mutation); the URL writes `q=<term>` once the user pauses.
- Pagination: with no filters, 3 pages (8/8/4) appear; tapping
  "Siguiente" rewrites the URL to `?page=2` and the grid re-renders.
- Empty state: selecting `industry=agtech` (with no agtech in the
  seed) renders the empty state with "Limpiar filtros" wired into
  the action slot; tapping it returns to `?` (or empty URL).
- Reload restores state: copy the URL after any combination of
  filter changes, reload, and the directory restores the exact
  same filtered view.
- 375px viewport: filter panel shows the mobile `<details>`
  disclosure with a "Filtros" summary that toggles the filter list;
  ≥768px shows the sticky aside (no summary chrome).
- Error state: kill Supabase env vars and reload; the directory
  shows "No pudimos cargar el directorio" + retry button; tap retry
  and the Server Component re-runs the query.

**Verification**: `bun run lint && bun run typecheck && bun run build`  
**Rollback**: restore Phase 0 placeholder in `src/app/page.tsx`; delete new component files

---

## Phase 5: Detail Page + SEO (Unit 5)

- [x] 5.1 Create `src/app/startups/[slug]/page.tsx` — Server component; `await params` (Next 16 async); `getStartupBySlug(params.slug)`; null? `notFound()` + `robots: { googlebot: { noindex: true } }` : render detail fields; `generateMetadata` with title, description, canonical, openGraph
- [x] 5.2 Create `src/app/startups/[slug]/not-found.tsx` — 404 page + `export const metadata` with `robots: noindex`; distinct from root not-found
- [x] 5.3 Verify: approved slug renders detail; unknown slug → 404 + noindex; verify `generateMetadata` output (title, description, canonical, og) via `bun run build`

**Verification**: `bun run lint && bun run typecheck && bun run build`  
**Rollback**: delete `src/app/startups/[slug]/` directory

---

## Phase 6: SEO Consistency + Quality-Gate Closure (Unit 6)

- [x] 6.1 Audit all `canonical` URLs: homepage `/` (absolute `https://latamhub.com/`), detail pages (`/startups/[slug]`) — **audit clean**: both pages export the correct absolute URL via Next.js `alternates.canonical`; centralised to `metadataBase` in `src/app/layout.tsx` (Unit 6 refactor).
- [x] 6.2 Audit all `openGraph` tags: homepage (`og:title`, `og:description`, `og:url`, `og:type=website`), detail pages (`og:type=article`, `og:image` from logoUrl if present) — **audit clean**: homepage emits `og:type=website` with full block (title/description/url/siteName/locale); detail emits `og:type=article` with conditional `images` only when `logoUrl` is set.
- [x] 6.3 Audit `robots` directives: detail unknown/unapproved → noindex; homepage noindex? no (must be indexable) — **audit clean**: homepage omits `robots` → indexable; detail `not-found.tsx` exports `robots: { index: false, follow: false }`; detail `generateMetadata` returns the same `robots: noindex` for `null` startup (defense-in-depth with Next.js's auto-injected `<meta name="robots" content="noindex">`).
- [x] 6.4 Run `bun run lint && bun run typecheck && bun run build`; fix any regressions from prior slices — **all gates green**: lint 0 errors/0 warnings, typecheck 0 errors, build Next 16.3.0 compiled (4/4 routes), test 80/80 pass.
- [x] 6.5 Verify no new dependencies added; verify no test runner calls (Phase 2 will add Vitest) — **package.json unchanged** (Vitest was added in PR #8, out of Unit 6 scope); no new test runner imports; no new dependencies.

**Verification**: `bun run lint && bun run typecheck && bun run build`  
**Rollback**: revert this PR slice only; prior slices remain intact

---

## Cross-Cutting Notes

### URL-as-Source-of-Truth Contract (enforced across all slices)
- **URL params are the single source of truth** for `q`, `industry` (multi), `country`, `city`, `stage`, `modality`, `page`
- `DirectoryClient` derives state from `useSearchParams()`; never maintains shadow filter state
- `parseDirectoryUrl` / `buildDirectoryUrl` in `filtering.ts` is the **one parse venue** (SSR + client)
- Industry multi-select: repeated keys `industry=fintech&industry=ai` via `URLSearchParams.getAll`
- Page reset: any `q`/`industry`/`country`/`city`/`stage`/`modality` change omits `page` from URL

### No Test Runner
- **No automated tests** — Phase 1 verification is `bun run lint`, `bun run typecheck`, `bun run build`
- Manual E2E checklist: `/` renders 20 seeded startups; filters narrow + URL updates + reload restores; search debounces ~250ms; pagination 8/8/4 + resets on filter; `?industry=a&industry=b` multi-select; `/startups/{slug}` approved + unknown 404/noindex; 3 distinct states; 375px mobile `<details>` disclosure; BR/CL/AR/MX disabled "Próximamente"

### Modality Filter (Spec Required)
- Modality filter MUST be included (was omitted in prior design draft)
- `MODALITY_LABELS` already exists in `constants.ts`; no new constant needed

### Coming-Soon Countries
- BR/CL/AR/MX: disabled in country filter, "Próximamente" tooltip, count 0
- City-select: disabled unless country=CO selected
- Clearing country clears city filter

---

## Next Step

Chain strategy is `stacked-to-main`. **Work Unit 4** (DirectoryClient
island + `app/page.tsx` wiring + homepage `metadata`) is complete on
branch `feat/phase-1-directory-client`. Proceed with `sdd-verify` for
Unit 4, then package the slice (commit + open PR against `main`).
After PR 4 merges, proceed with `sdd-apply` for **Work Unit 5**
(`/startups/[slug]` detail page + not-found + `generateMetadata`).
Unit 5 is the last client island in the public-directory chain; Unit 6
is the SEO consistency + quality-gate closure (no new features, just
audit + regression closure).
