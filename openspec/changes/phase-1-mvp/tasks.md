# Tasks: Phase 1 — MVP Colombia (Public Startup Directory)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,100–1,500 total; 6 slices ≤400 each |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 6 chained slices (see below) |
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
| 3 | Filter family + mobile `<details>` disclosure + coming-soon countries | PR 3 | `main` | same gates |
| 4 | DirectoryClient island + homepage (`<Suspense>` + metadata export) | PR 4 | `main` | same gates |
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

- [ ] 3.1 Create `src/components/filters/country-filter.tsx` — Radio/checkgroup; CO active; **BR/CL/AR/MX disabled + "Próximamente" tooltip + count 0**; onChange calls `buildDirectoryUrl` (clears city when country changes)
- [ ] 3.2 Create `src/components/filters/industry-filter.tsx` — **Multi-select checkboxes**; `values: string[]` prop; each checkbox toggles its slug in the array; renders via `INDUSTRY_LABELS`; URL encoding: repeated `industry=<slug>` keys
- [ ] 3.3 Create `src/components/filters/stage-filter.tsx` — Single-select; `STAGE_LABELS` display
- [ ] 3.4 Create `src/components/filters/modality-filter.tsx` — Single-select; `MODALITY_LABELS` display
- [ ] 3.5 Create `src/components/filters/city-select.tsx` — **Disabled unless country=CO**; city options derived from current country; cleared when country cleared
- [ ] 3.6 Create `src/components/filters/search-input.tsx` — Text input; debounced via `useDebounce` (~250ms); `useCallback` stable reference
- [ ] 3.7 Create `src/components/filters/filter-panel.tsx` — Composes all filter sub-components; desktop: sticky aside; **mobile (<md): `<details>` disclosure stacked above grid; mobile uses same FilterPanel** (not a separate component)
- [ ] 3.8 Verify coming-soon tooltip + disabled state on BR/CL/AR/MX; verify city-select disabled without country

**Verification**: `bun run lint && bun run typecheck && bun run build`  
**Rollback**: delete `src/components/filters/` directory

---

## Phase 4: DirectoryClient Island + Homepage (Unit 4)

- [ ] 4.1 Create `src/components/directory-client.tsx` — **'use client' island**; `parseDirectoryUrl(useSearchParams())`; `useMemo` applies `filterStartups`; `useCallback` builds URL on filter/page change; `router.replace(url, { scroll: false })` for all mutations (filter changes omit `page`); wraps in `<Suspense>` in parent
- [ ] 4.2 Create `src/components/directory-error-state.tsx` — Client island; shows error message + retry button; retry calls `router.refresh()`
- [ ] 4.3 Replace `src/app/page.tsx` — Server component; `getApprovedStartups()`; error? `<DirectoryErrorState/>` : `<Suspense><DirectoryClient startups/></Suspense>`; **explicit `export const metadata`** (directory title, description, canonical `/`, openGraph `es_CO`); no metadata relying on root layout alone
- [ ] 4.4 Verify URL updates on filter change and reload restores state; verify page resets to 1 on any filter/search change

**Verification**: `bun run lint && bun run typecheck && bun run build`  
**Rollback**: restore Phase 0 placeholder in `src/app/page.tsx`; delete new component files

---

## Phase 5: Detail Page + SEO (Unit 5)

- [ ] 5.1 Create `src/app/startups/[slug]/page.tsx` — Server component; `await params` (Next 16 async); `getStartupBySlug(params.slug)`; null? `notFound()` + `robots: { googlebot: { noindex: true } }` : render detail fields; `generateMetadata` with title, description, canonical, openGraph
- [ ] 5.2 Create `src/app/startups/[slug]/not-found.tsx` — 404 page + `export const metadata` with `robots: noindex`; distinct from root not-found
- [ ] 5.3 Verify: approved slug renders detail; unknown slug → 404 + noindex; verify `generateMetadata` output (title, description, canonical, og) via `bun run build`

**Verification**: `bun run lint && bun run typecheck && bun run build`  
**Rollback**: delete `src/app/startups/[slug]/` directory

---

## Phase 6: SEO Consistency + Quality-Gate Closure (Unit 6)

- [ ] 6.1 Audit all `canonical` URLs: homepage `/` (absolute `https://latamhub.com/`), detail pages (`/startups/[slug]`)
- [ ] 6.2 Audit all `openGraph` tags: homepage (`og:title`, `og:description`, `og:url`, `og:type=website`), detail pages (`og:type=article`, `og:image` from logoUrl if present)
- [ ] 6.3 Audit `robots` directives: detail unknown/unapproved → noindex; homepage noindex? no (must be indexable)
- [ ] 6.4 Run `bun run lint && bun run typecheck && bun run build`; fix any regressions from prior slices
- [ ] 6.5 Verify no new dependencies added; verify no test runner calls (Phase 2 will add Vitest)

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

Chain strategy is `stacked-to-main`. Proceed with `sdd-apply` for **Work Unit 3** (filter
family + mobile `<details>` disclosure + coming-soon countries, PR 3/6) once this slice is
merged.
