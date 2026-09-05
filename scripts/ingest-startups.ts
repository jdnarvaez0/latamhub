/**
 * ingest-startups.ts
 *
 * Fetches startup metadata + open job listings from public ATS APIs
 * (Greenhouse, Lever, Workable, Ashby) and upserts them into Supabase.
 *
 * Sources per startup are defined in scripts/data/startups-catalog.ts.
 * Each source is tried in order; the first one that returns ≥1 job wins.
 * If all sources return 0 jobs, the startup is still upserted (jobs = empty).
 *
 * Usage:
 *   bun run scripts/ingest-startups.ts
 *   bun run scripts/ingest-startups.ts --dry-run      # print plan, no writes
 *   bun run scripts/ingest-startups.ts --slug rappi    # single startup
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY   (read)
 *   SUPABASE_SERVICE_ROLE_KEY       (write — needed for upsert bypassing RLS)
 */

import { createClient } from "@supabase/supabase-js";
import { STARTUPS_CATALOG, type JobSource } from "./data/startups-catalog";

// ─── Config ─────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes("--dry-run");
const SLUG_FILTER = (() => {
  const idx = process.argv.indexOf("--slug");
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing env vars. Add to .env.local:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL\n" +
      "  SUPABASE_SERVICE_ROLE_KEY\n\n" +
      "Find the service role key at:\n" +
      "  https://supabase.com/dashboard/project/_/settings/api"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ─── ATS Adapters ────────────────────────────────────────────────────────────

interface NormalizedJob {
  title: string;
  description: string | null;
  area: string | null;
  location: string | null;
  modality: "remote" | "hybrid" | "onsite";
  salaryRange: string | null;
  applyUrl: string;
}

/** Clean HTML entities and tags into readable plaintext */
function stripHtmlOrNormalize(html: string | undefined | null): string | null {
  if (!html) return null;
  const decoded = html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  const text = decoded
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<h[1-6][^>]*>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text || null;
}

/** Infer modality from location/remote strings */
function inferModality(
  locationStr: string | null | undefined,
  remoteFlag: boolean | null | undefined
): "remote" | "hybrid" | "onsite" {
  if (remoteFlag) return "remote";
  const l = (locationStr ?? "").toLowerCase();
  if (l.includes("remoto") || l.includes("remote") || l.includes("anywhere"))
    return "remote";
  if (l.includes("híbrido") || l.includes("hybrid")) return "hybrid";
  return "onsite";
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "latamhub-ingest/1.0" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ── Greenhouse ─────────────────────────────────────────────────────────────

interface GHJob {
  id: number;
  title: string;
  absolute_url: string;
  location: { name: string };
  departments?: Array<{ name: string }>;
  metadata?: Array<{ name: string; value: string }> | null;
  content?: string;
}
interface GHResponse {
  jobs: GHJob[];
}

async function fetchGreenhouse(token: string): Promise<NormalizedJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`;
  const data = await fetchJson<GHResponse>(url);
  if (!data?.jobs?.length) return [];

  return data.jobs.map((j) => ({
    title: j.title,
    description: stripHtmlOrNormalize(j.content),
    area: j.departments?.[0]?.name ?? null,
    location: j.location?.name ?? null,
    modality: inferModality(j.location?.name, null),
    salaryRange: null,
    applyUrl: j.absolute_url,
  }));
}

// ── Lever ──────────────────────────────────────────────────────────────────

interface LeverJob {
  id: string;
  text: string;
  hostedUrl: string;
  description?: string;
  descriptionPlain?: string;
  categories: {
    team?: string;
    location?: string;
    commitment?: string;
  };
  salaryRange?: { min?: number; max?: number; currency?: string };
}

async function fetchLever(token: string): Promise<NormalizedJob[]> {
  const url = `https://api.lever.co/v0/postings/${token}?mode=json&state=published`;
  const data = await fetchJson<LeverJob[]>(url);
  if (!Array.isArray(data) || !data.length) return [];

  return data.map((j) => {
    const commitment = (j.categories.commitment ?? "").toLowerCase();
    let modality: "remote" | "hybrid" | "onsite" = "onsite";
    if (commitment.includes("remote") || commitment.includes("remoto"))
      modality = "remote";
    else if (commitment.includes("hybrid") || commitment.includes("híbrido"))
      modality = "hybrid";
    else modality = inferModality(j.categories.location, null);

    let salaryRange: string | null = null;
    if (j.salaryRange?.min && j.salaryRange?.max) {
      const currency = j.salaryRange.currency ?? "USD";
      salaryRange = `${currency} ${j.salaryRange.min.toLocaleString()} - ${j.salaryRange.max.toLocaleString()}`;
    }

    return {
      title: j.text,
      description: j.descriptionPlain ?? stripHtmlOrNormalize(j.description),
      area: j.categories.team ?? null,
      location: j.categories.location ?? null,
      modality,
      salaryRange,
      applyUrl: j.hostedUrl,
    };
  });
}

// ── Workable ───────────────────────────────────────────────────────────────

interface WorkableJob {
  id: string;
  title: string;
  url: string;
  description?: string;
  location: { location_str: string; remote: boolean };
  department: string;
}
interface WorkableResponse {
  jobs: WorkableJob[];
}

async function fetchWorkable(token: string): Promise<NormalizedJob[]> {
  const url = `https://apply.workable.com/api/v1/widget/jobs/?account=${token}`;
  const data = await fetchJson<WorkableResponse>(url);
  if (!data?.jobs?.length) return [];

  return data.jobs.map((j) => ({
    title: j.title,
    description: stripHtmlOrNormalize(j.description),
    area: j.department ?? null,
    location: j.location.location_str ?? null,
    modality: inferModality(j.location.location_str, j.location.remote),
    salaryRange: null,
    applyUrl: j.url,
  }));
}

// ── Ashby ──────────────────────────────────────────────────────────────────

interface AshbyJob {
  id: string;
  title: string;
  jobUrl: string;
  location: string;
  isRemote: boolean;
  descriptionHtml?: string;
  descriptionPlain?: string;
  team?: { name: string };
  compensationTierSummary?: string;
}
interface AshbyResponse {
  jobs: AshbyJob[];
}

async function fetchAshby(token: string): Promise<NormalizedJob[]> {
  const url = `https://jobs.ashbyhq.com/api/non-user-facing/job-board/jobs?organizationHostedJobsPageName=${token}`;
  const data = await fetchJson<AshbyResponse>(url);
  if (!data?.jobs?.length) return [];

  return data.jobs.map((j) => ({
    title: j.title,
    description: j.descriptionPlain ?? stripHtmlOrNormalize(j.descriptionHtml),
    area: j.team?.name ?? null,
    location: j.location ?? null,
    modality: inferModality(j.location, j.isRemote),
    salaryRange: j.compensationTierSummary ?? null,
    applyUrl: j.jobUrl,
  }));
}

// ── Dispatcher ─────────────────────────────────────────────────────────────

async function fetchJobsFromSource(source: JobSource): Promise<NormalizedJob[]> {
  switch (source.type) {
    case "greenhouse":
      return fetchGreenhouse(source.token);
    case "lever":
      return fetchLever(source.token);
    case "workable":
      return fetchWorkable(source.token);
    case "ashby":
      return fetchAshby(source.token);
    case "careers_url":
      // No API — returns empty; used only for reference/logging
      return [];
  }
}

/** Try each source in order; return first non-empty result. */
async function fetchJobs(
  slug: string,
  sources: JobSource[]
): Promise<{ jobs: NormalizedJob[]; source: string }> {
  for (const source of sources) {
    if (source.type === "careers_url") continue; // skip fallback URLs
    process.stdout.write(`    [${source.type}:${source.token}] `);
    const jobs = await fetchJobsFromSource(source);
    if (jobs.length > 0) {
      console.log(`✓ ${jobs.length} jobs`);
      return { jobs, source: `${source.type}:${source.token}` };
    }
    console.log("0 jobs");
  }

  // Fallback: log the careers URL for manual inspection
  const fallback = sources.find((s) => s.type === "careers_url");
  if (fallback) {
    console.log(`    [careers_url] ${fallback.token} (no API — check manually)`);
  }
  return { jobs: [], source: "none" };
}

// ─── Slug → DB helpers ───────────────────────────────────────────────────────

function toDbStartup(entry: (typeof STARTUPS_CATALOG)[number]) {
  return {
    slug: entry.slug,
    name: entry.name,
    description: entry.description,
    long_description: entry.longDescription ?? null,
    website: entry.website,
    linkedin_url: entry.linkedinUrl ?? null,
    logo_url: entry.logoUrl ?? null,
    country: entry.country,
    city: entry.city,
    industry: entry.industry,
    stage: entry.stage ?? null,
    founded_year: entry.foundedYear ?? null,
    employee_range: entry.employeeRange ?? null,
    investors: JSON.stringify(entry.investors ?? []),
    status: "approved" as const,
  };
}

function toDbJob(
  startupId: string,
  job: NormalizedJob,
  fallbackApplyUrl: string
) {
  return {
    startup_id: startupId,
    title: job.title,
    description: job.description,
    area: job.area,
    location: job.location,
    modality: job.modality,
    salary_range: job.salaryRange,
    apply_url: job.applyUrl || fallbackApplyUrl,
    status: "active" as const,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const catalog = SLUG_FILTER
    ? STARTUPS_CATALOG.filter((s) => s.slug === SLUG_FILTER)
    : STARTUPS_CATALOG;

  if (!catalog.length) {
    console.error(`No startup found with slug "${SLUG_FILTER}"`);
    process.exit(1);
  }

  console.log(
    `\n🚀 COL/LABS Startup Ingestion Pipeline\n` +
      `   Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}\n` +
      `   Startups: ${catalog.length}\n`
  );

  const results: Array<{
    slug: string;
    status: "ok" | "error";
    jobsFound: number;
    source: string;
    error?: string;
  }> = [];

  for (const entry of catalog) {
    console.log(`\n▶ ${entry.name} (${entry.slug})`);

    // 1. Fetch jobs
    const { jobs, source } = await fetchJobs(entry.slug, entry.jobSources);

    if (DRY_RUN) {
      console.log(
        `   [DRY RUN] Would upsert startup + ${jobs.length} jobs from ${source}`
      );
      results.push({ slug: entry.slug, status: "ok", jobsFound: jobs.length, source });
      continue;
    }

    try {
      // 2. Upsert startup
      const dbStartup = toDbStartup(entry);
      const { data: upserted, error: startupErr } = await supabase
        .from("startups")
        .upsert(dbStartup, { onConflict: "slug" })
        .select("id")
        .single();

      if (startupErr || !upserted) {
        throw new Error(startupErr?.message ?? "No row returned from startup upsert");
      }
      const startupId: string = upserted.id;
      console.log(`   ✓ Startup upserted (id: ${startupId})`);

      // 3. Delete old jobs for this startup, then insert fresh ones
      //    (simpler than diff-and-patch for a daily refresh script)
      if (jobs.length > 0) {
        const { error: deleteErr } = await supabase
          .from("jobs")
          .delete()
          .eq("startup_id", startupId);
        if (deleteErr) throw new Error(`Delete old jobs: ${deleteErr.message}`);

        const dbJobs = jobs.map((j) => toDbJob(startupId, j, entry.website));
        const { error: insertErr } = await supabase.from("jobs").insert(dbJobs);
        if (insertErr) throw new Error(`Insert jobs: ${insertErr.message}`);
        console.log(`   ✓ ${jobs.length} jobs inserted (source: ${source})`);
      } else {
        console.log(`   ⚠ No jobs found — startup upserted, jobs unchanged`);
      }

      results.push({ slug: entry.slug, status: "ok", jobsFound: jobs.length, source });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`   ✗ Error: ${message}`);
      results.push({
        slug: entry.slug,
        status: "error",
        jobsFound: 0,
        source,
        error: message,
      });
    }

    // Polite delay between startups to avoid rate-limits
    await new Promise((r) => setTimeout(r, 500));
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  const ok = results.filter((r) => r.status === "ok");
  const errors = results.filter((r) => r.status === "error");
  const totalJobs = results.reduce((acc, r) => acc + r.jobsFound, 0);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SUMMARY
  Startups processed : ${results.length}
  Successful         : ${ok.length}
  Errors             : ${errors.length}
  Total jobs found   : ${totalJobs}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (errors.length) {
    console.log("\n  Failed startups:");
    for (const r of errors) {
      console.log(`    • ${r.slug}: ${r.error}`);
    }
  }

  const noJobs = ok.filter((r) => r.jobsFound === 0);
  if (noJobs.length) {
    console.log(
      "\n  ⚠ Startups with 0 jobs found (check careers pages manually):"
    );
    for (const r of noJobs) {
      const entry = STARTUPS_CATALOG.find((s) => s.slug === r.slug);
      const fallback = entry?.jobSources.find((s) => s.type === "careers_url");
      console.log(`    • ${r.slug}${fallback ? ` → ${fallback.token}` : ""}`);
    }
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err: unknown) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
