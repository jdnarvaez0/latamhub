/**
 * Shared types and helpers for the filter family.
 *
 * The directory exposes the same `Option` shape to every single-value
 * filter (country, stage, modality, city) so the parent
 * (`DirectoryClient`, Unit 4) can compute counts once and pass them down.
 * Industry is multi-select — it consumes the same shape but expects an
 * array of selected slugs.
 */
import type { Country, Modality, Stage } from "@/lib/types";

/**
 * A single selectable value inside a filter control.
 *
 *  - `value`: the canonical slug stored in the URL (English, lowercase,
 *    kebab-case for industries; enum for the others).
 *  - `label`: the Spanish display string shown in the UI.
 *  - `count`: number of approved startups that match when this value is
 *    the only selection of this filter. The parent computes this once
 *    per render and passes it down — the filter components never count
 *    internally.
 *  - `disabled`: when `true`, the option is non-selectable and a reason
 *    tooltip is shown. The country filter computes this from
 *    `COMING_SOON_COUNTRIES`; other filters inherit whatever the parent
 *    passes.
 */
export interface FilterOption {
  value: string;
  label: string;
  count: number;
  disabled?: boolean;
}

/**
 * Country-specific option type. Narrows `value` to the closed country
 * set so `CountryFilter`'s `onChange` can return `Country | null`
 * without a cast.
 */
export interface CountryFilterOption extends FilterOption {
  value: Country;
}

/** Stage-specific option type. */
export interface StageFilterOption extends FilterOption {
  value: Stage;
}

/** Modality-specific option type. */
export interface ModalityFilterOption extends FilterOption {
  value: Modality;
}

/**
 * True when any field of the filter is non-default. Used by the panel to
 * show the "Limpiar filtros" affordance only when there is something to
 * clear. Pure, side-effect free.
 */
export function hasActiveFilters(filter: {
  q: string;
  industry: string[];
  country: string | null;
  city: string | null;
  stage: string | null;
  modality: string | null;
}): boolean {
  return (
    filter.q.length > 0 ||
    filter.industry.length > 0 ||
    filter.country !== null ||
    filter.city !== null ||
    filter.stage !== null ||
    filter.modality !== null
  );
}
