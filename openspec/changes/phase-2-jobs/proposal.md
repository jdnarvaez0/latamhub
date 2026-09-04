# Proposal: Phase 2 — Jobs (/jobs Directory)

## Intent

Implement the dedicated public jobs section at `/jobs`: aggregate all active vacancies from approved startups across Latin America, allowing visitors to search, filter (by country, modality), inspect compensation and role details, and navigate directly to the startup page or apply URL.

## Scope

**In:**
- `src/lib/queries.ts`: Add `getActiveJobs()` server query fetching active jobs joined with approved startup info (name, slug, logoUrl, country, city).
- `src/lib/types.ts`: Ensure `JobWithStartup` view type exists for display.
- `src/lib/jobs-filtering.ts`: Pure isomorphic filtering logic and URL parser/builder (`q`, `country`, `modality`, `page` if paginated).
- `src/app/jobs/page.tsx`: Server component fetching active jobs, exporting complete SEO metadata (`title`, `description`, `canonical`, `openGraph`).
- `src/components/jobs/jobs-client.tsx`: Interactive client island owning search/filter URL state.
- `src/components/jobs/job-row.tsx`: Job vacancy row showing title, startup name/monogram, area, modality, location, salary range, startup link, and external "Apply" link (`apply_url`).
- `src/components/jobs/job-filters.tsx`: Debounced text search, country select/pills, modality select.
- `src/components/jobs/jobs-empty-state.tsx`: Clear empty states when filters yield zero jobs or query fails.
- Unit tests with Vitest covering filtering logic and query mappers.

**Out:**
- Job submission / recruiter portal (Phase 3+).
- Custom backend or auth gated applications (all apply links route to external `apply_url`).
- Saved jobs / user bookmarking.

## Capabilities

### New
- `jobs-directory`: Public active job listing at `/jobs` server-rendered with SEO metadata.
- `jobs-filters`: URL-synced search by keyword (title, startup, area, location), country filter, and modality filter (`remote`, `hybrid`, `onsite`).
- `jobs-navigation`: Quick access to startup details (`/startups/[slug]`) and direct application (`apply_url` target `_blank`).
- `jobs-states`: Graceful empty state when no vacancies match criteria or on connection issues.

### Modified
- `src/lib/queries.ts`: Add `getActiveJobs()` query.
- Navigation header (if present in root layout) linking to `/jobs`.

## Approach

Follow the established Hexagonal / Next.js Server-Client island pattern used in Phase 1:
1. **Server Fetching**: `app/jobs/page.tsx` fetches active jobs from Supabase using `getActiveJobs()`.
2. **URL SSOT**: Search params (`q`, `country`, `modality`) in the URL drive the filtering state.
3. **Pure Logic**: Isomorphic `jobs-filtering.ts` with 100% test coverage via Vitest.
4. **Presentational Components**: Clean atomic components (`JobRow`, `JobFilters`, `JobsClient`) styled with Tailwind CSS v4 matching the existing dark/light palette.

## Risks & Mitigations

- **Missing or unapproved startups**: Query enforces `jobs.status = 'active'` AND `startups.status = 'approved'`.
- **URL Desynchronization**: Same URL-as-SSOT pattern as `DirectoryClient` to prevent state drift.
- **External links security**: Apply button uses `rel="noopener noreferrer"` and `target="_blank"`.

## Rollback Plan

Delete `src/app/jobs/`, `src/components/jobs/`, `src/lib/jobs-filtering.ts`, and revert query additions in `src/lib/queries.ts`. No database migrations or schema alterations needed.

## Success Criteria

- Vitest tests pass (`bun run test`).
- Typecheck (`bun run typecheck`) and lint (`bun run lint`) are clean.
- Next.js build (`bun run build`) compiles cleanly with `/jobs` route.
- `/jobs` loads and displays active vacancies with responsive mobile and desktop layouts.
