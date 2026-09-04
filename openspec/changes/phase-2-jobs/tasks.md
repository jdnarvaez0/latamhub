# Tasks: Phase 2 — Jobs (/jobs Directory)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~400–600 total |
| 400-line budget risk | Medium |
| Work Units | 3 focused units |
| Verification | `bun run test; bun run typecheck; bun run lint; bun run build` |

---

## Suggested Work Units

| Unit | Goal | Scope |
|------|------|-------|
| 1 | Data Access & Pure Logic | `getActiveJobs` query, `JobWithStartup` type, `jobs-filtering.ts` + Vitest tests |
| 2 | Component Architecture | `JobRow`, `JobFilters`, `JobsEmptyState`, `JobsClient` island |
| 3 | Page & SEO Integration | `src/app/jobs/page.tsx` + metadata + navigation links + end-to-end verification |

---

## Phase 2 Tasks

### Unit 1: Data Access & Pure Logic
- [x] 1.1 Update `src/lib/types.ts` to add `JobWithStartup` interface.
- [x] 1.2 Implement `getActiveJobs()` in `src/lib/queries.ts` with Supabase join on `startups`.
- [x] 1.3 Create isomorphic `src/lib/jobs-filtering.ts` (`parseJobsUrl`, `buildJobsUrl`, `filterJobs`).
- [x] 1.4 Add unit tests in `src/lib/jobs-filtering.test.ts` verifying parsing, filtering, and edge cases.
  - 32 tests, 112 total (typecheck 0 errors).

### Unit 2: Presentational & Interactive Components
- [x] 2.1 Create `src/components/jobs/job-row.tsx` with title, startup link, tags (modality, salary, area), and external apply button.
- [x] 2.2 Create `src/components/jobs/job-filters.tsx` composing debounced search, country filter, and modality pills/select.
- [x] 2.3 Create `src/components/jobs/jobs-empty-state.tsx` with filter reset action.
- [x] 2.4 Create `src/components/jobs/jobs-client.tsx` managing URL search params via `useSearchParams()`.

### Unit 3: Page Route & Verification
- [x] 3.1 Create `src/app/jobs/page.tsx` (RSC) fetching `getActiveJobs()` and wrapping `JobsClient` in `<Suspense>`.
- [x] 3.2 Add complete SEO metadata (title, description, canonical, openGraph) to `/jobs`.
- [x] 3.3 Ensure site navigation links to `/jobs` — already present in `site-nav.tsx`.
- [x] 3.4 Execute verification gates: `bun run test` ✅ 112/112 · `bun run typecheck` ✅ 0 errors · `bun run lint` ✅ 0 errors · `bun run build` ✅ 5/5 routes generated (`/jobs` = ƒ dynamic).

