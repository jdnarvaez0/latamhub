/**
 * Industry filter — multi-select checkbox list.
 *
 * Spec: `startup-filters` "Industry filter ... filter by one or more
 * industry values". Design §2 and §3:
 *  - Multi-select checkboxes (not single-select dropdown).
 *  - `values: string[]` prop; each checkbox toggles its slug in the
 *    array.
 *  - URL encoding: repeated `industry=<slug>` keys. The encoding is the
 *    parent's job (`buildDirectoryUrl` in `@/lib/filtering`); this
 *    component only emits the next `values` array.
 *  - Labels come from `INDUSTRY_LABELS` so the user sees Spanish labels
 *    even though the slug stored in the URL is English / lowercase /
 *    kebab-case.
 *
 * Each checkbox is a real `<input type="checkbox">` wrapped in a
 * `<label>` — the browser handles the checkbox semantics natively, so
 * keyboard navigation, focus rings and screen-reader announcements are
 * correct without extra ARIA. A `count` chip on the right of each row
 * shows how many approved startups match this industry.
 *
 * The "Todos" affordance is implicit: when `values.length === 0` the
 * filter is inactive. The panel's "Limpiar filtros" button clears the
 * array explicitly.
 *
 * URL contract: the parent derives the URL via `buildDirectoryUrl`. The
 * component never touches `useSearchParams` / `URLSearchParams` — it
 * only fires `onChange` with the next `string[]`.
 */
"use client";

import { cn } from "@/lib/utils";
import { INDUSTRY_LABELS } from "@/lib/constants";

import type { FilterOption } from "./option";

export interface IndustryFilterProps {
  /**
   * Currently selected industry slugs. `[]` means "no industry filter".
   * The component does not normalize / dedupe — `buildDirectoryUrl`
   * already writes the list verbatim and the parser dedupes on the
   * round-trip.
   */
  values: string[];
  /**
   * Industry options in render order. The component renders the
   * catalog order (`INDUSTRY_SLUGS`), not alphabetical — matches the
   * prototype.
   */
  options: FilterOption[];
  /** Called with the next array of selected slugs. */
  onChange: (values: string[]) => void;
  /** Extra classes appended to the outer wrapper. */
  className?: string;
}

export function IndustryFilter({
  values,
  options,
  onChange,
  className,
}: IndustryFilterProps) {
  /**
   * Toggle a single slug in the array. The handler is local — we never
   * mutate the incoming prop. Toggling off the last entry produces
   * `[]`, which `buildDirectoryUrl` serializes as no `industry` param.
   */
  function toggle(slug: string) {
    if (values.includes(slug)) {
      onChange(values.filter((v) => v !== slug));
    } else {
      onChange([...values, slug]);
    }
  }

  return (
    <fieldset
      className={cn("space-y-2", className)}
      aria-label="Industria"
    >
      <legend className="sr-only">Industria</legend>
      <ul className="space-y-1">
        {options.map((option) => {
          const checked = values.includes(option.value);
          const label = option.label ?? INDUSTRY_LABELS[option.value] ?? option.value;
          const inputId = `industry-${option.value}`;

          return (
            <li key={option.value}>
              <label
                htmlFor={inputId}
                className={cn(
                  "group flex cursor-pointer items-center gap-3 rounded-sm border border-transparent px-2 py-1 text-sm transition-colors",
                  "hover:border-border hover:bg-surface",
                  checked && "border-primary/40 bg-primary/5"
                )}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(option.value)}
                  disabled={option.disabled === true}
                  className="size-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="flex-1 transition-colors group-hover:text-primary">
                  {label}
                </span>
                <span
                  className="font-mono text-[10px] text-muted-foreground"
                  aria-hidden="true"
                >
                  {option.count}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
