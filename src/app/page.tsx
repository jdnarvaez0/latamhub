/**
 * Root home page — the public directory at `/`.
 *
 * Spec: `startup-directory`, `startup-filters`, `directory-pagination`,
 * `directory-states`.
 *
 * ## Architecture (Option C, design §1–§7)
 *
 * The page is a Server Component that:
 *
 *  1. Fetches the approved startup set once via `getApprovedStartups()`
 *     (the only Supabase round-trip per request — Unit 1 surface).
 *  2. Branches on the discriminated union:
 *      - `ok: false` → `<DirectoryErrorState/>` (Unit 4, client island).
 *      - `ok: true`  → `<Suspense>` wrapping `<DirectoryClient/>`,
 *        which derives filter state from `useSearchParams()` and
 *        composes the controlled filter family + the presentational
 *        row grid + the numbered pagination (Units 2, 3A, 3B, 4).
 *  3. Exports explicit page-level `metadata` so the live directory's
 *     SEO is independent of the root layout (design §13, decision §13):
 *      - `alternates.canonical` → `https://latamhub.com/`
 *      - `openGraph.type` → `"website"`, `locale` → `"es_CO"`.
 *
 * ## Suspense around `useSearchParams`
 *
 * `<DirectoryClient/>` uses `useSearchParams()`. In production builds,
 * that hook requires a `<Suspense/>` boundary or the build fails with
 * "Missing Suspense boundary with useSearchParams" (Next 16). The
 * fallback renders a minimal skeleton so first paint matches the
 * island's eventual render and there is no layout shift after
 * hydration. The skeleton mirrors the directory's visual rhythm
 * (dashed-card placeholder) without leaking any real data.
 *
 * ## Why metadata is local, not inherited
 *
 * The root `layout.tsx` already declares a generic `Metadata` object
 * (title, description, OG, Twitter). The page-level export **shallow-
 * merges** with the root for any field we do not re-declare, and
 * **replaces** every field we do (the metadata merging rules in
 * Next 16 treat page metadata as overrides). We override:
 *  - `title` and `description` to match the directory's purpose.
 *  - `alternates.canonical` (the layout does not declare one).
 *  - `openGraph.type` and `openGraph.locale` (the layout already
 *    declares `es_CO`, but we re-declare to make the homepage's
 *    `og:type=website` explicit).
 *
 * The metadata export is **Server Component only** — Next.js refuses
 * it in Client Components, which is why the page is a Server
 * Component and the directory state lives in the client island.
 */
import { Suspense } from "react";
import type { Metadata } from "next";

import { DirectoryClient } from "@/components/directory-client";
import { DirectoryErrorState } from "@/components/directory-error-state";
import { EmptyState } from "@/components/empty-state";
import { getApprovedStartups } from "@/lib/queries";

/**
 * Canonical site origin used by the homepage metadata. Centralised as
 * a constant so the SEO sweep (Unit 6) can audit every absolute URL
 * against the same value.
 */
const SITE_ORIGIN = "https://latamhub.com";

/**
 * Homepage title — the page-level override of the root layout's
 * generic title. Includes the directory's brand voice and the
 * canonical product description.
 */
const HOMEPAGE_TITLE = "Col/Labs — Directorio de startups de Latinoamérica";

/**
 * Homepage description. Same wording as the root layout for now (the
 * directory IS the product), kept here so a future per-page tweak
 * (e.g. "Directorio de startups colombianas") lands in this file.
 */
const HOMEPAGE_DESCRIPTION =
  "Directorio del ecosistema startup de LatAm: empresas, industrias, etapas y vacantes abiertas. Empezando por Colombia.";

/**
 * Static page metadata. We use the static `metadata` export (not
 * `generateMetadata`) because the homepage does not depend on any
 * request-time data — the directory data is fetched inside the page
 * body, not by the metadata resolver.
 */
export const metadata: Metadata = {
  title: HOMEPAGE_TITLE,
  description: HOMEPAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_ORIGIN}/`,
  },
  openGraph: {
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    url: `${SITE_ORIGIN}/`,
    siteName: "Col/Labs",
    type: "website",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
  },
};

/**
 * Suspense fallback rendered while the `<DirectoryClient/>` island
 * hydrates. Matches the directory's dashed-card visual rhythm so the
 * layout does not shift after hydration.
 */
function DirectorySkeleton() {
  return (
    <section
      aria-label="Cargando directorio"
      className="space-y-8"
    >
      <EmptyState
        title="Cargando directorio…"
        hint="Buscando las startups aprobadas en la base de datos."
      />
    </section>
  );
}

export default async function Home() {
  const result = await getApprovedStartups();

  if (!result.ok) {
    return <DirectoryErrorState message={result.error} />;
  }

  return (
    <main className="flex-1 px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={<DirectorySkeleton />}>
          <DirectoryClient startups={result.startups} />
        </Suspense>
      </div>
    </main>
  );
}
