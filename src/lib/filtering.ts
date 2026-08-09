/**
 * URL contract and pure filtering predicate for the public directory.
 *
 * The URL search params are the single source of truth for filter, search
 * and page state. Both the server (SSR / first paint) and the client island
 * (`DirectoryClient`) call into this module so the markup matches and there
 * is no hydration mismatch.
 *
 * The module is isomorphic (no `"use client"`, no `useEffect`, no React
 * imports) so it can be imported from Server Components, Client Components
 * and `generateMetadata` without pulling Next runtime into the predicate.
 *
 * ## URL contract
 *
 * | Param      | Cardinality | Encoding                          | Default   | Notes |
 * |------------|-------------|-----------------------------------|-----------|-------|
 * | `q`        | single      | URL-encoded string                | omitted   | debounced text search |
 * | `industry` | multi       | repeated `industry=<slug>`        | omitted   | startup matches iff its `industry` ∈ set |
 * | `country`  | single      | `CO` only live in Phase 1         | omitted   | drives `city` option list |
 * | `city`     | single      | URL-encoded label                 | omitted   | ignored unless valid for the selected `country`; clearing `country` clears `city` |
 * | `stage`    | single      | enum slug                         | omitted   | unknown → dropped |
 * | `modality` | single      | enum slug                         | omitted   | unknown → dropped |
 * | `page`     | single      | integer ≥ 1                       | omitted   | reset (omitted) when any other param changes; clamped to `[1, totalPages]` |
 *
 * Parsing is single-venue (`parseDirectoryUrl(searchParams)`) and validated
 * against `INDUSTRY_LABELS` / `COUNTRY_LABELS` / `STAGE_LABELS` /
 * `MODALITY_LABELS`. Empty / unset = no filter. Unknown or coming-soon
 * values are dropped so the URL stays authoritative but harmless.
 */
import type { ReadonlyURLSearchParams } from "next/navigation";
import {
  COUNTRY_LABELS,
  INDUSTRY_LABELS,
  MODALITY_LABELS,
  STAGE_LABELS,
} from "@/lib/constants";
import type { Country, Modality, Stage, Startup } from "@/lib/types";

/**
 * The closed set of single-value enum keys we accept in the URL. Used by
 * `parseDirectoryUrl` to validate the `country` / `stage` / `modality`
 * params without re-reading the constant maps.
 */
const COUNTRY_SET: ReadonlySet<string> = new Set(Object.keys(COUNTRY_LABELS));
const STAGE_SET: ReadonlySet<string> = new Set(Object.keys(STAGE_LABELS));
const MODALITY_SET: ReadonlySet<string> = new Set(Object.keys(MODALITY_LABELS));

/**
 * The directory URL state. All fields are required and normalized —
 * callers never need to null-check after `parseDirectoryUrl`.
 */
export interface DirectoryFilter {
  /** Free-text search query (already trimmed). Empty = no filter. */
  q: string;
  /**
   * Industry slugs to match. The set is multi-select; a startup matches
   * when its `industry` slug is in the array. Empty array = no filter.
   */
  industry: string[];
  /** Selected country, or `null` for no country filter. */
  country: Country | null;
  /** Selected city label, or `null` for no city filter. */
  city: string | null;
  /** Selected stage, or `null` for no stage filter. */
  stage: Stage | null;
  /** Selected modality, or `null` for no modality filter. */
  modality: Modality | null;
  /** 1-indexed page number, always ≥ 1. */
  page: number;
}

/** The default state for an empty URL. */
export const DEFAULT_FILTER: DirectoryFilter = {
  q: "",
  industry: [],
  country: null,
  city: null,
  stage: null,
  modality: null,
  page: 1,
};

/**
 * Normalize a single industry slug. Returns `null` if the value is empty
 * or not a known industry — callers should drop `null` values.
 */
function normalizeIndustry(value: string): string | null {
  const slug = value.trim().toLowerCase();
  if (!slug) return null;
  return slug in INDUSTRY_LABELS ? slug : null;
}

/**
 * Normalize a single-value enum field. Returns `null` if the value is
 * empty or not a known enum value.
 */
function normalizeEnum<T extends string>(
  value: string | null,
  set: ReadonlySet<string>
): T | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return set.has(trimmed) ? (trimmed as T) : null;
}

/**
 * Normalize a positive integer from a string. Returns `1` for missing,
 * empty, non-numeric, zero or negative values.
 */
function normalizePage(value: string | null): number {
  if (value === null) return 1;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

/**
 * Read a `URLSearchParams`-shaped value for a single-value param.
 * Accepts both `URLSearchParams` (from `useSearchParams()`) and
 * `ReadonlyURLSearchParams` (Next's wrapper) because the runtime types
 * differ even though the surface is the same.
 */
function getParam(
  sp: URLSearchParams | ReadonlyURLSearchParams,
  key: string
): string | null {
  return sp.get(key);
}

/**
 * Parse a URL search-param object into a normalized `DirectoryFilter`.
 *
 * - Unknown / coming-soon enum values are silently dropped.
 * - City is dropped unless a valid country is also present (design §6).
 * - The page number is clamped to ≥ 1 (callers clamp to `totalPages`
 *   separately once they know the visible count).
 *
 * The function never throws and never returns `null` / `undefined` —
 * callers can render against the result directly.
 */
export function parseDirectoryUrl(
  sp: URLSearchParams | ReadonlyURLSearchParams
): DirectoryFilter {
  const q = (getParam(sp, "q") ?? "").trim();

  // Multi-value: read all `industry` keys (repeated `industry=a&industry=b`).
  const seen = new Set<string>();
  const industry: string[] = [];
  for (const raw of sp.getAll("industry")) {
    const slug = normalizeIndustry(raw);
    if (slug !== null && !seen.has(slug)) {
      seen.add(slug);
      industry.push(slug);
    }
  }

  const country = normalizeEnum<Country>(getParam(sp, "country"), COUNTRY_SET);
  const stage = normalizeEnum<Stage>(getParam(sp, "stage"), STAGE_SET);
  const modality = normalizeEnum<Modality>(
    getParam(sp, "modality"),
    MODALITY_SET
  );

  // City is only meaningful when a country is selected. If the URL has
  // `city=` without a valid `country=`, drop it — same for unknown
  // countries (coming-soon BR/CL/AR/MX) so we never bake a city that the
  // filter UI could not have produced.
  const cityRaw = (getParam(sp, "city") ?? "").trim();
  const city = country !== null && cityRaw.length > 0 ? cityRaw : null;

  const page = normalizePage(getParam(sp, "page"));

  return { q, industry, country, city, stage, modality, page };
}

/**
 * Serialize a `DirectoryFilter` back into a query string. Always returns a
 * string that begins with `?` (or just `?` if everything is empty) so
 * callers can pass the result directly to `router.replace(url, ...)`.
 *
 * - Empty strings / null / empty arrays → key omitted.
 * - `page === 1` → `page` omitted (the canonical first-page URL).
 * - Multi-value `industry` is encoded as repeated `industry=<slug>` keys.
 *
 * `pathname` is optional. When supplied, the result is `<pathname>?...`;
 * when omitted, the result is just `?...`. The directory client always
 * passes a pathname; the parser tests do not.
 */
export function buildDirectoryUrl(
  filter: DirectoryFilter,
  pathname: string = ""
): string {
  const params = new URLSearchParams();

  if (filter.q.length > 0) {
    params.set("q", filter.q);
  }

  for (const slug of filter.industry) {
    params.append("industry", slug);
  }

  if (filter.country !== null) {
    params.set("country", filter.country);
  }

  if (filter.city !== null) {
    params.set("city", filter.city);
  }

  if (filter.stage !== null) {
    params.set("stage", filter.stage);
  }

  if (filter.modality !== null) {
    params.set("modality", filter.modality);
  }

  if (filter.page > 1) {
    params.set("page", String(filter.page));
  }

  const qs = params.toString();
  return `${pathname}${qs.length > 0 ? `?${qs}` : ""}`;
}

/**
 * Lowercase + trim a string. Used by the text-search predicate so the
 * search is case- and whitespace-insensitive.
 */
function normalizeQuery(value: string): string {
  return value.toLowerCase().trim();
}

/**
 * Build a single string the text search scans. We deliberately do not
 * join `longDescription` — the directory list view is built from the
 * short fields, and including the full body would be unfair to short
 * descriptions in substring matches.
 */
function startupSearchHaystack(s: Startup): string {
  return normalizeQuery(
    [s.name, s.description, s.city ?? "", s.industry].join(" ")
  );
}

/**
 * Apply a `DirectoryFilter` to a list of `Startup` rows. Pure, idempotent
 * and deterministic — the same input always produces the same output, so
 * it's safe to memoize and safe to run on both server and client.
 *
 * Order of checks is the cheapest-first order observed during profiling of
 * the seed dataset (~20 rows): country → industry → stage → modality →
 * city → free-text.
 */
export function filterStartups(
  rows: Startup[],
  filter: DirectoryFilter
): Startup[] {
  const haystackQ = normalizeQuery(filter.q);
  const hasQ = haystackQ.length > 0;
  const hasIndustry = filter.industry.length > 0;
  const industrySet = new Set(filter.industry);

  return rows.filter((row) => {
    if (filter.country !== null && row.country !== filter.country) {
      return false;
    }

    if (hasIndustry && !industrySet.has(row.industry)) {
      return false;
    }

    if (filter.stage !== null && row.stage !== filter.stage) {
      return false;
    }

    if (filter.modality !== null) {
      // Modality lives on the startup's jobs, not the startup itself. A
      // startup matches the modality filter iff it has at least one job
      // with that modality.
      const hasModality = row.jobs.some(
        (job) => job.modality === filter.modality
      );
      if (!hasModality) return false;
    }

    if (filter.city !== null && row.city !== filter.city) {
      return false;
    }

    if (hasQ) {
      const haystack = startupSearchHaystack(row);
      if (!haystack.includes(haystackQ)) return false;
    }

    return true;
  });
}

/**
 * Page size for the directory. 8 is the locked value from the design and
 * matches the seed split: 20 / 8 = 3 pages (8 + 8 + 4).
 */
export const DIRECTORY_PAGE_SIZE = 8;

/**
 * Slice a filtered list to a single page. `page` is 1-indexed; values
 * past the end yield an empty array (the client renders the empty state
 * in that case).
 */
export function paginateStartups(
  rows: Startup[],
  page: number
): Startup[] {
  const start = (page - 1) * DIRECTORY_PAGE_SIZE;
  if (start >= rows.length) return [];
  return rows.slice(start, start + DIRECTORY_PAGE_SIZE);
}

/**
 * Total number of pages for a filtered list, with the same page size the
 * client uses. Returns `0` for an empty list so the pagination component
 * can early-return.
 */
export function totalPages(rows: Startup[]): number {
  if (rows.length === 0) return 0;
  return Math.ceil(rows.length / DIRECTORY_PAGE_SIZE);
}

/**
 * Clamp a page number to the valid range `[1, max]`. Returns `1` if
 * `max` is 0 (no rows).
 */
export function clampPage(page: number, max: number): number {
  if (max <= 0) return 1;
  if (page < 1) return 1;
  if (page > max) return max;
  return page;
}
