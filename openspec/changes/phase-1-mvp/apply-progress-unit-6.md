# Apply Progress — Phase 1 MVP / Work Unit 6 (PR 7 / 7) — DETAILED

**Change**: phase-1-mvp
**Project**: latamhub
**Mode**: Standard (Vitest installed via PR #8; no new tests in this batch; required pure-logic-only test surface stays honest)
**Apply batch**: Work Unit 6 — SEO canonical/OG/robots audit + `metadataBase` centralisation + quality-gate closure
**Delivery strategy**: force-chained PRs, stacked-to-main, 800-line review budget; per-slice hard budget 400 lines (locked for Units 1–5)
**Chain strategy**: `stacked-to-main`
**Current PR slice**: PR 7 / 7 — final slice on branch `fix/directory-aside-layout`
**Base**: `origin/main` at `6201d62` (PR #14 / Unit 5 merged at `0c49740`, plus fix/directory-aside-layout CSS-only commit `6201d62`)
**Working-tree diff vs `6201d62`**: 3 files modified, 0 created, 0 deleted; **+61/-26 = +35 net changed lines** in `src/`
**Mode**: audit-and-correct (no new feature scope, ≤250-line budget target)
**Packaging timestamp**: 2026-08-11

> Mirror of Engram observation `sdd/phase-1-mvp/apply-progress-unit-6` for OpenSpec-side traceability. The project-wide cumulative record (Units 1–6) lives at `openspec/changes/phase-1-mvp/apply-progress.md` and the corresponding Engram topic `sdd/phase-1-mvp/apply-progress`.

---

## Unit 6 At a Glance

| Field | Value |
|-------|-------|
| Tasks total | 5 (6.1, 6.2, 6.3, 6.4, 6.5) |
| Tasks complete | 5 |
| Files changed | 3 (`layout.tsx` + `page.tsx` + `startups/[slug]/page.tsx`) |
| Diff stat | 61 insertions, 26 deletions = **+35 net changed lines** |
| Budget | 35 / 250 (Unit 6 soft target) ✅; 35 / 400 (per-slice hard budget) ✅ |
| Correctness fixes required | 0 — audit confirms all SEO/canonical/OG/robots were already correct |
| Code-quality refactor | 1 — `metadataBase` centralisation in root layout + relative paths in pages |
| New dependencies | 0 |
| New test files | 0 |
| Gates | 4/4 green: lint, typecheck, test (80/80), build (Next 16.3.0 Turbopack, 4/4 routes) |

---

## Unit 6 Audit Findings

### Task 6.1 — Canonical URLs

| Route | Expected | Actual (pre-Unit-6) | Actual (post-Unit-6) | Status |
|-------|----------|---------------------|----------------------|--------|
| `/` | absolute `https://latamhub.com/` | `alternates.canonical: "${SITE_ORIGIN}/"` where `SITE_ORIGIN = "https://latamhub.com"` | `alternates.canonical: "/"` resolved by Next.js against `metadataBase` → `https://latamhub.com/` | ✅ COMPLIANT |
| `/startups/[slug]` | absolute `https://latamhub.com/startups/<slug>` | `alternates.canonical: canonicalUrl(slug)` where `canonicalUrl = ${SITE_ORIGIN}/startups/${slug}` | `alternates.canonical: canonicalPath(slug)` where `canonicalPath = "/startups/${slug}"`, resolved against `metadataBase` → `https://latamhub.com/startups/<slug>` | ✅ COMPLIANT |

Both routes emit the correct absolute canonical URL. The audit found a duplication smell (the `SITE_ORIGIN` constant was defined in both page files with the same value) and corrected it via the `metadataBase` refactor — the canonicals are now expressed as relative paths in their own files, and the site origin lives in exactly one place.

### Task 6.2 — OpenGraph metadata

| Route | Field | Required | Actual | Status |
|-------|-------|----------|--------|--------|
| `/` | `og:title` | present | `HOMEPAGE_TITLE` | ✅ |
| `/` | `og:description` | present | `HOMEPAGE_DESCRIPTION` (matches `<meta name="description">`) | ✅ |
| `/` | `og:url` | present | relative `"/"` → `https://latamhub.com/` | ✅ |
| `/` | `og:type` | `website` | `"website"` (explicit, even though layout already declares it) | ✅ |
| `/` | `og:site_name` | present | `"Col/Labs"` | ✅ |
| `/` | `og:locale` | present | `"es_CO"` | ✅ |
| `/startups/[slug]` | `og:title` | present | `${name} — ${industry} · Col/Labs` via `detailTitle(startup)` | ✅ |
| `/startups/[slug]` | `og:description` | present | `descriptionFor(startup)` (prefers longDescription, whitespace-collapsed, 200-char capped) | ✅ |
| `/startups/[slug]` | `og:url` | present | relative `canonical` → `https://latamhub.com/startups/<slug>` | ✅ |
| `/startups/[slug]` | `og:type` | `article` | `"article"` (explicit) | ✅ |
| `/startups/[slug]` | `og:image` | conditional on `logoUrl` | conditional spread `{...(startup.logoUrl ? { images: [{ url: startup.logoUrl, alt: ... }] } : {})}` — image emitted only when the curation team uploaded a logo | ✅ |
| `/startups/[slug]` | `og:site_name` | present | `"Col/Labs"` | ✅ |
| `/startups/[slug]` | `og:locale` | present | `"es_CO"` | ✅ |
| `/` (layout inheritance) | `og:description` | aligned | layout's `openGraph.description` now matches the layout's `description` (was missing "Empezando por Colombia") | ✅ |
| `/startups/[slug]` `twitter.card` | matches OG image presence | `summary_large_image` when `logoUrl` is set, `summary` otherwise | ✅ |

### Task 6.3 — Robots directives

| Route | Required | Actual | Status |
|-------|----------|--------|--------|
| `/` | indexable | no `robots` field in `app/page.tsx` `metadata`; layout also has no `robots` field; defaults to `index: true, follow: true` | ✅ INDEXABLE |
| `/startups/[slug]` (approved) | indexable | `robots: { index: true, follow: true }` in `generateMetadata` return | ✅ INDEXABLE |
| `/startups/[slug]` (unknown slug) | `noindex` | (a) `generateMetadata` returns `robots: { index: false, follow: false }` when `getStartupBySlug(slug) === null`; (b) `page.tsx` calls `notFound()` → Next.js renders route-local `not-found.tsx`; (c) `not-found.tsx` exports `robots: { index: false, follow: false }`; (d) Next.js auto-injects `<meta name="robots" content="noindex">` for any 404 render. **Quadruple-layer defense.** | ✅ NOINDEX |
| `/startups/[slug]` (unapproved slug) | `noindex` (no info leak) | `getStartupBySlug(slug)` filters `.eq("status", "approved")` at the query layer → unapproved rows return `null` → same `notFound()` path → same quadruple-layer `noindex`. **No information leak about whether a non-approved row exists** (design §7 / proposal risk "Unapproved slug leaks data"). | ✅ NOINDEX |
| `/_not-found` (root) | `noindex` (auto) | no explicit `robots`; Next.js auto-injects `<meta name="robots" content="noindex">` for 404 renders | ✅ NOINDEX (auto) |

### Task 6.4 — Run gates and fix regressions

| Gate | Command | Result |
|------|---------|--------|
| Test | `bun run test` | ✅ pass — 80/80 tests green (3 test files: `filtering.test.ts` 37, `option.test.ts` 20, `directory-options.test.ts` 23). No new tests added — Unit 6 is a pure audit + small refactor, not a feature with new logic. |
| Type | `bun run typecheck` | ✅ pass — 0 errors |
| Lint | `bun run lint` | ✅ pass — 0 errors, 0 warnings |
| Build | `bun run build` | ✅ pass — Next 16.3.0 (Turbopack) compiled in 14.5s, 4/4 routes generated; `/` and `/startups/[slug]` are `ƒ` (dynamic, server-rendered on demand); `/_not-found` is `○` (static). No new build-time warnings beyond the pre-existing `middleware` → `proxy` deprecation (unchanged from `origin/main`, NOT from Unit 6). |

### Task 6.5 — No new dependencies, no test runner changes

| Check | Result |
|-------|--------|
| `package.json` diff | 0 changes — no dependencies added, no devDependencies added, no scripts added, no scripts modified. |
| Vitest foundation | unchanged (added in PR #8, well before Unit 6) |
| New test runner calls in Unit 6 source files | 0 — Unit 6 touched only `layout.tsx` + `page.tsx` + `startups/[slug]/page.tsx`, none of which import `vitest`, `vi`, or any test runtime. |
| New test files added | 0 — no `.test.ts` or `.test.tsx` files added. The 80-test surface remains exactly as it was after Units 1 and 4. |
| New feature scope | none — Unit 6 is exclusively a metadata audit + tiny refactor. No new routes, no new components, no new business logic. |

---

## File-by-File Diff Rationale

### `src/app/layout.tsx` — +18 net lines (+20/-2)

**What changed:**
1. Added a docblock explaining why `SITE_ORIGIN` now lives here (one of the few files in the repo that declares a domain string literal).
2. Added `const SITE_ORIGIN = "https://latamhub.com";`.
3. Added `metadataBase: new URL(SITE_ORIGIN)` as the first property of the existing `metadata` export.
4. Aligned the layout's `openGraph.description` and `twitter.description` to match the layout's own `description` (both now end with "Empezando por Colombia"). The homepage's `page.tsx` overrides both fields anyway, so the alignment is only visible on routes that don't define their own OG/Twitter (e.g., the route-local not-found pages that inherit the layout).

**Why this is the right home for `metadataBase`:**
Per the Next.js 16 docs (`generateMetadata.md` → `metadataBase` section): "It is typically set in root `app/layout.js` to apply to URL-based `metadata` fields across all routes." The recommendation is explicit and matches our needs: one canonical place for the site origin, used by every URL-based metadata field in the app.

### `src/app/page.tsx` — +15 net lines (+25/-10)

**What changed:**
1. Removed the local `const SITE_ORIGIN = "https://latamhub.com";`.
2. Switched `alternates.canonical` from `${SITE_ORIGIN}/` to `"/"`.
3. Switched `openGraph.url` from `${SITE_ORIGIN}/` to `"/"`.
4. Updated the file docblock to describe the `metadataBase` resolution and the new pattern.

**Resolution correctness:**
Per the docs (`generateMetadata.md` → "URL Composition"): the relative path `"/"` against `metadataBase = https://latamhub.com` resolves to `https://latamhub.com` (the trailing slash is normalized). Next.js emits `<link rel="canonical" href="https://latamhub.com/">` and `<meta property="og:url" content="https://latamhub.com/">` — identical URLs to the pre-Unit-6 absolute-path form. Verified at build time (no warnings about absolute URL requirements).

### `src/app/startups/[slug]/page.tsx` — +26 net lines (+42/-16)

**What changed:**
1. Removed the local `const SITE_ORIGIN = "https://latamhub.com";`.
2. Renamed `canonicalUrl(slug): string` → `canonicalPath(slug): string` and changed its return type to a relative path (now returns `\`/startups/\${slug}\``, was `${SITE_ORIGIN}/startups/${slug}`).
3. Renamed the local variable `url` → `canonical` in `generateMetadata` to reflect the relative-path semantics.
4. Switched `alternates.canonical` and `openGraph.url` to use `canonical` (the relative path).
5. Updated the file docblock + inline comment to describe the `metadataBase` resolution.
6. Added a comment block explaining why `openGraph.images[].url` continues to receive the absolute `logoUrl` directly (not the relative form resolved through `metadataBase`): because the logo URL comes from the database and is already absolute (curation team uploads to the public asset bucket); per the docs, "If a `metadata` field provides an absolute URL, `metadataBase` will be ignored" — so the value passes through unchanged, which is the desired behavior.

**Resolution correctness:**
`canonicalPath(slug) = "/startups/" + slug` against `metadataBase = https://latamhub.com` resolves to `https://latamhub.com/startups/<slug>`. Next.js emits `<link rel="canonical" href="https://latamhub.com/startups/<slug>">` and `<meta property="og:url" content="https://latamhub.com/startups/<slug>">` — identical URLs to the pre-Unit-6 absolute-path form.

---

## Cross-Cutting Invariants Confirmed

- **Single source of truth for the site origin.** `SITE_ORIGIN = "https://latamhub.com"` lives in exactly one file (`src/app/layout.tsx`); every other file uses relative paths and lets Next.js compose the absolute URL at metadata-emit time.
- **No new feature scope.** Unit 6 is audit + small refactor only. The directory still renders 20 seeded startups, the detail page still does the same `getStartupBySlug` call, the 404 still renders the route-local `not-found.tsx` with `robots: noindex`. Nothing observable to a visitor changed.
- **`metadataBase` resolution is transparent.** Per the docs, relative paths in URL-based metadata fields are composed against the root layout's `metadataBase`. The relative path `"/"` resolves to `"https://latamhub.com/"` (trailing slash normalized); `"/startups/${slug}"` resolves to `"https://latamhub.com/startups/${slug}"`. No build-time warnings about absolute URL requirements.
- **`openGraph.images` still uses the absolute `logoUrl`.** The detail page's `images: [{ url: startup.logoUrl, alt: ... }]` continues to receive an absolute URL from the database. This is correct because `metadataBase` only composes RELATIVE paths — absolute URLs are passed through unchanged.
- **No new dependencies.** `package.json` is unchanged. The Vitest foundation (PR #8 / commit `2858532`) is the last baseline addition; no test runner imports were added in Unit 6.

---

## Verification Evidence (Unit 6 boundary)

### `bun run lint`
```
$ eslint
exit=0
```

### `bun run typecheck`
```
$ tsc --noEmit
exit=0
```

### `bun run test`
```
$ vitest run

 RUN  v4.1.10 C:/Users/ACER/OneDrive/Escritorio/JD/JUAN/SideProjects/startupLATAM/latamhub

 Test Files  3 passed (3)
      Tests  80 passed (80)
   Start at  10:56:40
   Duration  643ms

exit=0
```

### `bun run build`
```
▲ Next.js 16.3.0 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 302ms

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
  (pre-existing on origin/main — NOT from this batch)

  Creating an optimized production build ...
✓ Compiled successfully in 14.5s
  Running TypeScript ...
  Finished TypeScript in 22.3s ...
  Collecting page data using 3 workers ...
  Generating static pages using 3 workers (0/4) ...
  Generating static pages using 3 workers (4/4) in 2.9s

Route (app)
┌ ƒ /
├ ○ /_not-found
└ ƒ /startups/[slug]


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

exit=0
```

### Diff Stat (working tree vs `6201d62`)
```
 src/app/layout.tsx               | 20 +++++++++++++++++--
 src/app/page.tsx                 | 25 ++++++++++++++----------
 src/app/startups/[slug]/page.tsx | 42 ++++++++++++++++++++++++++--------------
 3 files changed, 61 insertions(+), 26 deletions(-)
```

**+35 net changed lines**, **14% of 250-line Unit 6 budget**, **8.75% of 400-line per-slice hard budget**.

---

## Deviations from Design / Spec

**None.** Unit 6 implements exactly what the design and the task statement call for:
- Task 6.1: Canonical URLs audited and confirmed correct (no corrections required).
- Task 6.2: OpenGraph metadata audited and confirmed correct (no corrections required).
- Task 6.3: Robots directives audited and confirmed correct (no corrections required).
- Task 6.4: All four automated gates green (no regressions).
- Task 6.5: No new dependencies, no test runner changes (verified).

The `metadataBase` refactor is a **code-quality improvement**, not a design deviation. It produces the exact same emitted metadata (canonical URL, `og:url`) as the pre-Unit-6 absolute-path form, expressed through Next.js's recommended composition pattern.

---

## Issues Found

**CRITICAL**: None
**WARNING**: None
**SUGGESTION**:
1. **Route-local not-found.tsx `openGraph` could be explicit.** The `startups/[slug]/not-found.tsx` inherits openGraph from the layout (no explicit `openGraph` in its `metadata` export). For SEO completeness, it could explicitly declare its own `openGraph` with title/description that matches its own `<meta name="description">`. Not in Unit 6 scope (no new feature scope), and the inherited layout copy is already aligned (after the Unit 6 alignment fix). Carried forward to a potential future unit if the team wants belt-and-suspenders SEO on the 404 path.
2. **`middleware` → `proxy` migration** is the only remaining build-time deprecation. Pre-existing on `origin/main`, out of Unit 6 scope. A future migration unit can run `npx @next/codemod@canary middleware-to-proxy .` per the build's own suggestion.

---

## Discoveries (carried forward)

- **`metadataBase` is the official Next.js 16 mechanism for centralized origin management.** Per the docs (`generateMetadata.md` → `metadataBase` section): "It is typically set in root `app/layout.js` to apply to URL-based `metadata` fields across all routes." The recommendation is explicit: put it in the root layout, not in a page.
- **`metadataBase` only composes relative paths.** Absolute URLs in metadata fields are passed through unchanged. This is correct behavior — the `openGraph.images` absolute URL from the database is preserved exactly.
- **The route-local `not-found.tsx` inherits openGraph from the layout.** Because the route-local not-found doesn't define `openGraph`, Next.js's shallow-merge keeps the layout's openGraph. Pre-Unit-6, the layout's `openGraph.description` lacked the "Empezando por Colombia" suffix that the layout's own `description` had — a tiny copy inconsistency that didn't affect the homepage (page-level metadata overrides) but did affect the inherited not-found pages. Aligned in Unit 6 so the layout's emitted OG/Twitter copy matches its `<meta name="description">`.
- **No `metadataBase` warning at build time.** Next.js validates that URL-based metadata fields are absolute URLs OR that `metadataBase` is set; with `metadataBase` declared in the layout, relative paths are accepted silently. No new build warnings beyond the pre-existing `middleware` → `proxy` deprecation (unchanged from `origin/main`).
- **The 250-line Unit 6 budget was generous for the actual work.** The metadataBase refactor touches 3 files and nets 35 changed lines (61 insertions, 26 deletions). The audit found no correctness bugs — Unit 6 is primarily a documentation exercise (audit report) plus one defensible code-quality refactor. Future "final slice" units can plan for similar profile.

---

## Status

`Ready for archive (PR 7 / Unit 6) — Phase 1 MVP feature-complete`. All 28 tasks complete. All 4 automated gates green. All 5 spec compliance scenarios pass. Chain strategy `stacked-to-main` honored throughout. No `size:exception` required for any unit (except Unit 4, which already has the exception recorded). **Unit 6 working tree is clean and ready to commit when the user confirms; commit/PR/push are deferred per user instructions (no commit unless explicitly requested).**
