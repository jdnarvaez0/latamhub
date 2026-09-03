## Verification Report — Unit 5

**Change**: phase-1-mvp  
**PR Slice**: 6 / 7 (stacked-to-main)  
**Branch**: `feat/phase-1-startup-detail` (merged at `0c49740` via PR #14)  
**Commit**: `a791cc6` — `feat(directory): add startup detail page + not-found (5/7)`  
**Verification Branch**: `fix/directory-aside-layout` (Unit 5 unchanged from merged state)  
**Mode**: Standard (Vitest gate active; no strict TDD)  
**Date**: 2026-08-11

### Verdict: PASS

All three Unit 5 tasks are complete. All five spec scenarios are fully compliant. All six design decisions are followed. All four automated quality gates pass cleanly. Zero issues at any severity level. 385 changed lines — under the 400-line hard budget by 15 lines (3.75% headroom).

---

### Completeness

| Metric | Value |
|--------|-------|
| Unit 5 tasks total | 3 (5.1, 5.2, 5.3) |
| Tasks complete | 3 |
| Tasks incomplete | 0 |
| Files changed | 2 (`page.tsx` + `not-found.tsx`) |
| Diff stat | 385 insertions, 0 deletions |
| Budget | 385 / 400 (3.75% headroom) ✅ |

---

### Build & Tests Execution

**Build**: ✅ Passed
```
▲ Next.js 16.3.0 (Turbopack)
✓ Compiled successfully in 50s
✓ Generating static pages using 3 workers (4/4) in 1915ms
Route (app)
┌ ƒ /
├ ○ /_not-found
└ ƒ /startups/[slug]
```

**Tests**: ✅ 80 passed / 0 failed / 0 skipped
```
Test Files  3 passed (3)
     Tests  80 passed (80)
```

**Typecheck**: ✅ 0 errors

**Lint**: ✅ 0 errors, 0 warnings

**Coverage**: ➖ Not available (no coverage threshold configured)

---

### Spec Compliance Matrix

| Spec | Requirement | Scenario | Evidence | Result |
|------|-------------|----------|----------|--------|
| `startup-detail` | Approved startup detail page | GIVEN approved slug, WHEN visited, THEN fields display | `getStartupBySlug(slug)` returns approved row via `.eq("status","approved")` + `.maybeSingle()`; `page.tsx` renders name, description, industry, stage, modality, country, city, website, LinkedIn, investors, jobs as a full detail layout; build confirms `ƒ /startups/[slug]` dynamic route | ✅ COMPLIANT |
| `startup-detail` | Unknown slug → 404 + noindex | GIVEN missing slug, WHEN visited, THEN 404 and noindex present | `getStartupBySlug` returns `null` when `error \|\| !data`; `page.tsx:126` calls `notFound()` → Next.js renders route-local `not-found.tsx`; `not-found.tsx:39-42` exports `robots: { index: false, follow: false }`; `generateMetadata` also returns `robots: { index: false, follow: false }` for `!startup` guard (line 80) — redundant with Next.js auto-noindex but keeps merge contract predictable | ✅ COMPLIANT |
| `startup-detail` | Unapproved slug → 404 + noindex | GIVEN pending slug, WHEN visited, THEN 404 and noindex present | Same query path as unknown — `.eq("status","approved")` on `getStartupBySlug` ensures unapproved rows return `null`; no information leakage (design §7 / proposal risk "Unapproved slug leaks data") | ✅ COMPLIANT |
| `startup-detail` | SEO metadata | GIVEN approved startup, WHEN metadata generated, THEN title, description, canonical, og set | `generateMetadata`: title = `${name} — ${industry} · Col/Labs` via `detailTitle()`; description = `descriptionFor()` collapses whitespace + caps at 200 chars; canonical = `https://latamhub.com/startups/${slug}` via `canonicalUrl()`; `openGraph.type: "article"`, `openGraph.locale: "es_CO"`, `openGraph.siteName: "Col/Labs"`; `openGraph.images` conditional on `logoUrl`; `twitter.card: "summary_large_image"` or `"summary"` | ✅ COMPLIANT |
| `directory-states` | Incomplete-data state | GIVEN missing optional fields, WHEN detail renders, THEN available shown, missing marked "No proporcionado" | `city ?? NOT_PROVIDED` (line 134); `stageLabel = stage ? STAGE_LABELS[stage] ?? stage : NOT_PROVIDED` (lines 135-137); `foundedYearLabel = foundedYear ? String(foundedYear) : NOT_PROVIDED` (lines 138-140); `employeeRangeLabel = employeeRange ?? NOT_PROVIDED` (line 141); `investors.length === 0` → `<p>No proporcionado</p>` (line 281); `website` null → "Visitar sitio" button omitted; `linkedinUrl` null → LinkedIn section omitted; `logoUrl` null → `<Monogram letter={monogramLetter(name)}>` used instead | ✅ COMPLIANT |

**Compliance summary**: 5/5 spec scenarios compliant

---

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| Next 16 async params in page | ✅ | `params: Promise<{ slug: string }>` + `await params` (lines 118-123) |
| Next 16 async params in generateMetadata | ✅ | `params: Promise<{ slug: string }>` + `await params` (lines 67-72) |
| getStartupBySlug collapses unknown/unapproved to null | ✅ | `.eq("status","approved")` + `.maybeSingle()` + `if (error \|\| !data) return null` + try/catch → null (queries.ts:273-329) |
| notFound() on null, no info leak | ✅ | `if (!startup) { notFound(); }` (line 126-128); unapproved rows invisible at query layer |
| Safe external links | ✅ | `target="_blank" rel="noopener noreferrer"` on website (line 186-188), LinkedIn (line 267-269), and job apply URLs (line 238-240) |
| Optional fields labeled honestly | ✅ | `NOT_PROVIDED = "No proporcionado"` constant; applied to city, stage, foundedYear, employeeRange, investors |
| generateMetadata title bounded | ✅ | `detailTitle()` produces `${name} — ${industry} · Col/Labs` |
| generateMetadata description bounded/safe | ✅ | `descriptionFor()` collapses whitespace (`source.replace(/\s+/g, " ")`) + caps at 200 chars (`.slice(0, 200)`) |
| Canonical absolute URL | ✅ | `canonicalUrl(slug)` → `https://latamhub.com/startups/${slug}` |
| OG type article | ✅ | `openGraph.type: "article"` (line 99) |
| OG logo conditional | ✅ | Conditional spread only when `logoUrl` is set (lines 102-108) |
| Not-found metadata noindex | ✅ | `robots: { index: false, follow: false }` on both `not-found.tsx` (lines 39-42) and `generateMetadata` fallback (line 80) |
| Route-local not-found distinct from root | ✅ | "Startup no encontrada — Col/Labs" vs root's "Página no encontrada"; Monogram "?"; different CTA copy; layout stays inside the directory's visual rhythm |
| No Unit 6 scope creep | ✅ | Only 2 files in `/startups/[slug]/`; no canonical audit; no cross-route sweep |
| No new dependencies | ✅ | `package.json` unchanged; all imports from existing surface (`@/lib/queries`, `@/lib/constants`, `@/lib/types`, `@/components/monogram`) |
| Only 2 implementation files staged | ✅ | `openspec/**` files are dirty/untracked — intentional per user instruction |
| Pure Server Component | ✅ | No `"use client"` directive; no `useSearchParams`; no `useState`/`useEffect`; no Suspense boundary needed |

---

### Design Coherence

| Decision | Followed? | Evidence |
|----------|-----------|----------|
| Design §15: Next 16 async params | ✅ Yes | `params: Promise<{ slug: string }>` + `await params` in both `page` (line 121-123) and `generateMetadata` (line 70-72) |
| Design §7: Unapproved slugs → null → notFound | ✅ Yes | `getStartupBySlug` enforces `.eq("status","approved")` at query layer; `null` → `notFound()` → `not-found.tsx` with `robots: noindex` |
| Design §13: Canonical absolute URL | ✅ Yes | `canonicalUrl(slug)` → `https://latamhub.com/startups/${slug}` via `SITE_ORIGIN` constant |
| Design §13: OG type article | ✅ Yes | `openGraph.type: "article"` |
| Design §13: OpenGraph image from logoUrl | ✅ Yes | Conditional spread only when `logoUrl` is truthy (lines 102-108); Twitter card switches between `summary_large_image` and `summary` |
| Design §7: No client island | ✅ Yes | Pure Server Component; no `"use client"`; no `useSearchParams`; no Suspense; single data round-trip via `getStartupBySlug` |

All 6 design decisions followed. Zero deviations. Zero design-model disagreements.

---

### Issues Found

**CRITICAL**: None  
**WARNING**: None  
**SUGGESTION**: None

---

### Diff / Stat

```
 src/app/startups/[slug]/not-found.tsx |  73 ++++++++
 src/app/startups/[slug]/page.tsx      | 312 ++++++++++++++++++++++++++++++++++
 2 files changed, 385 insertions(+)
```

385 net changed lines. Under the 400-line hard budget by 15 lines (3.75% headroom). No `size:exception` required.

---

### Notes

- The pre-existing `middleware` → `proxy` deprecation warning in `bun run build` is unchanged from `origin/main` and is not from this batch (migration belongs to a separate task).
- The current branch `fix/directory-aside-layout` sits on top of `0c49740` (Merge PR #14 — Unit 5); `git diff a791cc6..HEAD -- src/app/startups/` returns zero output — Unit 5 files have not been modified post-merge.
- `openspec/**` files are dirty/untracked per user instruction — verified they are intentionally excluded from the implementation diff.
- `PageProps<'/startups/[slug]'>` was avoided in favor of the explicit `Promise<{ slug: string }>` shape — this is the documented portable approach that does not require `next typegen`.
- The `generateMetadata` noindex fallback (line 80) is intentionally redundant with both the `not-found.tsx` static export and Next.js's auto-injected `<meta name="robots" content="noindex">` for 404 renders. This triple-layer defense keeps the merge contract with the root layout predictable regardless of future layout changes.
- Job listing rendering uses `MODALITY_LABELS[job.modality] ?? job.modality` as a fallback (line 217) — matching the pattern already established in `<StartupRow/>` for industry, country, and stage labels.
- `longDescription` display prefers the curation-team field over the short description (line 142-144), and renders with `whitespace-pre-line` to preserve intentional newlines.
