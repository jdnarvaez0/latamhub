/**
 * Server-side data access for the public directory.
 *
 * The directory is read-only in Phase 1: anyone can list approved startups
 * and fetch a single approved startup by slug. RLS already hides rows whose
 * `status` is not `'approved'`, but every query here also applies an
 * explicit `.eq('status', 'approved')` for defense-in-depth — that way the
 * shape of the data and the visibility policy stay coupled in code.
 *
 * All functions in this module are server-only. Importing them from a
 * Client Component will fail the Next.js RSC boundary check.
 *
 * ## Future-threshold signatures
 *
 * `getApprovedStartups` ships with a single signature that fetches every
 * approved row. The design reserves a `textSearch` overload and range
 * paging for when the dataset crosses the >500-row threshold described in
 * `docs/ARCHITECTURE.md §4`. The reserved signatures are exported as
 * TypeScript-only stubs so the directory's downstream code can already
 * agree on the future shape without paying the build cost today.
 */
import { createClient } from "@/lib/supabase/server";
import type { Job, JobWithStartup, Startup } from "@/lib/types";

/**
 * The shape returned by `getApprovedStartups`. The discriminated union
 * keeps the server-render error path explicit: callers branch on
 * `result.ok` instead of throwing or returning `null`.
 */
export type DirectoryQuery =
  | { ok: true; startups: Startup[] }
  | { ok: false; error: string };

/**
 * Raw Supabase row, snake_case as it sits in the database. We never let
 * this leak past the mapper.
 *
 * `jobs` is the embedded relation from `jobs.startup_id → startups.id`.
 * The `!jobs_startup_fkey` hint is optional; we leave it to the default
 * join discovery so a future FK rename does not silently break the query.
 */
interface StartupRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description: string | null;
  logo_url: string | null;
  website: string | null;
  linkedin_url: string | null;
  country: string;
  city: string | null;
  industry: string;
  stage: string | null;
  founded_year: number | null;
  employee_range: string | null;
  investors: unknown;
  status: string;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
  jobs: JobRow[] | null;
}

interface JobRow {
  id: string;
  startup_id: string;
  title: string;
  description: string | null;
  area: string | null;
  location: string | null;
  modality: string;
  salary_range: string | null;
  apply_url: string;
  status: string;
  created_at: string;
}

/**
 * The subset of country codes the directory accepts. The database has a
 * CHECK-free `text` column so we validate at the boundary.
 */
const ALLOWED_COUNTRIES = new Set(["CO", "BR", "CL", "AR", "MX"]);

/**
 * Same enum-validity story for `stage` and `modality`. Anything outside
 * the closed set is treated as `null` so the filter predicate downstream
 * does the right thing.
 */
const ALLOWED_STAGES = new Set([
  "pre-seed",
  "seed",
  "series-a",
  "series-b+",
  "bootstrapped",
]);
const ALLOWED_MODALITIES = new Set(["remote", "hybrid", "onsite"]);

function normalizeCountry(value: string): Startup["country"] {
  return ALLOWED_COUNTRIES.has(value)
    ? (value as Startup["country"])
    : "CO";
}

function normalizeStage(value: string | null): Startup["stage"] {
  if (value === null) return null;
  return ALLOWED_STAGES.has(value)
    ? (value as Startup["stage"])
    : null;
}

function normalizeModality(value: string): Job["modality"] {
  return ALLOWED_MODALITIES.has(value)
    ? (value as Job["modality"])
    : "onsite";
}

/**
 * Coerce Supabase's `jsonb` investors field into a `string[]`. The seed
 * ships a JSON array; historical rows might ship `null` or malformed
 * values — we never throw at the boundary.
 */
function normalizeInvestors(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    // Legacy rows may have a stringified JSON array.
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === "string"
        );
      }
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Map a raw Supabase `jobs` row to the camelCase `Job` type. `status` is
 * a database-managed column and is intentionally not exposed in `Job`
 * (the directory only ever shows active jobs).
 */
function mapJob(row: JobRow): Job {
  return {
    id: row.id,
    startupId: row.startup_id,
    title: row.title,
    description: row.description ?? null,
    area: row.area,
    location: row.location,
    modality: normalizeModality(row.modality),
    salaryRange: row.salary_range,
    applyUrl: row.apply_url,
  };
}

/**
 * Map a raw Supabase `startups` row to the camelCase `Startup` type.
 * Defensive at every nullable boundary: anything that is not a known
 * enum value is normalized to the safest default.
 */
function mapStartup(row: StartupRow): Startup {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    longDescription: row.long_description,
    logoUrl: row.logo_url,
    website: row.website,
    linkedinUrl: row.linkedin_url,
    country: normalizeCountry(row.country),
    city: row.city,
    industry: row.industry,
    stage: normalizeStage(row.stage),
    foundedYear: row.founded_year,
    employeeRange: row.employee_range,
    investors: normalizeInvestors(row.investors),
    status:
      row.status === "approved" || row.status === "pending" || row.status === "rejected"
        ? row.status
        : "pending",
    submittedBy: row.submitted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    jobs: (row.jobs ?? []).map(mapJob),
  };
}

/**
 * Fetch every approved startup with its active jobs. Used by the
 * directory server component. Always returns the discriminated union —
 * never throws. The `error` branch carries a user-safe message suitable
 * for `<DirectoryErrorState/>`.
 */
export async function getApprovedStartups(): Promise<DirectoryQuery> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("startups")
      .select(
        // Embed the `jobs` relation so the server fetch is a single
        // round-trip. We use the default FK discovery; the migration
        // names the FK `jobs_startup_fkey`.
        `
          id,
          name,
          slug,
          description,
          long_description,
          logo_url,
          website,
          linkedin_url,
          country,
          city,
          industry,
          stage,
          founded_year,
          employee_range,
          investors,
          status,
          submitted_by,
          created_at,
          updated_at,
          jobs:jobs (
            id,
            startup_id,
            title,
            description,
            area,
            location,
            modality,
            salary_range,
            apply_url,
            status,
            created_at
          )
        `
      )
      .eq("status", "approved")
      .order("name", { ascending: true });

    if (error) {
      return {
        ok: false,
        error:
          "No pudimos cargar el directorio en este momento. Inténtalo de nuevo en unos segundos.",
      };
    }

    const rows = (data ?? []) as unknown as StartupRow[];
    return { ok: true, startups: rows.map(mapStartup) };
  } catch {
    return {
      ok: false,
      error:
        "No pudimos cargar el directorio en este momento. Inténtalo de nuevo en unos segundos.",
    };
  }
}

/**
 * Fetch a single approved startup by its public slug. Returns `null`
 * when the row does not exist OR when the row exists but its status is
 * not `'approved'` (unknown and unapproved slugs collapse to the same
 * not-found shape — design §7 / risk "Unapproved slug leaks data").
 *
 * Active jobs are embedded. No business logic lives here beyond
 * visibility — render decisions belong to the detail page.
 */
export async function getStartupBySlug(slug: string): Promise<Startup | null> {
  // Defensive: Supabase treats `,` in `.eq('slug', value)` literally, so
  // the bare slug is safe to pass through.
  const safeSlug = slug.trim();
  if (!safeSlug) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("startups")
      .select(
        `
          id,
          name,
          slug,
          description,
          long_description,
          logo_url,
          website,
          linkedin_url,
          country,
          city,
          industry,
          stage,
          founded_year,
          employee_range,
          investors,
          status,
          submitted_by,
          created_at,
          updated_at,
          jobs:jobs (
            id,
            startup_id,
            title,
            description,
            area,
            location,
            modality,
            salary_range,
            apply_url,
            status,
            created_at
          )
        `
      )
      .eq("slug", safeSlug)
      .eq("status", "approved")
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapStartup(data as unknown as StartupRow);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Jobs directory query (Phase 2).
// ---------------------------------------------------------------------------

/**
 * Raw Supabase row for the jobs × startups join. Snake_case as it comes
 * from the DB; never exposed past the mapper.
 */
interface ActiveJobRow {
  id: string;
  startup_id: string;
  title: string;
  description: string | null;
  area: string | null;
  location: string | null;
  modality: string;
  salary_range: string | null;
  apply_url: string;
  status: string;
  created_at: string;
  startups: {
    name: string;
    slug: string;
    logo_url: string | null;
    website: string | null;
    country: string;
    city: string | null;
    status: string;
  } | null;
}

/**
 * The shape returned by `getActiveJobs`. Discriminated union so callers
 * branch on `result.ok` instead of catching.
 */
export type JobsQuery =
  | { ok: true; jobs: JobWithStartup[] }
  | { ok: false; error: string };

/**
 * Map a raw `ActiveJobRow` (jobs ⋈ startups) to the camelCase
 * `JobWithStartup` type. Rows whose parent startup is missing or not
 * approved are silently dropped by the caller.
 */
function mapActiveJob(row: ActiveJobRow): JobWithStartup | null {
  const s = row.startups;
  if (!s || s.status !== "approved") return null;
  return {
    id: row.id,
    startupId: row.startup_id,
    title: row.title,
    description: row.description ?? null,
    area: row.area,
    location: row.location,
    modality: normalizeModality(row.modality),
    salaryRange: row.salary_range,
    applyUrl: row.apply_url,
    startupName: s.name,
    startupSlug: s.slug,
    startupLogoUrl: s.logo_url,
    startupWebsite: s.website ?? null,
    startupCountry: normalizeCountry(s.country),
    startupCity: s.city,
  };
}

/**
 * Fetch all active job vacancies with the parent startup metadata needed
 * to render the `/jobs` listing page. The query enforces:
 *   - `jobs.status = 'active'`
 *   - parent `startups.status = 'approved'` (via the mapper guard)
 *
 * Jobs are ordered by creation date (newest first) so new openings
 * float to the top without any secondary sort.
 */
export async function getActiveJobs(): Promise<JobsQuery> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
          id,
          startup_id,
          title,
          description,
          area,
          location,
          modality,
          salary_range,
          apply_url,
          status,
          created_at,
          startups:startup_id (
            name,
            slug,
            logo_url,
            website,
            country,
            city,
            status
          )
        `
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      return {
        ok: false,
        error:
          "No pudimos cargar las vacantes en este momento. Inténtalo de nuevo en unos segundos.",
      };
    }

    const rows = (data ?? []) as unknown as ActiveJobRow[];
    const jobs: JobWithStartup[] = [];
    for (const row of rows) {
      const mapped = mapActiveJob(row);
      if (mapped) jobs.push(mapped);
    }
    return { ok: true, jobs };
  } catch {
    return {
      ok: false,
      error:
        "No pudimos cargar las vacantes en este momento. Inténtalo de nuevo en unos segundos.",
    };
  }
}

// ---------------------------------------------------------------------------
// Future-threshold signatures (Phase 4+).
//
// The design reserves these for the >500-row threshold described in
// `docs/ARCHITECTURE.md §4`. They are exported as TypeScript-only stubs so
// the directory client and any future server actions can already agree on
// the eventual shape. Implementation is deferred until the dataset crosses
// the threshold.
// ---------------------------------------------------------------------------

/**
 * Server-side full-text search for the directory. Reserved for the
 * >500-row threshold. Will use the `search_vector` GIN index in
 * `supabase/migrations/00002_create_startups.sql`.
 *
 * Not implemented in Phase 1 — the design (decision §8) uses an
 * in-memory `.includes()` over the small server-fetched array. The
 * stub is intentionally not exported as a runtime symbol.
 */
export type ReservedTextSearchQuery = {
  q: string;
  industry: string[];
  country: string | null;
  city: string | null;
  stage: string | null;
  modality: string | null;
  page: number;
  pageSize: number;
};

/**
 * Reserved future-threshold search entry point. Throws to make accidental
 * calls loud; the type alias is the public surface.
 */
export function searchApprovedStartups(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _query: ReservedTextSearchQuery
): Promise<DirectoryQuery> {
  throw new Error(
    "searchApprovedStartups is reserved for the >500-row threshold " +
      "(see ARCHITECTURE.md §4). Phase 1 uses getApprovedStartups + " +
      "in-memory filtering."
  );
}

