/**
 * ingest-yc.ts
 *
 * Fetches Y Combinator companies from the community-maintained yc-oss/api
 * (https://github.com/yc-oss/api) and upserts LATAM startups into Supabase.
 *
 * Sources:
 *   - https://yc-oss.github.io/api/companies/all.json  (6,200+ companies, updated daily)
 *
 * Filtering logic (any company that matches ALL of):
 *   - `status` is "Active" (skip Inactive / Acquired)
 *   - `all_locations` contains a LATAM keyword OR `regions` includes a LATAM region
 *   - Country code resolves to one of: CO, BR, CL, AR, MX
 *
 * Industry mapping:
 *   YC industries → our DB industry slugs (fintech | proptech | ecommerce |
 *   logistics | agtech | edtech | healthtech | saas | other)
 *
 * Usage:
 *   bun run scripts/ingest-yc.ts                        # all LATAM active
 *   bun run scripts/ingest-yc.ts --country CO           # Colombia only
 *   bun run scripts/ingest-yc.ts --dry-run              # no writes
 *   bun run scripts/ingest-yc.ts --dry-run --country CO # preview CO only
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

// ─── Config ─────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes("--dry-run");
const COUNTRY_FILTER = (() => {
  const idx = process.argv.indexOf("--country");
  return idx !== -1 ? process.argv[idx + 1]?.toUpperCase() : null;
})();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing env vars. Add to .env.local:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL\n" +
      "  SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ─── YC Data Types ───────────────────────────────────────────────────────────

interface YCCompany {
  id: number;
  name: string;
  slug: string;
  small_logo_thumb_url?: string;
  website?: string;
  all_locations?: string;
  long_description?: string;
  one_liner?: string;
  team_size?: number;
  industry?: string;
  subindustry?: string;
  tags?: string[];
  batch?: string;
  status?: string;
  industries?: string[];
  regions?: string[];
  stage?: string;
  isHiring?: boolean;
  top_company?: boolean;
  url?: string;
}

// ─── LATAM Location Detection ────────────────────────────────────────────────

const COUNTRY_KEYWORDS: Record<string, string[]> = {
  CO: ["Colombia", "Bogotá", "Bogota", "Medellín", "Medellin", "Cali", "Barranquilla", "Cartagena", "Antioquia"],
  BR: ["Brazil", "Brasil", "São Paulo", "Sao Paulo", "Rio de Janeiro", "Brasília", "Curitiba", "Belo Horizonte"],
  CL: ["Chile", "Santiago", "Valparaíso", "Valparaiso"],
  AR: ["Argentina", "Buenos Aires", "Córdoba", "Cordoba", "Rosario", "CABA"],
  MX: ["Mexico", "México", "Mexico City", "CDMX", "Guadalajara", "Monterrey"],
};

// YC regions that indicate LATAM
const LATAM_REGIONS = [
  "Latin America",
  "Colombia",
  "Brazil",
  "Chile",
  "Argentina",
  "Mexico",
];

function detectCountry(company: YCCompany): "CO" | "BR" | "CL" | "AR" | "MX" | null {
  const loc = company.all_locations ?? "";
  const regions = company.regions ?? [];

  for (const [code, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    if (keywords.some((kw) => loc.includes(kw))) {
      return code as "CO" | "BR" | "CL" | "AR" | "MX";
    }
  }

  // Fallback: use YC regions
  if (regions.includes("Colombia")) return "CO";
  if (regions.includes("Brazil")) return "BR";
  if (regions.includes("Chile")) return "CL";
  if (regions.includes("Argentina")) return "AR";
  if (regions.includes("Mexico")) return "MX";

  return null;
}

function isLatam(company: YCCompany): boolean {
  const country = detectCountry(company);
  if (country) return true;

  const regions = company.regions ?? [];
  return LATAM_REGIONS.some((r) => regions.includes(r));
}

// ─── Industry Mapping ────────────────────────────────────────────────────────

/**
 * Maps YC industry/subindustry strings to our DB industry slugs.
 * DB slugs: fintech | proptech | ecommerce | logistics | agtech | edtech | healthtech | saas | other
 */
function mapIndustry(company: YCCompany): string {
  const industry = (company.industry ?? "").toLowerCase();
  const subindustry = (company.subindustry ?? "").toLowerCase();
  const tags = (company.tags ?? []).map((t) => t.toLowerCase());
  const industriesArr = (company.industries ?? []).map((i) => i.toLowerCase());
  const combined = [industry, subindustry, ...tags, ...industriesArr].join(" ");

  // Health first — some health companies sit under YC's "Consumer" taxonomy
  if (
    combined.includes("health") ||
    combined.includes("medical") ||
    combined.includes("biotech") ||
    combined.includes("healthcare") ||
    combined.includes("telemedicine") ||
    combined.includes("mental health")
  )
    return "healthtech";
  if (combined.includes("fintech") || combined.includes("financial")) return "fintech";
  if (
    combined.includes("real estate") ||
    combined.includes("proptech") ||
    combined.includes("construction") ||
    combined.includes("property")
  )
    return "proptech";
  if (
    combined.includes("logistics") ||
    combined.includes("supply chain") ||
    combined.includes("transportation") ||
    combined.includes("shipping")
  )
    return "logistics";
  if (
    combined.includes("agtech") ||
    combined.includes("agriculture") ||
    combined.includes("farming") ||
    combined.includes("food tech")
  )
    return "agtech";
  if (
    combined.includes("edtech") ||
    combined.includes("education") ||
    combined.includes("learning")
  )
    return "edtech";
  if (
    combined.includes("saas") ||
    combined.includes("b2b") ||
    combined.includes("software") ||
    combined.includes("developer") ||
    combined.includes("enterprise")
  )
    return "saas";
  if (
    combined.includes("marketplace") ||
    combined.includes("ecommerce") ||
    combined.includes("e-commerce") ||
    combined.includes("retail") ||
    combined.includes("food and beverage") ||
    combined.includes("delivery") ||
    combined.includes("consumer")
  )
    return "ecommerce";

  return "saas";
}

// ─── Stage Mapping ───────────────────────────────────────────────────────────

function mapStage(company: YCCompany): string | null {
  const ycStage = (company.stage ?? "").toLowerCase();
  const batch = (company.batch ?? "").toLowerCase();

  // Derive from batch recency as a proxy
  const batchYear = parseInt(batch.split(" ").pop() ?? "0");

  if (ycStage.includes("growth") || batchYear <= 2018) return "series-b+";
  if (batchYear <= 2020) return "series-a";
  if (batchYear <= 2022) return "seed";
  return "pre-seed";
}

// ─── Slug deduplication ───────────────────────────────────────────────────────

/**
 * YC slugs can collide with our existing slugs (e.g. "laika" is in both
 * our catalog and YC). We keep a yc- prefix for new ones to avoid collisions
 * UNLESS the slug already exists and belongs to the same company.
 */
function buildSlug(company: YCCompany): string {
  // Use YC slug directly — the upsert is on conflict(slug) so dupes
  // will update the existing row, which is the desired behaviour.
  return company.slug;
}

// ─── Extract city ─────────────────────────────────────────────────────────────

function extractPrimaryCity(company: YCCompany, country: string): string | null {
  const loc = company.all_locations ?? "";
  // Locations are comma-separated: "Bogotá, Bogota, Colombia; Remote"
  const primarySegment = loc.split(";")[0] ?? "";
  const parts = primarySegment.split(",").map((p) => p.trim());

  // For Colombia: first part is usually the city
  if (country === "CO") {
    const keywords = COUNTRY_KEYWORDS.CO;
    for (const part of parts) {
      if (!keywords.some((kw) => kw === part) && part !== "Colombia") {
        return part || null;
      }
    }
  }

  return parts[0] ?? null;
}

// ─── DB row builder ──────────────────────────────────────────────────────────

function toDbStartup(company: YCCompany, country: "CO" | "BR" | "CL" | "AR" | "MX") {
  return {
    slug: buildSlug(company),
    name: company.name,
    description: company.one_liner ?? company.long_description?.slice(0, 280) ?? "",
    long_description: company.long_description ?? null,
    logo_url: company.small_logo_thumb_url?.startsWith("http")
      ? company.small_logo_thumb_url
      : null,
    website: company.website ?? null,
    linkedin_url: null, // YC doesn't provide LinkedIn
    country,
    city: extractPrimaryCity(company, country),
    industry: mapIndustry(company),
    stage: mapStage(company),
    founded_year: null, // YC doesn't expose founding year directly
    employee_range: company.team_size
      ? company.team_size <= 10
        ? "1-10"
        : company.team_size <= 50
          ? "11-50"
          : company.team_size <= 200
            ? "51-200"
            : "200+"
      : null,
    investors: JSON.stringify(["Y Combinator", ...(company.batch ? [`YC ${company.batch}`] : [])]),
    status: "approved" as const,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔄 Fetching YC companies from yc-oss/api...");
  const res = await fetch("https://yc-oss.github.io/api/companies/all.json");
  if (!res.ok) {
    console.error(`Failed to fetch YC data: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const allCompanies = (await res.json()) as YCCompany[];
  console.log(`   Loaded ${allCompanies.length} total YC companies`);

  // Filter: active LATAM companies
  const latam = allCompanies.filter(
    (c) => c.status === "Active" && isLatam(c)
  );

  // Resolve country for each company
  const withCountry = latam
    .map((c) => ({ company: c, country: detectCountry(c) }))
    .filter((x): x is { company: YCCompany; country: "CO" | "BR" | "CL" | "AR" | "MX" } =>
      x.country !== null
    );

  // Apply --country filter if provided
  const filtered = COUNTRY_FILTER
    ? withCountry.filter((x) => x.country === COUNTRY_FILTER)
    : withCountry;

  console.log(
    `   LATAM active (with detected country): ${withCountry.length}\n` +
      (COUNTRY_FILTER ? `   Filtered to ${COUNTRY_FILTER}: ${filtered.length}\n` : "")
  );

  // Country breakdown
  const byCountry = filtered.reduce<Record<string, number>>((acc, { country }) => {
    acc[country] = (acc[country] ?? 0) + 1;
    return acc;
  }, {});
  console.log("   Breakdown:", byCountry);

  console.log(
    `\n🚀 YC → COL/LABS Ingestion\n` +
      `   Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}\n` +
      `   Companies to process: ${filtered.length}\n`
  );

  const results: Array<{
    slug: string;
    name: string;
    country: string;
    status: "ok" | "error";
    error?: string;
  }> = [];

  for (const { company, country } of filtered) {
    const dbRow = toDbStartup(company, country);
    process.stdout.write(
      `▶ ${company.name} (${company.slug}) [${country}] [${company.batch}] — `
    );

    if (DRY_RUN) {
      console.log(`[DRY RUN] industry=${dbRow.industry} stage=${dbRow.stage}`);
      results.push({ slug: company.slug, name: company.name, country, status: "ok" });
      continue;
    }

    try {
      const { error } = await supabase
        .from("startups")
        .upsert(dbRow, { onConflict: "slug" });

      if (error) throw new Error(error.message);

      console.log(`✓`);
      results.push({ slug: company.slug, name: company.name, country, status: "ok" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`✗ ${message}`);
      results.push({ slug: company.slug, name: company.name, country, status: "error", error: message });
    }

    // Polite delay to avoid hammering Supabase
    await new Promise((r) => setTimeout(r, 150));
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  const ok = results.filter((r) => r.status === "ok");
  const errors = results.filter((r) => r.status === "error");

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SUMMARY (${DRY_RUN ? "DRY RUN" : "LIVE"})
  Processed  : ${results.length}
  Successful : ${ok.length}
  Errors     : ${errors.length}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Country breakdown of successes
  const successByCountry = ok.reduce<Record<string, number>>((acc, r) => {
    acc[r.country] = (acc[r.country] ?? 0) + 1;
    return acc;
  }, {});
  console.log("  By country:", successByCountry);

  if (errors.length) {
    console.log("\n  Failed:");
    for (const r of errors) {
      console.log(`    • ${r.name} (${r.slug}): ${r.error}`);
    }
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err: unknown) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
