/**
 * Single startup summary row used in the public directory list.
 *
 * Ported from the frozen Lovable prototype (`colombia-startup-hub/src/
 * components/StartupRow.tsx`) with three changes:
 *
 *  1. The `<Link>` is `next/link` instead of TanStack Router; the target
 *     is the App-Router detail route `/startups/[slug]`.
 *  2. Every field is read from the English `Startup` type and rendered
 *     through the Spanish display maps in `@/lib/constants`
 *     (`INDUSTRY_LABELS`, `COUNTRY_LABELS`, `STAGE_LABELS`,
 *     `MODALITY_LABELS`). The DB stores English slugs; the UI shows
 *     Spanish labels.
 *  3. The row is **null-safe**: missing optional fields
 *     (`city`, `stage`, `longDescription`, `logoUrl`) are handled with
 *     Spanish placeholders instead of being left blank or crashing the
 *     layout. The prototype treated these as always-present.
 *
 * The row is a pure presentational Server Component — it does not
 * import `"use client"`. All interactivity comes from the surrounding
 * `<Link>` and CSS hover utilities (`row-hover`, `animate-flip-in`).
 *
 * ## Display contract
 *
 * Every row shows, in order:
 *  - **Logo**: the `Monogram` component with the first letters of the
 *    startup name as the monogram fallback (no logo upload in Phase 1;
 *    the `logoUrl` field is accepted for forward-compat but not rendered
 *    until Phase 2+).
 *  - **Name** + `tag` cluster on the right showing:
 *      * jobs count (`"X vacantes"` or `"Sin vacantes"`, primary variant
 *        when `count > 0`),
 *      * industry (e.g. `"Fintech"`),
 *      * modality of the first job (e.g. `"Remoto"`) when the startup
 *        has any open positions — the "modality" half of the
 *        jobs/modality display contract.
 *  - **Description** (one-liner, truncated visually by `max-w-xl`).
 *  - **Mono metadata** under the description: `Sede: <city>, <country>`
 *    and `Fase: <stage>`. Missing `city` or `stage` render as
 *    `"No proporcionado"`.
 *
 * The `index` prop drives the staggered entrance animation
 * (`animate-flip-in` + `animation-delay: ${min(index, 8) * 60}ms`) — the
 * prototype's exact rhythm, copied so the directory still feels like an
 * airport departure board on first paint.
 */
import Link from "next/link";

import { Monogram } from "@/components/monogram";
import {
  COUNTRY_LABELS,
  INDUSTRY_LABELS,
  MODALITY_LABELS,
  STAGE_LABELS,
} from "@/lib/constants";
import type { Startup } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Spanish placeholder used for any missing optional field. */
const NOT_PROVIDED = "No proporcionado";

/**
 * Derive a 1–2 character monogram letter from a startup name. Handles
 * empty / whitespace-only names without throwing so a malformed row
 * still renders.
 */
function monogramLetter(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "·";
  return trimmed.slice(0, 2).toUpperCase();
}

/**
 * Format the open-jobs count for the `tag`. Keeps the singular/plural
 * agreement natural in Spanish: `1 vacante` vs `2 vacantes`.
 */
function formatJobsCount(count: number): string {
  if (count <= 0) return "Sin vacantes";
  if (count === 1) return "1 vacante";
  return `${count} vacantes`;
}

/**
 * Spanish display label for a job's modality. Falls back to the
 * raw enum value if a future modality is added to the database before
 * the label map is updated (defensive — the closed set is locked, but
 * the row must not crash on an unknown value).
 */
function formatModality(modality: Startup["jobs"][number]["modality"]): string {
  return MODALITY_LABELS[modality] ?? modality;
}

export interface StartupRowProps {
  /** The startup to render. The row is fully data-driven — no optional UI flags. */
  startup: Startup;
  /**
   * Zero-based position in the visible list. Used only for the
   * staggered entrance animation delay; the row's appearance does not
   * change based on `index`.
   */
  index?: number;
  /** Extra classes appended to the root `<Link>`. */
  className?: string;
}

export function StartupRow({ startup, index = 0, className }: StartupRowProps) {
  const jobsCount = startup.jobs.length;
  const firstJob = jobsCount > 0 ? startup.jobs[0] : null;

  // Resolve all display strings up-front so the JSX stays scannable.
  const industryLabel =
    INDUSTRY_LABELS[startup.industry] ?? startup.industry;
  const countryLabel = COUNTRY_LABELS[startup.country] ?? startup.country;
  const cityLabel = startup.city ?? NOT_PROVIDED;
  const stageLabel = startup.stage
    ? STAGE_LABELS[startup.stage] ?? startup.stage
    : NOT_PROVIDED;
  const jobsTagLabel = formatJobsCount(jobsCount);
  const modalityLabel = firstJob ? formatModality(firstJob.modality) : null;

  // Cap the stagger so the last row of a long list does not appear
  // several seconds after the first. Matches the prototype's clamp.
  const animationDelay = `${Math.min(index, 8) * 60}ms`;

  return (
    <Link
      href={`/startups/${startup.slug}`}
      className={cn(
        "group relative block animate-flip-in overflow-hidden border border-border bg-surface p-6 row-hover hover:border-primary",
        className
      )}
      style={{ animationDelay }}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <Monogram
          letter={monogramLetter(startup.name)}
          logoUrl={startup.logoUrl}
          alt={`${startup.name} logo`}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-start sm:gap-4">
            <h2 className="font-display text-xl font-bold tracking-tight transition-colors group-hover:text-primary">
              {startup.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className={jobsCount > 0 ? "tag tag-primary" : "tag"}>
                {jobsTagLabel}
              </span>
              <span className="tag">{industryLabel}</span>
              {modalityLabel ? (
                <span className="tag">{modalityLabel}</span>
              ) : null}
            </div>
          </div>

          <p className="text-muted-foreground mb-4 max-w-xl text-sm">
            {startup.description}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="text-muted-foreground font-mono text-[11px] uppercase tracking-tight">
              Sede: {cityLabel}, {countryLabel}
            </span>
            <span className="text-muted-foreground font-mono text-[11px] uppercase tracking-tight">
              Fase: {stageLabel}
            </span>
          </div>
        </div>
      </div>

      {/*
        The "Ver detalle →" affordance is a hover-only hint on the
        right edge of the row, hidden on small screens where the row's
        whole surface is the tap target. Matches the prototype.
      */}
      <div className="text-primary absolute right-6 bottom-6 hidden translate-x-2 items-center gap-2 text-xs font-bold tracking-wider uppercase opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 lg:flex">
        Ver detalle
        <svg
          className="size-4 transition-transform duration-300 group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
      </div>
    </Link>
  );
}
