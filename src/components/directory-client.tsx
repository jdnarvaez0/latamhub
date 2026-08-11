/**
 * `DirectoryClient` — the only client island in the public-directory
 * chain.
 *
 * Spec: `startup-directory` "Interactive directory client",
 * `startup-filters`, `directory-pagination`, `directory-states`.
 *
 * ## URL as single source of truth
 *
 *  - `useSearchParams()` → `parseDirectoryUrl` → `DirectoryFilter` on
 *    every render. No shadow state.
 *  - All mutations write via `router.replace(url, { scroll: false })`.
 *    `replace` keeps the back button clean; `scroll: false` keeps the
 *    visitor at their scroll position.
 *  - URL strings come from `buildDirectoryUrl(filter, pathname)`. The
 *    parser and builder stay single-venue in `@/lib/filtering`.
 *  - Page reset (design §5) lives in `<FilterPanel/>`'s
 *    `applyChange`; this island does not need to know.
 *
 * ## Composition
 *
 * Three pieces compose inside this shell:
 *  - `<FilterPanel/>` (Unit 3A + 3B) — controlled inputs.
 *  - `<StartupGrid/>` (Unit 2) — row list + count + empty state.
 *  - `<Pagination/>` (Unit 2) — numbered controls with real
 *    `<Link replace scroll={false}>` via the `buildHref` callback.
 *
 * When the filtered list is empty the island wires a "Limpiar
 * filtros" action into `<StartupGrid/>` so the visitor can recover
 * without reloading.
 *
 * ## Memoization
 *
 *  - `parseDirectoryUrl` + `filterStartups` + `computeFilterPanelOptions`
 *    run inside `useMemo` keyed by `rows` + `searchParams` so a URL
 *    mutation that does not change the filter (e.g. page navigation)
 *    does not re-filter.
 *  - `goToFilter` and `buildPageHref` are `useCallback`'d so the
 *    children's effect / ref dependencies stay stable.
 *
 * ## Suspense
 *
 * `useSearchParams` requires `<Suspense/>` in production builds. The
 * Server Component (`app/page.tsx`) wraps this island in
 * `<Suspense fallback={<DirectorySkeleton/>}>`.
 */
"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { FilterPanel } from "@/components/filters";
import { hasActiveFilters } from "@/components/filters/option";
import { Pagination } from "@/components/pagination";
import { StartupGrid } from "@/components/startup-grid";
import { computeFilterPanelOptions } from "@/lib/directory-options";
import {
  buildDirectoryUrl,
  clampPage,
  DEFAULT_FILTER,
  filterStartups,
  paginateStartups,
  parseDirectoryUrl,
  totalPages,
  type DirectoryFilter,
} from "@/lib/filtering";
import type { Startup } from "@/lib/types";

export interface DirectoryClientProps {
  /**
   * The full set of approved startups, fetched on the server by
   * `getApprovedStartups()`. The island never re-fetches; filtering
   * is in-memory and matches the seed dataset size (20 rows). See
   * `docs/ARCHITECTURE.md §4` for the >500-row threshold.
   */
  startups: Startup[];
}

const CLEAR_FILTERS_LABEL = "Limpiar filtros";

/**
 * The empty-state "Limpiar filtros" action. Pure props-in / callback-
 * out — no URL parsing here. The parent's `onClick` emits the default
 * filter; `buildDirectoryUrl` serializes it to a clean URL.
 */
function ClearFiltersAction({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press inline-flex items-center justify-center bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
    >
      {CLEAR_FILTERS_LABEL}
    </button>
  );
}

export function DirectoryClient({ startups }: DirectoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive filter from the URL — same value on SSR first paint and
  // post-hydration, so the markup matches and there is no flicker.
  const filter: DirectoryFilter = useMemo(
    () => parseDirectoryUrl(searchParams),
    [searchParams]
  );

  // Apply the filter to the approved-startup set.
  const filteredRows = useMemo(
    () => filterStartups(startups, filter),
    [startups, filter]
  );

  // Compute panel options (static counts — see directory-options.ts).
  const options = useMemo(
    () => computeFilterPanelOptions(startups, filter),
    [startups, filter]
  );

  // Page boundaries: clamp protects against a stale URL pointing past
  // the last page after a filter change shrank the list.
  const total = totalPages(filteredRows);
  const currentPage = clampPage(filter.page, total);
  const pageRows = paginateStartups(filteredRows, currentPage);

  // Stable callbacks so children's effect / ref deps don't churn.
  const goToFilter = useCallback(
    (next: DirectoryFilter) => {
      const url = buildDirectoryUrl(next, pathname);
      router.replace(url, { scroll: false });
    },
    [pathname, router]
  );

  const buildPageHref = useCallback(
    (page: number) =>
      buildDirectoryUrl({ ...filter, page }, pathname),
    [filter, pathname]
  );

  // Clear all filters back to DEFAULT_FILTER. Wired into both the
  // panel's "Limpiar filtros" and the empty-state's "Limpiar filtros".
  const handleClearAll = useCallback(() => {
    goToFilter(DEFAULT_FILTER);
  }, [goToFilter]);

  const isEmpty = filteredRows.length === 0;
  const showClearAction = isEmpty && hasActiveFilters(filter);

  return (
    <section className="flex flex-col gap-12 md:flex-row md:items-start">
      <FilterPanel
        filter={filter}
        options={options}
        onChange={goToFilter}
        onClearAll={handleClearAll}
        className="w-full md:w-64 md:shrink-0"
      />
      <div className="min-w-0 flex-1 space-y-8">
        <StartupGrid
          pageRows={pageRows}
          count={filteredRows.length}
          emptyAction={
            showClearAction ? (
              <ClearFiltersAction onClick={handleClearAll} />
            ) : undefined
          }
        />
        <Pagination
          currentPage={currentPage}
          totalPages={total}
          buildHref={buildPageHref}
        />
      </div>
    </section>
  );
}
