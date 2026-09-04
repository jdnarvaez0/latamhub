/**
 * Jobs empty state — used when no vacancies match the active filters,
 * or when the jobs query fails.
 *
 * Presentational: no "use client". The parent owns the clear-filters
 * callback and passes it as a ReactNode in the `action` slot, keeping
 * this component free of URL / router coupling.
 *
 * Mirrors <EmptyState> but is jobs-specific so the copy and icon are
 * locked to the jobs context without generic prop-drilling.
 */
import { EmptyState } from "@/components/empty-state";
import type { ReactNode } from "react";

const BriefcaseIcon = (
  <svg
    className="size-8"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
    />
  </svg>
);

const AlertIcon = (
  <svg
    className="size-8"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
    />
  </svg>
);

export interface JobsEmptyStateProps {
  /** Variant controls copy and icon. Defaults to "no-results". */
  variant?: "no-results" | "error";
  /** Optional action slot (e.g. a "Limpiar filtros" button). */
  action?: ReactNode;
}

export function JobsEmptyState({
  variant = "no-results",
  action,
}: JobsEmptyStateProps) {
  if (variant === "error") {
    return (
      <EmptyState
        icon={AlertIcon}
        title="No pudimos cargar las vacantes"
        hint="Ocurrió un error al conectar con la base de datos. Recargá la página para intentarlo de nuevo."
        action={action}
      />
    );
  }

  return (
    <EmptyState
      icon={BriefcaseIcon}
      title="No encontramos vacantes"
      hint="Ninguna vacante coincide con los filtros activos. Probá limpiar los filtros o ajustando tu búsqueda."
      action={action}
    />
  );
}
