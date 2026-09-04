/**
 * Job filters bar — debounced search + country select + modality pills.
 *
 * "use client" because it owns the debounce timer via <SearchInput>.
 * It does NOT import useSearchParams — the parent (JobsClient) owns the
 * URL and passes the current filter down as props.
 *
 * URL contract: all filter mutations go through the `onChange` callback
 * which receives a partial patch; the parent merges it and calls
 * buildJobsUrl + router.replace.
 */
"use client";

import { SearchInput } from "@/components/filters/search-input";
import { COUNTRY_LABELS, MODALITY_LABELS } from "@/lib/constants";
import type { JobsFilter } from "@/lib/jobs-filtering";
import type { Country, Modality } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface JobFiltersProps {
  filter: JobsFilter;
  onChange: (patch: Partial<JobsFilter>) => void;
  className?: string;
}

const MODALITIES = Object.entries(MODALITY_LABELS) as [Modality, string][];
const COUNTRIES = Object.entries(COUNTRY_LABELS) as [Country, string][];

export function JobFilters({ filter, onChange, className }: JobFiltersProps) {
  return (
    <div
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-end", className)}
    >
      {/* Free-text search — reuses the shared SearchInput with debounce */}
      <div className="flex-1">
        <SearchInput
          id="jobs-search"
          value={filter.q}
          onChange={(q) => onChange({ q })}
          placeholder="Buscar cargo, empresa, área o ciudad…"
        />
      </div>

      {/* Country select */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="jobs-country"
          className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
        >
          País
        </label>
        <select
          id="jobs-country"
          value={filter.country ?? ""}
          onChange={(e) =>
            onChange({
              country: (e.target.value as Country) || null,
            })
          }
          className="h-10 border border-border bg-surface px-3 text-sm transition-colors outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Todos los países</option>
          {COUNTRIES.map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Modality pills */}
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
          Modalidad
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ modality: null })}
            className={cn(
              "border px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors",
              filter.modality === null
                ? "border-primary bg-primary text-background"
                : "border-border bg-surface text-foreground hover:border-primary hover:text-primary"
            )}
          >
            Todas
          </button>
          {MODALITIES.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                onChange({ modality: filter.modality === value ? null : value })
              }
              className={cn(
                "border px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors",
                filter.modality === value
                  ? "border-primary bg-primary text-background"
                  : "border-border bg-surface text-foreground hover:border-primary hover:text-primary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
