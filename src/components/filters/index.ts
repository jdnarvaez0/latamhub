/**
 * Barrel for the filter family. Re-exporting from here keeps imports
 * tidy:
 *
 *   import { FilterPanel } from "@/components/filters";
 *
 * instead of drilling into each leaf. The barrel intentionally
 * re-exports the shared `FilterOption` types so callers can type their
 * option arrays without reaching into `option.ts`.
 */
export { CitySelect, type CitySelectProps } from "./city-select";
export { CountryFilter, type CountryFilterProps } from "./country-filter";
export {
  FilterPanel,
  type FilterPanelOptions,
  type FilterPanelProps,
} from "./filter-panel";
export { IndustryFilter, type IndustryFilterProps } from "./industry-filter";
export { ModalityFilter, type ModalityFilterProps } from "./modality-filter";
export { SearchInput, type SearchInputProps } from "./search-input";
export { StageFilter, type StageFilterProps } from "./stage-filter";
export {
  hasActiveFilters,
  type CountryFilterOption,
  type FilterOption,
  type ModalityFilterOption,
  type StageFilterOption,
} from "./option";
