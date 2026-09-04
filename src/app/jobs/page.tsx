/**
 * Jobs page — public active vacancies directory at `/jobs`.
 *
 * Spec: `jobs-directory`, `jobs-filters`.
 *
 * ## Architecture
 *
 * Same Server-Client island pattern as the startup directory (`app/page.tsx`):
 *  1. Fetches all active jobs (approved startups only) via `getActiveJobs()`.
 *  2. Branches on the discriminated union:
 *     - `ok: false` → error empty state.
 *     - `ok: true`  → <Suspense> wrapping <JobsClient>, which owns the
 *       URL-based filter state and the interactive list.
 *  3. Exports explicit page metadata (title, description, canonical, OG).
 *
 * The `metadataBase` in root `layout.tsx` resolves relative paths in
 * `alternates.canonical` and `openGraph.url` against `https://latamhub.com`.
 */
import { Suspense } from "react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { JobsClient } from "@/components/jobs/jobs-client";
import { JobsEmptyState } from "@/components/jobs/jobs-empty-state";
import { getActiveJobs } from "@/lib/queries";

const JOBS_TITLE = "Empleos en startups de Latinoamérica | Col/Labs";
const JOBS_DESCRIPTION =
  "Todas las vacantes abiertas en startups de LatAm: ingeniería, producto, datos, comercial y operaciones. Filtrá por país y modalidad.";

export const metadata: Metadata = {
  title: JOBS_TITLE,
  description: JOBS_DESCRIPTION,
  alternates: {
    canonical: "/jobs",
  },
  openGraph: {
    title: JOBS_TITLE,
    description: JOBS_DESCRIPTION,
    url: "/jobs",
    siteName: "Col/Labs",
    type: "website",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: JOBS_TITLE,
    description: JOBS_DESCRIPTION,
  },
};

/** Suspense fallback while <JobsClient> hydrates. */
function JobsSkeleton() {
  return (
    <section aria-label="Cargando vacantes" className="space-y-4">
      <EmptyState
        title="Cargando vacantes…"
        hint="Buscando las vacantes activas en la base de datos."
      />
    </section>
  );
}

export default async function JobsPage() {
  const result = await getActiveJobs();

  if (!result.ok) {
    return (
      <main className="flex-1 px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <JobsEmptyState variant="error" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      {/* Page header */}
      <header className="border-b border-border bg-surface px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            {result.jobs.length} vacantes abiertas
          </div>
          <h1 className="animate-reveal mt-4 text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Trabajá en la{" "}
            <span className="text-primary">próxima</span> gran empresa
            latinoamericana.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-base sm:text-lg">
            Vacantes activas en startups aprobadas de toda LatAm. Filtrá por
            país, modalidad o buscá por área y empresa.
          </p>
        </div>
      </header>

      {/* Content */}
      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <Suspense fallback={<JobsSkeleton />}>
            <JobsClient jobs={result.jobs} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
