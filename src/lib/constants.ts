/**
 * Display maps for the COL/LABS domain enums. Spanish labels for the UI;
 * English values are stored in the database.
 *
 * `INDUSTRY_LABELS` mirrors `supabase/seed` and migration 00005 — the
 * industries catalog is migration-locked, so we render from a static map
 * instead of round-tripping to the DB on every render.
 */
import type { Country, Modality, Stage } from "@/lib/types";

export const COUNTRY_LABELS: Record<Country, string> = {
  CO: "Colombia",
  BR: "Brasil",
  CL: "Chile",
  AR: "Argentina",
  MX: "México",
};

export const STAGE_LABELS: Record<Stage, string> = {
  "pre-seed": "Pre-semilla",
  "seed": "Semilla",
  "series-a": "Serie A",
  "series-b+": "Serie B+",
  "bootstrapped": "Bootstrapped",
};

export const MODALITY_LABELS: Record<Modality, string> = {
  remote: "Remoto",
  hybrid: "Híbrido",
  onsite: "Presencial",
};

export const STARTUP_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

/**
 * Industry slug → Spanish label. Slugs are the canonical key (they match the
 * `industries.slug` primary key in the database and the `Startup.industry`
 * foreign key), so UI code should never invent a new slug at runtime —
 * unknown values coming from the URL are dropped by `parseDirectoryUrl`.
 */
export const INDUSTRY_LABELS: Record<string, string> = {
  fintech: "Fintech",
  proptech: "Proptech",
  healthtech: "Healthtech",
  edtech: "Edtech",
  logistics: "Logística",
  ecommerce: "Ecommerce",
  agtech: "Agtech",
  saas: "SaaS",
};

/**
 * Ordered list of all known industry slugs. Used to render the industry
 * filter deterministically (catalog order, not alphabetical) and to give
 * `parseDirectoryUrl` a closed set for validation.
 */
export const INDUSTRY_SLUGS: readonly string[] = Object.keys(INDUSTRY_LABELS);

/**
 * Country codes that are visible in the directory but disabled in the
 * Phase 1 country filter (no approved startups yet). The filter UI renders
 * them with a "Próximamente" tooltip and `count: 0`; the URL parser
 * silently drops them.
 */
export const COMING_SOON_COUNTRIES: ReadonlyArray<Country> = ["BR", "CL", "AR", "MX"];

/**
 * The single country with live data in Phase 1. Everything else is coming
 * soon. Kept as a derived constant (not a free boolean) so the rest of the
 * directory code can ask "is this a live country?" without hard-coding CO.
 */
export const LIVE_COUNTRIES: ReadonlyArray<Country> = ["CO"];
