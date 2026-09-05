"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Monogram } from "@/components/monogram";
import { COUNTRY_LABELS, MODALITY_LABELS } from "@/lib/constants";
import type { JobWithStartup } from "@/lib/types";

interface JobDetailDialogProps {
  job: JobWithStartup | null;
  onClose: () => void;
}

export function JobDetailDialog({ job, onClose }: JobDetailDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (job) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [job, onClose]);

  if (!job) return null;

  const modalityLabel = MODALITY_LABELS[job.modality] ?? job.modality;
  const countryLabel = COUNTRY_LABELS[job.startupCountry] ?? job.startupCountry;
  const locationLabel = job.location ?? job.startupCity ?? countryLabel;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container / Slide-over sheet */}
      <div
        ref={dialogRef}
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col border border-border bg-surface shadow-2xl animate-reveal"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-6">
          <div className="flex items-start gap-4">
            <Link
              href={`/startups/${job.startupSlug}`}
              className="shrink-0 transition-opacity hover:opacity-80"
              onClick={onClose}
            >
              <Monogram
                letter={job.startupName.slice(0, 2).toUpperCase()}
                logoUrl={job.startupLogoUrl}
                website={job.startupWebsite}
                alt={`${job.startupName} logo`}
                size="md"
              />
            </Link>
            <div>
              <Link
                href={`/startups/${job.startupSlug}`}
                className="font-mono text-xs uppercase tracking-tight text-muted-foreground transition-colors hover:text-primary"
                onClick={onClose}
              >
                {job.startupName} · {countryLabel}
              </Link>
              <h2 id="job-dialog-title" className="font-display text-2xl font-bold tracking-tight">
                {job.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="press -mr-2 -mt-2 p-2 text-muted-foreground hover:text-foreground"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Badges bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface/50 px-6 py-3">
          <span className="tag tag-primary">{modalityLabel}</span>
          {job.area && <span className="tag">{job.area}</span>}
          {job.salaryRange && <span className="tag">{job.salaryRange}</span>}
          <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-tight">
            📍 {locationLabel}
          </span>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {job.description ? (
            <div className="prose prose-invert max-w-none text-sm text-foreground/90 whitespace-pre-line leading-relaxed font-sans">
              {job.description}
            </div>
          ) : (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Esta vacante está publicada oficialmente por{" "}
                <strong className="text-foreground">{job.startupName}</strong>.
              </p>
              <p>
                La descripción completa, responsabilidades del puesto y formulario de aplicación están
                alojados directamente en el portal de talento oficial de la startup.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-border bg-surface p-4 sm:px-6">
          <Link
            href={`/startups/${job.startupSlug}`}
            className="text-xs font-mono uppercase tracking-tight text-muted-foreground hover:text-primary transition-colors"
            onClick={onClose}
          >
            Ver perfil de {job.startupName} →
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="press px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Cerrar
            </button>
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex items-center gap-2 bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-background hover:bg-primary transition-colors"
            >
              Postular en sitio oficial
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
