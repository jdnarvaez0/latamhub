/**
 * Job vacancy row for the /jobs directory.
 *
 * Can be used as a presentational row or with an interactive onSelect handler.
 * Each row shows:
 *  - Startup monogram / logo (links to /startups/[slug])
 *  - Job title (clicking opens detail dialog when onSelect is provided)
 *  - Tags: area, modality, salary range
 *  - Mono metadata: startup name · location
 *  - External "Postular" button (opens apply_url in a new tab)
 */
import Link from "next/link";

import { Monogram } from "@/components/monogram";
import { COUNTRY_LABELS, MODALITY_LABELS } from "@/lib/constants";
import type { JobWithStartup } from "@/lib/types";
import { cn } from "@/lib/utils";

const NOT_PROVIDED = "No proporcionado";

function monogramLetter(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "·";
  return trimmed.slice(0, 2).toUpperCase();
}

export interface JobRowProps {
  job: JobWithStartup;
  /** Zero-based index for staggered entrance animation (capped at 8). */
  index?: number;
  className?: string;
  onSelect?: (job: JobWithStartup) => void;
}

export function JobRow({ job, index = 0, className, onSelect }: JobRowProps) {
  const modalityLabel = MODALITY_LABELS[job.modality] ?? job.modality;
  const countryLabel =
    COUNTRY_LABELS[job.startupCountry] ?? job.startupCountry;
  const locationLabel = job.location ?? job.startupCity ?? countryLabel;
  const animationDelay = `${Math.min(index, 8) * 60}ms`;

  return (
    <article
      onClick={() => onSelect?.(job)}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(job);
        }
      }}
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? "button" : undefined}
      aria-label={onSelect ? `Ver detalles de ${job.title} en ${job.startupName}` : undefined}
      className={cn(
        "group relative animate-flip-in border border-border bg-surface p-6 row-hover hover:border-primary text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        onSelect && "cursor-pointer",
        className
      )}
      style={{ animationDelay }}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Logo / monogram — links to the startup profile */}
        <Link
          href={`/startups/${job.startupSlug}`}
          tabIndex={-1}
          aria-hidden="true"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 transition-opacity hover:opacity-80"
        >
          <Monogram
            letter={monogramLetter(job.startupName)}
            logoUrl={job.startupLogoUrl}
            website={job.startupWebsite}
            alt={`${job.startupName} logo`}
            size="md"
          />
        </Link>

        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="mb-1 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-start sm:gap-4">
            <h2 className="font-display text-xl font-bold tracking-tight transition-colors group-hover:text-primary">
              {job.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {job.area && <span className="tag">{job.area}</span>}
              <span className="tag tag-primary">{modalityLabel}</span>
              {job.salaryRange && (
                <span className="tag">{job.salaryRange}</span>
              )}
            </div>
          </div>

          {/* Mono metadata */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link
              href={`/startups/${job.startupSlug}`}
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-primary font-mono text-[11px] uppercase tracking-tight transition-colors"
            >
              {job.startupName}
            </Link>
            <span className="text-muted-foreground font-mono text-[11px] uppercase tracking-tight">
              {locationLabel !== NOT_PROVIDED ? locationLabel : countryLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Apply CTA — absolute on md+, inline on mobile */}
      <div className="mt-4 flex justify-end md:mt-0">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Postular a ${job.title} en ${job.startupName}`}
          onClick={(e) => e.stopPropagation()}
          className="press inline-flex items-center gap-2 bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Postular
          <svg
            className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </article>
  );
}
