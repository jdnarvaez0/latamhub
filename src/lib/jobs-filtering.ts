/**
 * URL contract and pure filtering predicate for the public jobs directory.
 *
 * Mirrors the architecture of `lib/filtering.ts` (startup directory):
 * URL search params are the single source of truth; this module is
 * isomorphic (no React imports) so it is safe in Server Components,
 * Client Components, and `generateMetadata`.
 *
 * ## URL contract
 *
 * | Param      | Cardinality | Encoding              | Default | Notes                              |
 * |------------|-------------|-----------------------|---------|------------------------------------|
 * | `q`        | single      | URL-encoded string    | omitted | matches title, startup, area, location |
 * | `country`  | single      | `CO` / `BR` / …       | omitted | matches `startupCountry`           |
 * | `modality` | single      | enum slug             | omitted | unknown → dropped                  |
 *
 * No pagination on `/jobs` in Phase 2 — the initial dataset is small
 * enough to render in a single list. A `page` param can be added in a
 * future slice without breaking this contract.
 */
import type { ReadonlyURLSearchParams } from "next/navigation";
import { COUNTRY_LABELS, MODALITY_LABELS } from "@/lib/constants";
import type { Country, JobWithStartup, Modality } from "@/lib/types";

// ---------------------------------------------------------------------------
// Validation sets (closed from their respective label maps).
// ---------------------------------------------------------------------------

const COUNTRY_SET: ReadonlySet<string> = new Set(Object.keys(COUNTRY_LABELS));
const MODALITY_SET: ReadonlySet<string> = new Set(Object.keys(MODALITY_LABELS));

// ---------------------------------------------------------------------------
// JobsFilter type & defaults.
// ---------------------------------------------------------------------------

/**
 * Normalized URL state for the /jobs page. All fields are required after
 * `parseJobsUrl`; callers never need to null-check.
 */
export interface JobsFilter {
  /** Free-text query (trimmed). Empty string = no filter. */
  q: string;
  /** Country code to filter by, or `null` for all countries. */
  country: Country | null;
  /** Modality to filter by, or `null` for all modalities. */
  modality: Modality | null;
}

/** The default state for an empty URL — no active filters. */
export const DEFAULT_JOBS_FILTER: JobsFilter = {
  q: "",
  country: null,
  modality: null,
};

// ---------------------------------------------------------------------------
// Internal helpers (mirrors filtering.ts pattern).
// ---------------------------------------------------------------------------

function getParam(
  sp: URLSearchParams | ReadonlyURLSearchParams,
  key: string
): string | null {
  return sp.get(key);
}

function normalizeEnum<T extends string>(
  value: string | null,
  set: ReadonlySet<string>
): T | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return set.has(trimmed) ? (trimmed as T) : null;
}

// ---------------------------------------------------------------------------
// Parse & build (URL SSOT round-trip).
// ---------------------------------------------------------------------------

/**
 * Parse a `URLSearchParams`-shaped object into a normalized `JobsFilter`.
 * Unknown enum values are silently dropped. Never throws.
 */
export function parseJobsUrl(
  sp: URLSearchParams | ReadonlyURLSearchParams
): JobsFilter {
  const q = (getParam(sp, "q") ?? "").trim();
  const country = normalizeEnum<Country>(getParam(sp, "country"), COUNTRY_SET);
  const modality = normalizeEnum<Modality>(
    getParam(sp, "modality"),
    MODALITY_SET
  );
  return { q, country, modality };
}

/**
 * Serialize a `JobsFilter` back to a query string.
 *
 * - Empty / null values → key omitted.
 * - `pathname` is optional; when supplied the result is `<pathname>?...`.
 */
export function buildJobsUrl(
  filter: JobsFilter,
  pathname: string = ""
): string {
  const params = new URLSearchParams();
  if (filter.q.length > 0) params.set("q", filter.q);
  if (filter.country !== null) params.set("country", filter.country);
  if (filter.modality !== null) params.set("modality", filter.modality);
  const qs = params.toString();
  return `${pathname}${qs.length > 0 ? `?${qs}` : ""}`;
}

// ---------------------------------------------------------------------------
// Predicate.
// ---------------------------------------------------------------------------

/**
 * Build a lowercase haystack string for text search. Scans: title,
 * startup name, area, location, and startupCity — the fields visible in
 * a job row.
 */
function jobSearchHaystack(job: JobWithStartup): string {
  return [
    job.title,
    job.startupName,
    job.area ?? "",
    job.location ?? "",
    job.startupCity ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Apply a `JobsFilter` to a list of `JobWithStartup` rows. Pure,
 * idempotent, safe to memoize or run on both server and client.
 */
export function filterJobs(
  jobs: JobWithStartup[],
  filter: JobsFilter
): JobWithStartup[] {
  const haystackQ = filter.q.toLowerCase().trim();
  const hasQ = haystackQ.length > 0;

  return jobs.filter((job) => {
    if (filter.country !== null && job.startupCountry !== filter.country) {
      return false;
    }
    if (filter.modality !== null && job.modality !== filter.modality) {
      return false;
    }
    if (hasQ && !jobSearchHaystack(job).includes(haystackQ)) {
      return false;
    }
    return true;
  });
}
