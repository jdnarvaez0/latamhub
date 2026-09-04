/**
 * Numbered pagination control for the public directory.
 *
 * Specs covered: `directory-pagination`.
 *
 *  - **Fixed page size**: the page size (`DIRECTORY_PAGE_SIZE = 8`) lives
 *    in `@/lib/filtering` so server and client agree on the slice
 *    boundaries. The component never slices; it only renders.
 *  - **Numbered controls**: 1..N as a horizontal button row, mono
 *    styled to match the rest of the "tablero" header.
 *  - **Current-page semantics**: the current page is rendered as a
 *    non-link `<span>` with `aria-current="page"` and the primary
 *    background, so it is visually distinct AND announced by screen
 *    readers.
 *  - **Boundary controls**: previous and next buttons are
 *    `<Link>`s when actionable, and a non-interactive `<span>` with
 *    `aria-disabled="true"` and the disabled visual style when at the
 *    boundary (currentPage === 1 → prev disabled; currentPage ===
 *    totalPages → next disabled).
 *  - **URL page navigation**: each numbered button and the
 *    prev/next controls render a real `<Link>` with a real `href` built
 *    by the parent via `buildDirectoryUrl`. The `replace` and
 *    `scroll={false}` props on each Link implement the design's
 *    "exploration, not navigation" policy (decision §4) directly:
 *      * `replace` → `router.replace` (no history pollution)
 *      * `scroll={false}` → no jump to the top of the page
 *    Real `<Link>`s also give the visitor a right-click → "Open in new
 *    tab" affordance and let search engines follow the numbered
 *    links for crawl parity.
 *
 * The component is a Server Component — no client JS, no `"use
 * client"`. All state is derived from the props, all navigation
 * happens through Next's standard `<Link>` plumbing, and the boundary
 * case is a CSS-only state.
 *
 * Hidden when there is nothing to paginate: `totalPages <= 1` returns
 * `null` (the directory-states spec mandates "the directory does not
 * display pagination" when there are no approved startups).
 */
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface PaginationProps {
  /** 1-indexed page the visitor is on. */
  currentPage: number;
  /** Total number of pages, computed by the parent via `totalPages(rows)`. */
  totalPages: number;
  /**
   * Build the URL for a given page number. The parent owns this so the
   * component does not need to know about the rest of the URL
   * (filters, search, etc.). Typically:
   *
   *   buildHref={(page) => buildDirectoryUrl({ ...filter, page }, pathname)}
   *
   * Returning a query-only string (`?page=3`) is also valid — the
   * `<Link>` resolves it against the current route.
   */
  buildHref: (page: number) => string;
  /** Extra classes appended to the outer `<nav>`. */
  className?: string;
}

const baseButtonClass =
  "press inline-flex h-9 min-w-9 items-center justify-center px-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors";

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
  className,
}: PaginationProps) {
  // No pagination UI when there is only one page (or zero).
  // The directory-states spec calls this out explicitly: "the
  // directory does not display pagination" when the dataset is empty.
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const getPaginationItems = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pages = getPaginationItems();

  return (
    <nav
      aria-label="Paginación del directorio"
      className={cn(
        "flex items-center justify-center gap-1 sm:gap-2",
        className
      )}
    >
      {hasPrev ? (
        <Link
          href={buildHref(currentPage - 1)}
          replace
          scroll={false}
          aria-label="Ir a la página anterior"
          className={cn(baseButtonClass, "border border-border hover:border-primary hover:text-primary")}
        >
          ← Anterior
        </Link>
      ) : (
        <span
          aria-disabled="true"
          aria-label="No hay página anterior"
          className={cn(
            baseButtonClass,
            "border border-border text-muted-foreground/40 cursor-not-allowed"
          )}
        >
          ← Anterior
        </span>
      )}

      {pages.map((p, i) => {
        if (p === "...") {
          return (
            <span key={`dots-${i}`} className="px-1 text-muted-foreground">
              ...
            </span>
          );
        }
        if (p === currentPage) {
          return (
            <span
              key={p}
              aria-current="page"
              aria-label={`Página ${p} (actual)`}
              className={cn(
                baseButtonClass,
                "border border-primary bg-primary text-primary-foreground"
              )}
            >
              {p}
            </span>
          );
        }
        return (
          <Link
            key={p}
            href={buildHref(p as number)}
            replace
            scroll={false}
            aria-label={`Ir a la página ${p}`}
            className={cn(
              baseButtonClass,
              "border border-border hover:border-primary hover:text-primary"
            )}
          >
            {p}
          </Link>
        );
      })}

      {hasNext ? (
        <Link
          href={buildHref(currentPage + 1)}
          replace
          scroll={false}
          aria-label="Ir a la página siguiente"
          className={cn(baseButtonClass, "border border-border hover:border-primary hover:text-primary")}
        >
          Siguiente →
        </Link>
      ) : (
        <span
          aria-disabled="true"
          aria-label="No hay página siguiente"
          className={cn(
            baseButtonClass,
            "border border-border text-muted-foreground/40 cursor-not-allowed"
          )}
        >
          Siguiente →
        </span>
      )}
    </nav>
  );
}
