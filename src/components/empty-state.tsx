/**
 * Reusable empty-state card.
 *
 * Three distinct states in the directory use this component with different
 * copy (spec: `directory-states`):
 *
 *  - **No results**: the visitor's filter set matched zero approved
 *    startups. The grid is replaced by this card with a "Limpiar filtros"
 *    action so the visitor can recover without reloading the page.
 *  - **No approved startups**: the directory itself has no approved rows.
 *    The grid is replaced by this card; pagination is hidden.
 *  - **Incomplete data**: a single row is missing optional fields (logo,
 *    website, city, etc.). The row itself stays clickable and renders
 *    placeholders; this state is not rendered through `<EmptyState/>`,
 *    but the visual language (`border-dashed`, `bg-surface`) is the same
 *    so the three states look related without sharing an icon.
 *
 * The component is presentational. The optional `action` slot accepts any
 * `ReactNode` so the caller can wire a client-side "Limpiar filtros"
 * button without this component needing `"use client"` itself.
 */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Headline that names the state. Kept short so it fits a single line. */
  title: string;
  /** Optional supporting copy under the title. */
  hint?: string;
  /**
   * Optional icon. Each state uses a different icon so the three states
   * are visually distinct (spec: directory-states "distinct visual
   * treatment"). When omitted, no icon is rendered.
   */
  icon?: ReactNode;
  /**
   * Optional action slot. The parent owns the interaction (e.g. a
   * `router.replace(...)` button to clear filters), so this stays a
   * plain `ReactNode` and the component itself has no client JS.
   */
  action?: ReactNode;
  /** Extra classes appended to the root card. */
  className?: string;
}

export function EmptyState({
  title,
  hint,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-4 border border-dashed border-border bg-surface p-8 text-center sm:p-12",
        className
      )}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="text-muted-foreground grid size-12 place-items-center"
        >
          {icon}
        </div>
      ) : null}

      <div className="space-y-2">
        <h3 className="font-display text-lg font-bold tracking-tight sm:text-xl">
          {title}
        </h3>
        {hint ? (
          <p className="text-muted-foreground mx-auto max-w-md text-sm sm:text-base">
            {hint}
          </p>
        ) : null}
      </div>

      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
