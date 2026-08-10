/**
 * Pure option/count computation for the public directory's filter panel.
 *
 * `<DirectoryClient/>` (Unit 4) feeds `<FilterPanel/>` with a
 * deterministic set of options + counts — one entry per filter value.
 * All the filtering knowledge already lives in `@/lib/filtering`; this
 * module is the bridge that turns a `Startup[]` + the current
 * `DirectoryFilter` into a `FilterPanelOptions` bundle.
 *
 * ## Count contract (static)
 *
 * For every value of every filter, the count is the number of approved
 * startups that would match **if only that filter were applied**, with
 * every other filter at its default. The reasoning:
 *
 *  - **Determinism**: same input → same counts → server and client
 *    hydration agree without a flicker.
 *  - **Spec parity**: `FilterOption.count`'s docstring in
 *    `@/components/filters/option.ts` says "match when this value is
 *    the only selection of this filter".
 *  - **Simplicity**: the predicate (`filterStartups`) already encodes
 *    every rule; we just call it with a one-filter patch.
 *
 * Coming-soon countries (BR/CL/AR/MX) emit `count: 0` here so the
 * count chip stays honest even if a future caller forgets the
 * `<CountryFilter/>` defense-in-depth layer.
 *
 * City options are computed for the **selected country only**. When
 * no country is selected the city list is empty — `<CitySelect/>` is
 * disabled in that case.
 *
 * ## Order
 *
 *  - `country` / `industry` / `stage` / `modality`: catalog order from
 *    their `*_LABELS` key set (matches the prototype).
 *  - `city`: alphabetical, Spanish locale (`"es"`) so accents sort
 *    naturally ("Bogotá" before "Cali").
 *
 * Isomorphic — no `"use client"`, no React, no `useEffect`.
 */
import {
  COMING_SOON_COUNTRIES,
  COUNTRY_LABELS,
  INDUSTRY_LABELS,
  INDUSTRY_SLUGS,
  MODALITY_LABELS,
  STAGE_LABELS,
} from "@/lib/constants";
import {
  DEFAULT_FILTER,
  filterStartups,
  type DirectoryFilter,
} from "@/lib/filtering";
import type { Startup } from "@/lib/types";

import type {
  CountryFilterOption,
  FilterOption,
  ModalityFilterOption,
  StageFilterOption,
} from "@/components/filters/option";

/**
 * The bundle of options `<DirectoryClient/>` passes to
 * `<FilterPanel/>`. Each filter type uses its narrowed option type so
 * the sub-controls' `onChange` callbacks narrow without a cast.
 */
export interface FilterPanelOptions {
  country: CountryFilterOption[];
  industry: FilterOption[];
  stage: StageFilterOption[];
  modality: ModalityFilterOption[];
  city: FilterOption[];
}

const COUNTRY_KEYS: ReadonlyArray<keyof typeof COUNTRY_LABELS> = Object.keys(
  COUNTRY_LABELS
) as Array<keyof typeof COUNTRY_LABELS>;
const STAGE_KEYS: ReadonlyArray<keyof typeof STAGE_LABELS> = Object.keys(
  STAGE_LABELS
) as Array<keyof typeof STAGE_LABELS>;
const MODALITY_KEYS: ReadonlyArray<keyof typeof MODALITY_LABELS> = Object.keys(
  MODALITY_LABELS
) as Array<keyof typeof MODALITY_LABELS>;

/**
 * Build a `FilterPanelOptions` bundle from the approved-startup array
 * and the current filter. `filter.country` drives the city list; every
 * other field is ignored for count purposes (static contract above).
 */
export function computeFilterPanelOptions(
  rows: Startup[],
  filter: DirectoryFilter
): FilterPanelOptions {
  return {
    country: computeCountryOptions(rows),
    industry: computeIndustryOptions(rows),
    stage: computeStageOptions(rows),
    modality: computeModalityOptions(rows),
    city: computeCityOptions(rows, filter.country),
  };
}

/**
 * Country options in catalog order. Coming-soon countries get
 * `count: 0` regardless of the input data so the count chip stays
 * honest even if the parent ever passes a non-zero count for
 * BR/CL/AR/MX. Labels come from `COUNTRY_LABELS`.
 */
function computeCountryOptions(rows: Startup[]): CountryFilterOption[] {
  const comingSoonSet = new Set<string>(COMING_SOON_COUNTRIES);
  return COUNTRY_KEYS.map((value) => {
    const isComingSoon = comingSoonSet.has(value);
    const count = isComingSoon ? 0 : countWithFilter(rows, { country: value });
    return {
      value,
      label: COUNTRY_LABELS[value],
      count,
    };
  });
}

/**
 * Industry options in catalog order (`INDUSTRY_SLUGS`). Each count is
 * the number of approved startups whose `industry` slug equals the
 * option's slug.
 */
function computeIndustryOptions(rows: Startup[]): FilterOption[] {
  return INDUSTRY_SLUGS.map((value) => ({
    value,
    label: INDUSTRY_LABELS[value] ?? value,
    count: countWithFilter(rows, { industry: [value] }),
  }));
}

/**
 * Stage options in catalog order. Each count is the number of
 * approved startups whose `stage` equals the option's stage.
 */
function computeStageOptions(rows: Startup[]): StageFilterOption[] {
  return STAGE_KEYS.map((value) => ({
    value,
    label: STAGE_LABELS[value],
    count: countWithFilter(rows, { stage: value }),
  }));
}

/**
 * Modality options in catalog order. Each count is the number of
 * approved startups with **at least one job** of that modality — the
 * same predicate `filterStartups` uses, so the count matches what the
 * user sees after applying the modality filter.
 */
function computeModalityOptions(rows: Startup[]): ModalityFilterOption[] {
  return MODALITY_KEYS.map((value) => ({
    value,
    label: MODALITY_LABELS[value],
    count: countWithFilter(rows, { modality: value }),
  }));
}

/**
 * City options for the selected country. Empty when no country is
 * selected. Otherwise: distinct, non-null cities across approved
 * startups in that country, sorted alphabetically with the Spanish
 * locale. Each count is the number of startups in the country with
 * that city.
 */
function computeCityOptions(
  rows: Startup[],
  country: DirectoryFilter["country"]
): FilterOption[] {
  if (country === null) return [];

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.country !== country) continue;
    if (row.city === null) continue;
    counts.set(row.city, (counts.get(row.city) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => a.city.localeCompare(b.city, "es"))
    .map(({ city, count }) => ({
      value: city,
      label: city,
      count,
    }));
}

/**
 * Apply a one-filter patch on top of `DEFAULT_FILTER` and return the
 * count of matching startups. Centralizes the static-count contract.
 */
function countWithFilter(
  rows: Startup[],
  patch: Partial<DirectoryFilter>
): number {
  const testFilter: DirectoryFilter = { ...DEFAULT_FILTER, ...patch };
  return filterStartups(rows, testFilter).length;
}
