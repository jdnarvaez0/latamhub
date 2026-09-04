/**
 * JobsClient — the only client island in the /jobs page chain.
 *
 * Mirrors DirectoryClient in architecture:
 *  - useSearchParams() → parseJobsUrl → JobsFilter (URL SSOT)
 *  - All mutations → buildJobsUrl + router.replace(url, { scroll: false })
 *  - filterJobs runs in useMemo keyed by [jobs, searchParams]
 *  - Stable callbacks via useCallback so children's deps don't churn
 *
 * Composition:
 *  - <JobFilters> (controlled: filter + onChange patch)
 *  - <JobRow> list (or <JobsEmptyState> when empty)
 *
 * The Server Component (app/jobs/page.tsx) wraps this island in
 * <Suspense> because useSearchParams requires it in production builds.
 */
"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { JobFilters } from "@/components/jobs/job-filters";
import { JobRow } from "@/components/jobs/job-row";
import { JobsEmptyState } from "@/components/jobs/jobs-empty-state";
import {
  buildJobsUrl,
  DEFAULT_JOBS_FILTER,
  filterJobs,
  parseJobsUrl,
  type JobsFilter,
} from "@/lib/jobs-filtering";
import type { JobWithStartup } from "@/lib/types";

export interface JobsClientProps {
  /** All active jobs (approved startups only), fetched on the server. */
  jobs: JobWithStartup[];
}

/** "Limpiar filtros" button wired by the island, not the empty state. */
function ClearFiltersAction({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press inline-flex items-center justify-center bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
    >
      Limpiar filtros
    </button>
  );
}

export function JobsClient({ jobs }: JobsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive filter from the URL — single source of truth.
  const filter: JobsFilter = useMemo(
    () => parseJobsUrl(searchParams),
    [searchParams]
  );

  // Apply the filter in-memory.
  const filteredJobs = useMemo(
    () => filterJobs(jobs, filter),
    [jobs, filter]
  );

  // Stable mutation callback.
  const applyPatch = useCallback(
    (patch: Partial<JobsFilter>) => {
      const next: JobsFilter = { ...filter, ...patch };
      const url = buildJobsUrl(next, pathname);
      router.replace(url, { scroll: false });
    },
    [filter, pathname, router]
  );

  const handleClearAll = useCallback(() => {
    router.replace(buildJobsUrl(DEFAULT_JOBS_FILTER, pathname), {
      scroll: false,
    });
  }, [pathname, router]);

  const hasFilters =
    filter.q.length > 0 ||
    filter.country !== null ||
    filter.modality !== null;

  return (
    <div className="space-y-8">
      {/* Filter bar */}
      <JobFilters filter={filter} onChange={applyPatch} />

      {/* Result count */}
      <p className="text-muted-foreground font-mono text-[11px] uppercase tracking-widest">
        {filteredJobs.length === 0
          ? "Sin resultados"
          : filteredJobs.length === 1
            ? "1 vacante"
            : `${filteredJobs.length} vacantes`}
      </p>

      {/* List or empty state */}
      {filteredJobs.length === 0 ? (
        <JobsEmptyState
          variant="no-results"
          action={
            hasFilters ? (
              <ClearFiltersAction onClick={handleClearAll} />
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job, i) => (
            <JobRow key={job.id} job={job} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
