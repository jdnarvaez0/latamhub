/**
 * Stage filter — single-select radio group.
 *
 * Spec: `startup-filters` "Stage filter ... filter by startup stage".
 *
 * Behaviour:
 *  - Single-select. Tapping the active stage clears the filter
 *    (`onChange(null)`), mirroring the country filter's toggle.
 *  - Labels come from `STAGE_LABELS` so the user sees Spanish labels
 *    even though the URL stores the English enum slug.
 *  - Unknown / coming-soon stages are dropped by the URL parser — this
 *    component is responsible for the display only.
 *
 * The render shape matches `CountryFilter`: a radio-group of pills with
 * an inline count chip on the right. Reusing the visual language keeps
 * the directory's "tablero" rhythm consistent across filters.
 *
 * URL contract: the parent derives the URL via `buildDirectoryUrl`. The
 * component never touches `useSearchParams` / `URLSearchParams` — it
 * only fires `onChange` with the next `Stage | null`.
 */
"use client";

import { cn } from "@/lib/utils";
import { STAGE_LABELS } from "@/lib/constants";
import type { Stage } from "@/lib/types";

import type { StageFilterOption } from "./option";

const basePillClass =
  "press inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors";

export interface StageFilterProps {
  /** Currently selected stage, or `null` for no stage filter. */
  value: Stage | null;
  /** Stage options in catalog order. */
  options: StageFilterOption[];
  /** Called with the next stage, or `null` to clear the filter. */
  onChange: (value: Stage | null) => void;
  /** Extra classes appended to the pill row. */
  className?: string;
}

export function StageFilter({
  value,
  options,
  onChange,
  className,
}: StageFilterProps) {
  const isAll = value === null;

  return (
    <div role="radiogroup" aria-label="Etapa" className={cn("space-y-2", className)}>
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
          Todas las etapas
        </button>

        {options.map((option) => {
          const isActive = value === option.value;
          const label = option.label ?? STAGE_LABELS[option.value] ?? option.value;

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
