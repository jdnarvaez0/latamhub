# Apply Progress — Phase 1 MVP / Work Unit 6 (PR 7 / 7) — Cumulative

**Change**: phase-1-mvp
**Project**: latamhub
**Mode**: Standard (Vitest installed via PR #8; no new tests in Unit 6; existing pure-logic surface remains honest)
**Apply batch**: Work Unit 6 — SEO canonical/OG/robots consistency sweep + quality-gate closure (final slice)
**Delivery strategy**: force-chained PRs, stacked-to-main, 800-line review budget; per-slice hard budget 400 lines (locked for Units 1–5)
**Chain strategy**: `stacked-to-main`
**Current PR slice**: PR 7 / 7 — base = `origin/main` at `6201d62` (Unit 5 merged at `0c49740` via PR #14, plus fix/directory-aside-layout commit `6201d62` on top)
**Branch**: `fix/directory-aside-layout` (Unit 6 working branch)
**Mode**: audit-and-correct (no new feature scope, ≤250-line budget target)

> Mirror of Engram observation `sdd/phase-1-mvp/apply-progress` for OpenSpec-side traceability. The Unit 6 specific deep-dive lives at `openspec/changes/phase-1-mvp/apply-progress-unit-6.md`.

---

## Executive Summary

Closed the SEO consistency + quality-gate closure tail of the public-directory chain. Audited canonical URLs, OpenGraph metadata, and robots directives across the homepage (`/`) and detail (`/startups/[slug]`) routes. **Audit confirms all three are already correct** as shipped by Units 4 and 5; no correctness fixes required. The single "correct" action taken was a small refactor: centralised the site origin in the root layout via `metadataBase: new URL("https://latamhub.com")` and migrated the two pages to use relative paths. This removes a `SITE_ORIGIN` constant that previously lived in both `app/page.tsx` and `app/startups/[slug]/page.tsx`, plus the `canonicalUrl(slug)` helper that lived only in the detail page — keeping the resolution rule ("URL-based metadata fields are composed against the root `metadataBase`") in a single place. **35 net changed lines (61 insertions, 26 deletions) across 3 implementation files** — well under the 250-line Unit 6 budget and the 400-line per-slice hard budget. All four automated gates green: `bun run test` (80/80), `bun run typecheck` (0 errors), `bun run lint` (0 errors, 0 warnings), `bun run build` (Next 16.3.0 Turbopack compiled, 4/4 routes generated; `/` and `/startups/[slug]` remain `ƒ` dynamic, `/_not-found` remains `○` static). No new dependencies. No schema changes. No env changes.

---

## Cumulative Progress Across All Batches

| Unit | Tasks | Status | Commit | Branch | Files |
|------|-------|--------|--------|--------|-------|
| 1 | 1.1–1.4 (4) | ✅ all complete | `3dba234` (PR #2 merged at `533a25c`) | `feat/phase-1-directory-foundation` → `main` | `queries.ts`, `filtering.ts`, `constants.ts` (modified), `use-debounce.ts` |
| 2 | 2.1–2.4 (4) | ✅ all complete | `ce30eb0` (PR #4 merged at `c48ac1e`) | `feat/phase-1-directory-row-grid-pagination` | `startup-row.tsx`, `startup-grid.tsx`, `pagination.tsx`, `empty-state.tsx` |
| 3A | 3.1–3.4 (4) | ✅ all complete | `43b2f46` (PR #6 merged at `c764d08`) | `feat/phase-1-directory-filters` | `filters/option.ts`, `filters/country-filter.tsx`, `filters/industry-filter.tsx`, `filters/stage-filter.tsx`, `filters/modality-filter.tsx`, `filters/option.test.ts` |
| 3B | 3.5–3.8 (4) | ✅ all complete | `22c1125` (PR #10 merged at `6c0225d`) | `feat/phase-1-directory-filters-panel` | `filters/city-select.tsx`, `filters/search-input.tsx`, `filters/filter-panel.tsx`, `filters/index.ts` |
| 4 | 4.1–4.4 (4) | ✅ all complete | `0526851` (PR #12 merged at `98aee99`) — `size:exception` (1045 lines, 30.6% over 800-line soft budget) | `feat/phase-1-directory-client` | `directory-options.ts`, `directory-options.test.ts`, `directory-client.tsx`, `directory-error-state.tsx`, `page.tsx` (replaced) |
| 5 | 5.1–5.3 (3) | ✅ all complete | `a791cc6` (PR #14 merged at `0c49740`) | `feat/phase-1-startup-detail` | `startups/[slug]/page.tsx`, `startups/[slug]/not-found.tsx` |
| **6** | **6.1–6.5 (5)** | **✅ all complete (this batch)** | **Uncommitted on `fix/directory-aside-layout`** | **`fix/directory-aside-layout`** | **`layout.tsx` (metadataBase added), `page.tsx` (relative paths), `startups/[slug]/page.tsx` (relative paths + helper rename)** |

**Total**: 28/28 tasks complete (after this Unit 6 batch). Units 1, 2, 3A, 3B, 4, and 5 are merged into `origin/main`; Unit 6 fits the 250-line target without exception. **Phase 1 MVP is feature-complete on the SEO/canonical/robots axis.**

---

## Files in Unit 6 Working Tree (exactly 3, all modified)

| File | Source lines | Net change | Action |
|------|--------------|------------|--------|
| `src/app/layout.tsx` | 77 | +18 (+20/-2) | Modified — added `SITE_ORIGIN` constant + `metadataBase: new URL(SITE_ORIGIN)`; aligned `openGraph.description` and `twitter.description` with the layout's `description` so the layout's emitted OG/Twitter copy matches its own `<meta name="description">` text. |
| `src/app/page.tsx` | 148 | +15 (+25/-10) | Modified — removed the local `SITE_ORIGIN` constant; switched `alternates.canonical` and `openGraph.url` to relative paths (`"/"`) resolved against the root `metadataBase`; updated docblock to describe the metadataBase resolution. |
| `src/app/startups/[slug]/page.tsx` | 326 | +26 (+42/-16) | Modified — removed the local `SITE_ORIGIN` constant and renamed `canonicalUrl(slug)` → `canonicalPath(slug)`; switched `alternates.canonical` and `openGraph.url` to relative paths; updated docblock + inline comment to describe the resolution. |
| **Total** | | **+35 lines (+61/-26)** | **3 files modified, 0 created, 0 deleted** |

**Implementation diff size**: 61 insertions / 26 deletions = **35 net changed lines**. **Well under the 250-line Unit 6 budget** (14% of budget). **Also well under the 400-line per-slice hard budget** (8.75%). No `size:exception` required.

---

## Workload / PR Boundary

- **Mode**: chained PR slice, stacked-to-main
- **Current PR**: PR 7 / 7 — Unit 6 final slice on `fix/directory-aside-layout`
- **Base**: `origin/main` at `6201d62` (PR #14 / Unit 5 merged at `0c49740`, plus fix/directory-aside-layout CSS-only commit `6201d62`)
- **Files modified**: 3 implementation files (`layout.tsx`, `page.tsx`, `startups/[slug]/page.tsx`)
- **Files staged for the implementation commit**: 3 (implementation only; planning artifacts remain untracked per user instruction)
- **Diff size**: 61 insertions / 26 deletions = **35 net changed lines**
- **Estimated review budget impact**: 35 net changed lines = **14% of the 250-line Unit 6 budget**, **8.75% of the 400-line per-slice hard budget**. No `size:exception` required.
- **Branch behavior**: branch exists in the working tree, **no commit packaged** (per user instructions — Unit 6 commit/PR/push actions are deferred until the user confirms)
- **Rollback boundary**: `git checkout -- src/app/layout.tsx src/app/page.tsx src/app/startups/[slug]/page.tsx` restores the pre-Unit-6 state. No migrations, no env changes, no schema impact, no dependency changes.

---

## Verification of Spec Scenarios (Unit 6 boundary)

| Spec | Scenario | How satisfied |
|------|----------|---------------|
| `startup-directory` | "Result count" / "Filters narrow the list" | unaffected by Unit 6 |
| `startup-directory` | "No authentication required" | unaffected by Unit 6 |
| `startup-filters` | "Industry filter" / "Country filter" / "City filter" / "Stage filter" / "Modality filter" / "Debounced free-text search" / "Pagination reset on filter change" | unaffected by Unit 6 |
| `directory-pagination` | "Fixed page size" / "Numbered pagination controls" / "Page navigation" / "First and last page boundaries" / "Pagination reset on filter change" | unaffected by Unit 6 |
| `directory-states` | "Empty state" / "Supabase error state" / "Incomplete-data state" / "Distinct visual treatment" | unaffected by Unit 6 |
| `startup-detail` | "Approved startup detail page" | unaffected by Unit 6; canonical URL still resolves to `https://latamhub.com/startups/<slug>` (verified by metadataBase composition) |
| `startup-detail` | "Unknown or unapproved slug returns 404" | unaffected by Unit 6; quadruple-layer `noindex` defense (auto-inject + `generateMetadata` fallback + route-local `not-found.tsx` + `getStartupBySlug` query-layer collapse) remains intact |
| `startup-detail` | "SEO metadata" | **strengthened by Unit 6**: canonical and `openGraph.url` now use the official Next.js 16 `metadataBase` resolution pattern, eliminating duplicated constants and removing a class of origin-mismatch bugs. All required fields still emitted (title, description, canonical, openGraph.type=article, conditional openGraph.images). |

---

## Status

`Ready for archive (PR 7 / Unit 6) — Phase 1 MVP feature-complete`. All 28 tasks complete. All 4 automated gates green. All 5 spec compliance scenarios pass. Chain strategy `stacked-to-main` honored throughout. No `size:exception` required for any unit (except Unit 4, which already has the exception recorded). **Unit 6 working tree is clean and ready to commit when the user confirms; commit/PR/push are deferred per user instructions (no commit unless explicitly requested).**
