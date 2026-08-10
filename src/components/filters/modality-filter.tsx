/**
 * Modality filter — single-select radio group for job modality.
 *
 * Spec: `startup-filters` "Modality filter ... filter by work modality".
 *
 * Modality lives on each startup's **jobs**, not the startup itself —
 * a startup matches the modality filter iff at least one of its jobs
 * has that modality. The filter UI is the same shape as
 * `StageFilter`; the counting logic lives in the parent
 * (`DirectoryClient`, Unit 4), which iterates rows to compute the
 * per-modality count.
 *
 * Behaviour:
 *  - Single-select. Tapping the active modality clears the filter
 *    (`onChange(null)`), matching the country and stage filters.
 *  - Labels come from `MODALITY_LABELS` so the user sees Spanish labels
 *    even though the URL stores the English enum slug.
 *
 * URL contract: the parent derives the URL via `buildDirectoryUrl`. The
 * component never touches `useSearchParams` / `URLSearchParams` — it
 * only fires `onChange` with the next `Modality | null`.
 */
"use client";

import { cn } from "@/lib/utils";
import { MODALITY_LABELS } from "@/lib/constants";
import type { Modality } from "@/lib/types";

import type { ModalityFilterOption } from "./option";

const basePillClass =
  "press inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors";

export interface ModalityFilterProps {
  /** Currently selected modality, or `null` for no modality filter. */
  value: Modality | null;
  /** Modality options in catalog order. */
  options: ModalityFilterOption[];
  /** Called with the next modality, or `null` to clear the filter. */
  onChange: (value: Modality | null) => void;
  /** Extra classes appended to the pill row. */
  className?: string;
}

export function ModalityFilter({
  value,
  options,
  onChange,
  className,
}: ModalityFilterProps) {
  const isAll = value === null;

  return (
    <div role="radiogroup" aria-label="Modalidad" className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          role="radio"
          aria-checked={isAll}
          onClick={() => onChange(null)}
          className={cn(
            basePillClass,
            isAll
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-surface text-foreground hover:border-primary hover:text-primary"
          )}
        >
          Cualquier modalidad
        </button>

        {options.map((option) => {
          const isActive = value === option.value;
          const label = option.label ?? MODALITY_LABELS[option.value] ?? option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={option.disabled === true}
              onClick={() => onChange(isActive ? null : option.value)}
              className={cn(
                basePillClass,
                option.disabled === true
                  ? "border-border bg-surface text-muted-foreground/40 cursor-not-allowed"
                  : isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-foreground hover:border-primary hover:text-primary"
              )}
            >
              <span>{label}</span>
              <span
                className={cn(
                  "font-mono text-[10px]",
                  isActive ? "opacity-80" : "text-muted-foreground"
                )}
                aria-hidden="true"
              >
                {option.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
