/**
 * ingest-startups-ar.ts
 *
 * Extracts all startups from Startups Argentina (https://www.startupsargentina.com/?origin=AR&view=directory)
 * including logos, metadata, sectors, hiring status, and founders, and upserts
 * them into the Supabase `startups` table.
 *
 * Usage:
 *   bun run scripts/ingest-startups-ar.ts
 *   bun run scripts/ingest-startups-ar.ts --dry-run
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

// ─── Config ─────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes("--dry-run");

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

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface RawARStartup {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  foundedYear: number | null;
  websiteUrl: string | null;
  careersUrl: string | null;
  linkedinUrl: string | null;
  xUrl: string | null;
  logoUrl: string | null;
  stage: string | null;
  city: string | null;
  province: string | null;
  countryCode: string;
  employeeBand: string | null;
  workMode: string | null;
  hiringStatus: string;
  openJobCount: number;
  sectors: string[];
  founders: Array<{
    id: string;
    name: string;
    role: string | null;
    linkedinUrl: string | null;
  }>;
}

// ─── Industry Mapping ────────────────────────────────────────────────────────
// DB allowed industry slugs: fintech | proptech | healthtech | edtech | logistics | ecommerce | agtech | saas

function mapIndustry(sectors: string[] = []): string {
  const s = sectors.map((sec) => sec.toLowerCase()).join(" ");

  if (s.includes("fintech") || s.includes("insurtech") || s.includes("blockchain") || s.includes("crypto")) {
    return "fintech";
  }
  if (s.includes("proptech") || s.includes("real estate") || s.includes("construction")) {
    return "proptech";
  }
  if (s.includes("healthtech") || s.includes("biotech") || s.includes("pharma") || s.includes("medical")) {
    return "healthtech";
  }
  if (s.includes("edtech") || s.includes("education")) {
    return "edtech";
  }
  if (s.includes("logistics") || s.includes("supply chain") || s.includes("mobility")) {
    return "logistics";
  }
  if (s.includes("e-commerce") || s.includes("ecommerce") || s.includes("marketplace") || s.includes("retail") || s.includes("consumer") || s.includes("foodtech")) {
    return "ecommerce";
  }
  if (s.includes("agtech") || s.includes("agriculture") || s.includes("agro")) {
    return "agtech";
  }
  // B2B, SaaS, AI/ML, Developer Tools, Cybersecurity, Infrastructure, etc.
  return "saas";
}

// ─── Stage Mapping ───────────────────────────────────────────────────────────
// DB allowed: pre-seed | seed | series-a | series-b+ | bootstrapped | null

function mapStage(stageStr: string | null): "pre-seed" | "seed" | "series-a" | "series-b+" | "bootstrapped" | null {
  if (!stageStr) return null;
  const s = stageStr.toLowerCase();
  if (s.includes("pre-seed") || s.includes("pre semilla") || s.includes("pre-semilla")) return "pre-seed";
  if (s.includes("seed") || s.includes("semilla")) return "seed";
  if (s.includes("serie a") || s.includes("series a")) return "series-a";
  if (s.includes("serie b") || s.includes("series b") || s.includes("unicornio") || s.includes("publica") || s.includes("growth")) return "series-b+";
  if (s.includes("bootstrap")) return "bootstrapped";
  return null;
}

// ─── Employee Range Mapping ──────────────────────────────────────────────────
// DB allowed strings: 1-10 | 11-50 | 51-200 | 200+ | null

function mapEmployeeRange(band: string | null): string | null {
  if (!band) return null;
  if (band === "1-10" || band === "11-50" || band === "51-200" || band === "200+") return band;
  if (band.includes("200") || band.includes("500") || band.includes("1000")) return "200+";
  if (band.includes("50")) return "11-50";
  return "1-10";
}

// ─── Fetch Startups from startupsargentina.com ────────────────────────────────

async function fetchStartupsArgentina(): Promise<RawARStartup[]> {
  console.log("🌐 Conectando a https://www.startupsargentina.com/?origin=AR&view=directory ...");
  const res = await fetch("https://www.startupsargentina.com/?origin=AR&view=directory", {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; LATAMHub/1.0)",
      Accept: "text/html,application/xhtml+xml,application/xml",
    },
  });

  if (!res.ok) {
    throw new Error(`Error al acceder a Startups Argentina: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const marker = '{\\"startups\\":[';
  const idx = html.indexOf(marker);

  if (idx === -1) {
    throw new Error("No se encontró el payload de startups en el HTML de startupsargentina.com");
  }

  const arrayStart = idx + marker.length - 1;
  let bracketCount = 0;
  let rawJson = "";

  for (let i = arrayStart; i < html.length; i++) {
    const ch = html[i];
    rawJson += ch;
    if (ch === "[") bracketCount++;
    else if (ch === "]") {
      bracketCount--;
      if (bracketCount === 0) break;
    }
  }

  const unescaped = JSON.parse(`"${rawJson}"`);
  const list: RawARStartup[] = JSON.parse(unescaped);
  return list;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const startups = await fetchStartupsArgentina();
  console.log(`✓ Se encontraron ${startups.length} startups en Startups Argentina.\n`);

  console.log(
    `🚀 Ingesta de Startups Argentina a COL/LABS\n` +
      `   Modo: ${DRY_RUN ? "DRY RUN (sin escrituras)" : "LIVE"}\n`
  );

  let successCount = 0;
  let errorCount = 0;

  for (const s of startups) {
    const industry = mapIndustry(s.sectors);
    const stage = mapStage(s.stage);
    const employeeRange = mapEmployeeRange(s.employeeBand);
    const city = s.city || s.province || "Buenos Aires";

    const dbStartup = {
      slug: s.slug.trim(),
      name: s.name.trim(),
      description: (s.tagline || s.description || "").slice(0, 280).trim(),
      long_description: s.description ? s.description.trim() : null,
      logo_url: s.logoUrl && s.logoUrl.startsWith("http") ? s.logoUrl : null,
      website: s.websiteUrl ? s.websiteUrl.trim() : null,
      linkedin_url: s.linkedinUrl ? s.linkedinUrl.trim() : null,
      country: "AR" as const,
      city,
      industry,
      stage,
      founded_year: s.foundedYear || null,
      employee_range: employeeRange,
      investors: JSON.stringify(
        s.founders && s.founders.length > 0
          ? s.founders.map((f) => f.name)
          : []
      ),
      status: "approved" as const,
    };

    process.stdout.write(`▶ ${dbStartup.name} (${dbStartup.slug}) [${dbStartup.industry}] [${dbStartup.stage || "sin etapa"}] `);

    if (DRY_RUN) {
      console.log(`— [DRY RUN]`);
      successCount++;
      continue;
    }

    try {
      const { error } = await supabase
        .from("startups")
        .upsert(dbStartup, { onConflict: "slug" });

      if (error) {
        throw new Error(error.message);
      }

      console.log(`✓`);
      successCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✗ Error: ${msg}`);
      errorCount++;
    }

    // Pequeño delay de 50ms para evitar saturación de la DB
    await new Promise((r) => setTimeout(r, 50));
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RESUMEN INGESTA STARTUPS ARGENTINA
  Total procesadas : ${startups.length}
  Exitosas         : ${successCount}
  Errores          : ${errorCount}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch((err) => {
  console.error("Error inesperado:", err);
  process.exit(1);
});
