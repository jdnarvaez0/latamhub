# Exploration: Phase 1 — MVP Colombia (Directory, Filters, Search, Detail)

**Change**: `phase-1-mvp`
**Project**: latamhub (COL/LABS)
**Phase scope**: ROADMAP.md §"Phase 1 — MVP Colombia"
**Status**: Ready for proposal

---

## Current State

Phase 0 is archived and live. The latamhub repo is bootstrapped against the
frozen Lovable prototype at `../colombia-startup-hub/`. Everything Phase 1
needs to *consume* data is already in place — nothing needs to be re-laid:

- **Supabase schema** is shipped: `industries`, `startups`, `jobs` with RLS.
  Migration `00002_create_startups.sql` already defines the
  `search_vector tsvector generated always as (to_tsvector('spanish', …)) stored`
  column and the GIN index `idx_startups_search` — Phase 1 *uses* this, it does
  not build it. (DATA_MODEL.md §2.2 and §5 are satisfied by Phase 0.)
- **Supabase clients** are wired for Next 16 async semantics:
  `src/lib/supabase/server.ts` does `await cookies()` and omits `setAll`
  (middleware owns session refresh); `src/lib/supabase/client.ts` is a lazy
  singleton; `src/middleware.ts` calls `updateSession`.
- **Design system** is ported verbatim into `src/app/globals.css` (244 lines):
  OKLCH tokens, `@theme inline`, custom utilities (`animate-flip-in`,
  `row-hover`, `tag`, `tag-primary`, `data-label`, `press`, `nav-underline`,
  `animate-reveal`). All classes used by the prototype directory route are
  available unchanged.
- **Domain types + display maps** already match DATA_MODEL.md §4:
  `src/lib/types.ts` (camelCase English `Startup`/`Job` with embedded `jobs: Job[]`)
  and `src/lib/constants.ts` (`COUNTRY_LABELS`, `STAGE_LABELS`,
  `MODALITY_LABELS`). DB stores English slugs (`CO`, `seed`); UI renders
  Spanish display via these maps.
- **App shell** is shipped: `layout.tsx` (root metadata + next/font + nav/footer
  shell), `site-nav.tsx`, `site-footer.tsx`, `monogram.tsx`, `not-found.tsx`,
  and a Phase-0 **placeholder** `app/page.tsx` that Phase 1 will *replace*.
- **Seed data**: orchestrator confirms 20 Colombian startups + 33 jobs loaded
  into project `ijqctniftzjerdugfdbp` (visible via `bun run verify-seed`).

### What the prototype gives us (READ-ONLY reference)

The prototype implements the directory as a **single-file route** that mixes data
+ filters + grid in one component (`colombia-startup-hub/src/routes/index.tsx`,
330 lines). It does NOT split filters into named components.

| Prototype file | Phase 1 reuse |
|---|---|
| `src/components/StartupRow.tsx` (69 lines) | **Portable** — Link swap + prop remap |
| `src/components/Monogram.tsx` | Already ported in Phase 0 |
| `src/components/SiteNav.tsx`, `SiteFooter.tsx` | Already ported in Phase 0 |
| `src/routes/index.tsx` (directory) | **Reference only**, rewrite as App Router |
| `src/routes/startups.$slug.tsx` (detail) | **Reference only**, rewrite as App Router |
| `src/data/startups.ts` (479 lines) helpers: `contarPorPais`, `getStartup`, `ciudadesPorPais`, `totalVacantes` | **Reference for shape** — Supabase queries replace these |

### Critical type-remap observations (port vs original)

The prototype's `Startup` type uses **Spanish field names** with **Spanish
display values** baked in:

```ts
// prototype — Spanish fields, Spanish values
{ nombre: "Rappi", pais: "Colombia", etapa: "Serie B+",
  industria: "Ecommerce", vacantes: [...] }
```

latamhub's `Startup` uses **English fields** with **English enum slugs** and a
display map:

```ts
// latamhub — English fields, English slugs, Spanish via STAGE_LABELS
{ name: "Rappi", country: "CO", stage: "series-b+",
  industry: "ecommerce", jobs: [...] }
```

Implication for the port: **every** `startup.etapa` → `STAGE_LABELS[startup.stage]`,
`startup.pais` → `COUNTRY_LABELS[startup.country]`, `startup.nombre` →
`startup.name`, `startup.resumen` → `startup.description`,
`startup.vacantes` → `startup.jobs`, `startup.industria` →
`INDUSTRY_LABELS[startup.industry]` (a NEW label map Phase 1 must add —
`constants.ts` today has no industry-label map; industries live in the DB but
the dropdown needs slug→"Fintech" display. Add `INDUSTRY_LABELS` or query
`industries` table at render).

---

## Affected Areas (file paths)

### Will be CREATED (Phase 1 net-new)

- `src/lib/queries.ts` — Supabase server query helpers
  (`getApprovedStartups`, `getStartupBySlug`, `getRelatedStartups`,
  `getIndustryOptions`, `getCityOptions`). Single source of truth for the
  directory's data layer; isolates `textSearch()` / `range()` / JOIN logic.
- `src/hooks/use-debounce.ts` — debounced value hook for the search input
  (~250 ms). Trivial; the prototype inlines `setBusqueda` with no debounce.
- `src/components/startup-row.tsx` — **port** of prototype StartupRow with
  Link swap + prop remap (see remap notes above).
- `src/components/startup-grid.tsx` — **new** (prototype never had a discrete
  grid component; TABLE_NOT_FOUND). Wraps `StartupRow[]` + result count +
  empty state. NOTE: ROADMAP task "StartupGrid" is ambiguous — see
  [Open decisions](#open-decisions-to-resolve-in-spec).
- `src/components/pagination.tsx` — **new**. Client pagination UI. Prototype
  inlines numeric buttons + "Siguiente →".
- `src/components/empty-state.tsx` — **new**. "No results" + "Coming soon" badge.
- `src/components/directory-client.tsx` — **new**. Single client island owning
  filter/search/pagination state. Receives server-fetched startups as props.
  Mirrors the prototype `Directorio` body but factored out.
- `src/components/filters/` — **new directory of named filter components**:
  - `country-filter.tsx` (pills + counts + Coming-soon disabled state)
  - `industry-filter.tsx` (checkboxes + counts)
  - `stage-filter.tsx` (pills)
  - `city-select.tsx` (`<select>` driven by selected country's cities)
  - `search-input.tsx` (debounced; uses `use-debounce`)
- `src/app/startups/[slug]/page.tsx` — **new** server component (detail page).
  `generateMetadata` + `params: Promise<{ slug: string }>` + server query.
- `src/app/startups/[slug]/not-found.tsx` — recommended for unknown slug
  (returns 404 + `noindex`).

### Will be REPLACED

- `src/app/page.tsx` — Phase 0 placeholder (23 lines) is fully replaced by the
  directory server component (fetches approved startups → renders
  `<DirectoryClient startups={…} />`).

### Will be MODIFIED

- `src/lib/constants.ts` — **add `INDUSTRY_LABELS`** (industry slug → Spanish
  display, e.g. `ecommerce` → "Ecommerce", `logistics` → "Logística"). Today the
  industries table holds these labels but constants.ts has no map. Either add
  the map OR fetch `industries` and join — both valid; **Recommendation**: add
  the static map (industries are a fixed catalog per DATA_MODEL.md §2.1 and
  won't change without a migration anyway).
- `src/components/site-nav.tsx` — optional: the `/jobs` and `/ecosystem` links
  already point to routes that 404 today (Phase 0 left them un-built). For
  Phase 1 either (a) leave the nav as-is and let 404 stand (acceptable per
  roadmap), or (b) add "Próximamente" treatment. Recommend (a) for Phase 1.

### NOT touched (Phase 0 boundary)

- `supabase/migrations/*` (shipped), `supabase/seed.sql` (shipped),
  `src/lib/supabase/*`, `src/middleware.ts`, `src/app/layout.tsx`,
  `src/app/globals.css`, `src/app/not-found.tsx`, `src/lib/types.ts`,
  `src/components/{site-nav,site-footer,monogram}.tsx`, `package.json`.

---

## Data Fetching Pattern (ARCHITECTURE.md §4)

The architecture deliberately splits server vs client:

```
app/page.tsx (SERVER)
  └─ queries.getApprovedStartups(country?) → Startup[] (with joined jobs[])
  └─ returns <DirectoryClient startups={rows} />

components/directory-client.tsx (CLIENT)
  └─ owns state: busqueda, industriasSel, country, city, stage, page
  └─ filters the prop array locally (useMemo) → visible rows
  └─ <StartupGrid><StartupRow/></StartupGrid> + <Pagination/>
```

**Phase 1 = client-side filtering is correct.** With 20 startups the in-memory
filter is O(1) wall-clock and keeps URL state simple. ARCHITECTURE.md §4
explicitly states the threshold: *only switch to server-side filtering via URL
search params when dataset grows beyond ~500 startups per country*. Phase 4
(LatAm expansion) targets 30-50/country, still well under threshold.

**When to revisit server-side filtering**: Phase 5 (scraper) or any data load
that pushes a single country past ~500 approved rows. Build the abstraction in
`queries.ts` so the API surface (`getApprovedStartups({ country, industry,
city, stage, search, page })`) can absorb params without changing the client.

---

## Full-text Search Implementation (DATA_MODEL.md §5)

The DB already has `search_vector` (Spanish tsvector + GIN). Phase 1 *uses* it.

### Supabase JS client API (verified via Context7 `/supabase/supabase-js`)

```ts
// plfts(spanish).query  →  plainto_tsquery('spanish', $query)
supabase
  .from('startups')
  .select(columns)
  .textSearch('search_vector', 'fintech bogota', {
    config: 'spanish',
    type: 'plain',
  })
```

- `type: 'plain'` → `plainto_tsquery` (matches user-typed free text; does NOT
  honor boolean operators). Use `'websearch'` (`wfts`) only if we want
  Google-style `OR`/`-`/quoted phrases — **not needed for Phase 1**.
- `config: 'spanish'` MUST be passed — otherwise Postgres uses `simple`, which
  skips Spanish stemming and significantly degrades recall.
- The `textSearch()` column argument is the tsvector column name
  (`search_vector`), not the text columns.

### Two design choices for the search entry point

1. **Client-side fallback for the empty-query case** (fast path):
   when the search input is empty, skip `textSearch` entirely and use the
   in-memory filter for name/description/city. This avoids a round trip for the
   common "browse" state and matches the prototype's `busqueda.trim() === ""`
   branch.
2. **Server-side `textSearch` when querying the DB** — applicable if/when Phase
   1 flips to server filtering (>500 rows). Build the query in `queries.ts`
   now so the signature is forward-compatible, but for the 20-row MVP the
   client applies the same filter locally with `.toLowerCase().includes()`.

> **Recommendation**: Phase 1 ships **client-side substring filtering** for
> search (prototype parity) and authorizes `queries.ts` with a stubbed
> `textSearch`-based server query *only for Phase 4+ readiness*. Calling
> `textSearch` over the wire for 20 in-memory rows is premature optimization.

### Spanish-text accuracy (gotcha, low risk)

`to_tsvector('spanish', …)` lowercases and strips diacritics before stemming, so
indexed "Bogotá" → "bogota". `plainto_tsquery('spanish', 'bogota')` also
matches. So a user typing "bogota" (no accent) hits "Bogotá" rows correctly.
Risk: typing partial words ("bog") won't match (tsquery requires word-boundary
stems). The prototype's substring fallback (`.includes('bog')`) *would* match,
giving the prototype an edge in "starts-with" UX. **Mitigation**: keep the
client-side `.includes()` filter for Phase 1 search (matches prototype UX),
reserve `textSearch` for the >500-row server filter path where recall quality
matters more than partial matches.

---

## Pagination Strategy

- **Phase 1**: client-side. `PAGE_SIZE = 8` (ROADMAP-framed). `resultados.slice(
  (page-1)*8, page*8)`. Total pages = `max(1, ceil(resultados/8))`. Reset page
  to 1 on any filter change (prototype does this — copy the pattern).
- **Offset vs cursor**: at this scale, *neither matters*. PostgREST `range(from,
  to)` (inclusive 0-based) is the right call when the server path is eventually
  enabled — verified via Context7: `range()` sets `offset` and computes
  `limit = to - from + 1`. Cursor pagination is over-engineering until the
  dataset breaks 10k or sorts by a non-unique column.
- **Filter interaction**: pagination operates **after** the filtered resultSet,
  never on the raw startups array. The page index is meaningless without the
  active filter set, so when the filter set changes, page resets to 1. (Cannot
  stay on page 3 of an empty new result.)

---

## SEO Metadata Pattern (ARCHITECTURE.md §6)

Next.js 16 metadata API (verified Context7 `/vercel/next.js/v16.2.9`):
`params` and `searchParams` are **Promises** — must `await params` to read the
slug. `generateMetadata` is `async` and returns `Promise<Metadata>`.

### Directory page (`app/page.tsx`)
Static `Metadata` export is fine (no per-slug dynamic content here). Phase 0's
root `metadata` in `layout.tsx` already covers the homepage title/description/
OG/Twitter. **Phase 1 override**: replace the placeholder's implicit metadata
with an explicit export matching the prototype's `head()` block ("Col/Labs —
Directorio de startups de Latinoamérica"). Keep OG locale `es_CO` (already set
in root).

### Detail page (`app/startups/[slug]/page.tsx`)
```ts
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const startup = await getStartupBySlug(slug);
  if (!startup) return { title: "Startup no encontrada — Col/Labs",
                         robots: { index: false } };
  const title = `${startup.name} — ${INDUSTRY_LABELS[startup.industry]} en ${startup.city} | Col/Labs`;
  return {
    title,
    description: startup.description,
    openGraph: { title, description: startup.description, type: "website" },
    alternates: { canonical: `/startups/${startup.slug}` },
  };
}
```
Add `alternates.canonical` for every detail page (Phase 0 root metadata does
not set canonical). Add `robots: { index: false }` on the not-found branch
(prototype does this — preserve).

### Open Graph images
Phase 1 has no logo upload (logos ship via `logo_url` from seed). For now, do
not set `openGraph.images` — Vercel OG image generation is a Phase 1+ stretch,
not a must. Document as out-of-scope in the spec.

---

## Empty States

1. **No results** (filter set matches zero rows) — port prototype message
   verbatim ("Sin resultados / Prueba con otro término o quita algunos
   filtros"). Reusable `<EmptyState title=… hint=… />` component.
2. **Country with 0 startups ("Coming soon")** — prototype handles this by
   `disabled` pill + `title="Próximamente"` and count `0`. Acceptance criterion
   reqs a visible "Coming soon" badge for BR/CL/AR/MX. Two valid UX options:
   - (a) **Pill stays disabled, count `0`, tooltip "Próximamente"** (prototype
         parity; minimal effort; no screen real-estate cost).
   - (b) **A Coming Soon card replaces the grid** when the user clicks a 0-row
         country (e.g., "Brasil llegará pronto — suscríbete al newsletter").
   **Recommendation**: ship (a) for Phase 1 acceptance, defer (b) to Phase 4
   where it actually becomes a marketing surface. The acceptance criterion is
   satisfied by the disabled-pill + badge treatment.

---

## Approach Options

### Option A — Verbatim port, then refactor into named components
Copy `StartupRow` and the index/detail route bodies line-for-line, swap
`@tanstack/react-router` Link → `next/link` + `usePathname`, then split the
inline filter JSX into the named `CountryFilter` / `IndustryFilter` /
`StageFilter` / `CitySelect` / `SearchInput` files the ROADMAP asks for.

- **Pros**: Lowest cognitive risk — the directory UX is already user-validated
  in the prototype; port-then-split preserves the proven visual rhythm
  (animations, hover states, pillar layout). Artifact of record already exists
  (Phase 0 explore), so reviewers recognize the lineage.
- **Cons**: Two passes (port → split) over the same code; the route body is 330
  lines of mixed concerns — porting it whole then refactoring risks leaving
  inline JSX.
- **Effort**: Low-Medium.

### Option B — Rebuild fresh from the design system, prototype as visual spec
Treat the prototype as a Figma mock. Build `StartupRow`, `StartupGrid`, the
filter components and pages from scratch using `globals.css` utilities and the
prototype screenshots as the only spec. No copy.

- **Pros**: Cleanest Next 16/TypeScript strict shape from day one; zero
  leftover TanStack-isms; idiomatic `'use client'` boundaries.
- **Cons**: Discards 519 lines of working, UX-validated JSX; re-deriving the
  animation delays (`Math.min(index, 8) * 60ms`), the exactly-matching header
  block, and the hover affordances is tedious and error-prone without visual
  parity tooling; highest drift risk vs the prototype.
- **Effort**: Medium-High.

### Option C — Hybrid (Recommended)
Port `StartupRow` verbatim (with the documented prop/link remap). Port the
prototype's *structure* of the directory + detail (column layout,
`data-label` headings, animation delays, sticky aside in detail) but rewrite
the **body** as: one server `app/page.tsx` + one `DirectoryClient` client
island that composes the named filter components (built fresh, since the
prototype never had them as units). `StartupGrid` is built fresh because it is
a brand-new abstraction the prototype never had.

- **Pros**: Preserves validated UX where it matters (rows, hover, header block,
  detail aside) AND gives the ROADMAP its named filter components AND keeps
  server/client boundaries idiomatic for Next 16. One pass — no port-then-split
  churn. Lowest total drift risk.
- **Cons**: Requires the spec to be opinionated about filter component props
  (so the orchestrator/spec author must commit to an API). Mixed discipline
  (port for rows, fresh for filters) needs a one-paragraph rule.
- **Effort**: Medium.

---

## Recommendation

**Option C — Hybrid.** The ROADMAP explicitly enumerates named filter
components that do not exist in the prototype, so a pure Option A port cannot
deliver them without a refactor pass anyway. Conversely Option B throws away
the validated StartupRow/detail UX. Option C ports the irreducible UX atoms
(`StartupRow`, detail aside layout, header mono-stat block) and rebuilds the
filter organization the ROADMAP mandates — closing the gap without sacrificing
visual parity. Author `queries.ts` up-front so the data API is the same shape
the >500-row server-filter future will need.

### Open decisions to resolve in spec

1. **`StartupGrid` semantics** — the ROADMAP task "Build StartupGrid" is
   ambiguous. The prototype's directory is a **vertical list of rows** (not a
   3-col card grid). Resolve in spec: is `StartupGrid` (a) the row-list + result
   count + empty-state wrapper (prototype parity, recommended), or (b) a true
   `sm:grid-cols-3` card grid (deviates from prototype)? **Recommend (a)**;
   flag for user.
2. **Industry labels**: ship `INDUSTRY_LABELS` in `constants.ts` (fast, static)
   vs query the `industries` table per render (dynamic, joins). Recommend
   static map — the catalog is migration-locked.
3. **Search path for Phase 1**: client substring filter (prototype parity) vs
   server `textSearch()`. Recommend client for 20 rows; reserve server path in
   `queries.ts`. Flag for user.
4. **Coming-soon UX**: disabled pill + tooltip (a) vs dedicated Coming Soon
   card (b). Recommend (a) for Phase 1.
5. **Canonical URLs**: add `alternates.canonical` to every detail page in
   Phase 1 (yes — small, future-proof). Flag for spec.
6. **`use-debounce` latency**: 250 ms (recommended default). Not a roadblock,
   just a spec constant.

---

## Risks

- **`StartupGrid` ambiguity** (above) — without a spec decision, two engineers
  will build two different things. Mitigation: spec MUST resolve semantics.
- **Industry-label gap** — `constants.ts` today has no `INDUSTRY_LABELS`. Filter
  dropdowns and `StartupRow` tags both need it. Easy miss. Mitigation: tasks.md
  explicitly adds this map.
- **Spanish tsquery partial-match recall** — `plainto_tsquery('spanish', 'bog')`
  won't hit "Bogotá" (word-boundary stems). Phase 1 mitigation = client-side
  `.includes()` for the in-memory filter; document the server path's lower
  partial-match recall for Phase 4.
- **Mobile responsiveness of the filter sidebar** — prototype uses
  `md:flex-row md:w-64` aside on desktop and stacks on mobile. Phase 1 should
  inherit this; verify during verify phase on actual mobile width (acceptance
  criterion: "Mobile responsive"). No new work, just a verification gate.
- **2 unused nav links (`/jobs`, `/ecosystem`)** — Phase 1 does not build them
  (they're Phase 2 / later). They 404 today and will continue to 404.
  Acceptable per roadmap; verify phase just confirms the 404 page renders.
- **`openspec/` is not yet initialized in `latamhub`** — the live project's
  `openspec/` folder was created in the prototype repo during Phase 0, not in
  latamhub. Phase 1's `openspec/changes/phase-1-mvp/exploration.md` is the FIRST
  artifact writing into latamhub's openspec tree. **There is no
  `openspec/config.yaml` and no `openspec/specs/` in latamhub.** The orchestrator
  should either re-run `sdd-init` in latamhub (to bootstrap config.yaml + a
  migrated main spec) before the proposal phase, OR explicitly accept hybrid
  mode writing only change-folder artifacts (the changes/ tree is self-sufficient
  for the pipeline). **Flag to orchestrator.**
- **Review budget — Medium-High** — see Sizing forecast.

---

## Sizing Forecast (Review Workload Guard)

| Field | Value |
|---|---|
| Estimated changed lines | ~1,100–1,500 (adds; nearly all new files) |
| 400-line budget risk | **High** (exceeds single-PR budget) |
| Chained PRs recommended | Yes |
| Per Phase 0 precedent | User chose single PR at ~1,030 lines (Medium risk). If the same preference holds, this Phase may push into single-PR-with-exception territory. **Confirm with user.** |

Suggested chained-PR work units (each ≤400 lines, autonomous, verifiable,
rollback-safe):

1. `queries.ts` data layer + `INDUSTRY_LABELS` constant addition.
2. `StartupRow` port + `StartupGrid` + `Pagination` + `EmptyState` (pure
   presentational, no data wiring).
3. Filter component family (`country/industry/stage/city/select/search`) +
   `use-debounce` hook.
4. `DirectoryClient` island + `app/page.tsx` server wiring (replaces the
   Phase 0 placeholder).
5. `app/startups/[slug]/page.tsx` detail (server component +
   `generateMetadata` + not-found).
6. SEO sweep + mobile verification + Coming-soon badge.

---

## Skill Resolution

`paths-injected` — orchestrator injected `sdd-explore` SKILL.md; loaded
`_shared/sdd-phase-common.md` (Sections B/C/D) and `_shared/openspec-convention.md`
as shared deps. Retrieved Phase 0 explore artifact from Engram (obs #38 — full
content via `mem_get_observation`). Verified Next.js 16 metadata API via
Context7 (`/vercel/next.js/v16.2.9` `generateMetadata` — async `params` Promise)
and Supabase JS `textSearch()` + `range()` API via Context7
(`/supabase/supabase-js`). Prototype inspected READ-ONLY per Lovable no-history-
rewrite constraint (no git ops performed on the prototype).

Session: sdd-explore-phase-1-mvp-latyamhub
Project: colombia-startup-hub (Engram), latamhub (filesystem)
Scope: project
Topic: `sdd/phase-1-mvp/explore`

---

## Ready for Proposal: Yes

Recommend orchestrator launch `sdd-propose` for `phase-1-mvp` scoped to
**Option C — Hybrid**. The proposal MUST:

1. Lock Option C (port the row atom + detail aside; rebuild filters/grid as
   named components the ROADMAP mandates).
2. Surface the 6 open decisions above to the user (one prompt —
   `StartupGrid` semantics is the fork worth pausing on; the rest can be
   recommended defaults with "any objections?").
3. Include a rollback plan (Phase 1 adds net-new files; rollback = revert PR or
   delete `app/startups/[slug]/`, restore the Phase 0 placeholder in
   `app/page.tsx`, revert `constants.ts` industry-labels line).
4. Forecast chained PRs per the 6 work units and confirm the single-PR-vs-chain
   decision with the user (Phase 0 set the precedent of single PR at Medium
   risk; Phase 1 likely tips High).
5. Resolve the `openspec/`-in-latamhub gap (re-run `sdd-init` in latamhub
   before proposal, OR explicitly accept changes-only persistence).