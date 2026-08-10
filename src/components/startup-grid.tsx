/**
 * Row-list wrapper for the public directory.
 *
 * Renders the filtered-and-paginated list of startups with the result
 * count and an empty-state fallback. The design (decision §10) locks
 * this as a **row list**, not a 3-column card grid — the prototype
 * already shipped as a vertical list and the spec acceptance criteria
 * (`startup-directory`, `directory-states`) are written against that
 * shape.
 *
 * The component is presentational. The parent (`DirectoryClient`,
 * arriving in Unit 4) owns the data:
 *
 *  - `pageRows` is the slice for the current page (already paginated by
 *    `paginateStartups` in `@/lib/filtering`).
 *  - `count` is the number of results after filters are applied — the
 *    spec requires a "5 startups" line under the header. The parent
 *    owns the full filtered list; the component never needs it.
 *
 * When the filtered list is empty the grid renders `<EmptyState/>`
 * instead of an empty list. The empty state takes the same dashed-card
 * visual language as the rest of the directory's empty / error /
 * incomplete-data states, but the icon, title and hint differ — see
 * `directory-states` ("distinct visual treatment" requirement).
 *
 * Accessibility:
 *  - The list is a `<section>` with an `aria-label` so screen readers
 *    can announce the section boundary before the rows.
 *  - The count uses the live region's `role="status"` so filter changes
 *    re-announce the new total.
 *  - Each row is wrapped in a `<li>` so the list semantics are valid.
 */
import { EmptyState } from "@/components/empty-state";
import { StartupRow } from "@/components/startup-row";
import type { Startup } from "@/lib/types";

export interface StartupGridProps {
  /**
   * The slice for the current page, already computed by the parent via
   * `paginateStartups(rows, page)`. The component does not slice or
   * paginate internally — that lives in `@/lib/filtering` so server
   * and client share the same page boundaries.
   */
  pageRows: Startup[];
  /**
   * Number of results after filters are applied. Equal to `rows.length`
   * but passed explicitly so the parent's contract is the visible
   * count (post-filter) and the component never reads `rows.length`
   * for display purposes.
   */
  count: number;
  /**
   * Copy for the empty state. Each parent can pass state-specific
   * strings so the empty message stays accurate ("Sin resultados" vs
   * "No hay startups publicadas todavía"). Defaults match the
   * filter-driven "no results" case.
   */
  emptyTitle?: string;
  emptyHint?: string;
  /**
   * Action slot for the empty state. Typically a "Limpiar filtros"
   * button that triggers a `router.replace` in the parent
   * (`DirectoryClient`). The component itself is a Server Component
   * so the parent must supply any interactive node.
   */
  emptyAction?: React.ReactNode;
}

/**
 * Format the result count line. Uses Spanish singular/plural agreement:
 * "1 startup" vs "5 startups" — matches the `startup-directory` spec
 * ("the count reads '5 startups'").
 */
function formatCount(count: number): string {
  if (count === 1) return "1 startup";
  return `${count} startups`;
}

export function StartupGrid({
  pageRows,
  count,
  emptyTitle = "Sin resultados",
  emptyHint = "Prueba con otro término o quita algunos filtros.",
  emptyAction,
}: StartupGridProps) {
  if (count === 0 || pageRows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        hint={emptyHint}
        action={emptyAction}
      />
    );
  }

  return (
    <section
      aria-label="Listado de startups aprobadas"
      className="space-y-6"
    >
      <div
        role="status"
        aria-live="polite"
        className="data-label flex items-center justify-between"
      >
        <span>{formatCount(count)}</span>
        {/*
          Visual page boundary marker, mono-styled like the rest of the
          "tablero" header. Pure decoration — the accessible count is
          the `role="status"` element above.
        */}
        <span aria-hidden="true" className="text-muted-foreground/60">
          Mostrando {pageRows.length} de {count}
        </span>
      </div>

      <ul className="space-y-4">
        {pageRows.map((row, index) => (
          <li key={row.id} className="list-none">
            <StartupRow startup={row} index={index} />
          </li>
        ))}
      </ul>
    </section>
  );
}
