/**
 * Filter panel — composes the entire filter family with responsive
 * layout.
 *
 * Spec: `startup-filters`, design §12.
 *
 * ## Composition
 *
 * The panel renders every filter control in a fixed vertical order:
 *
 *   1. Search (text input)
 *   2. Country (single-select pills with coming-soon countries disabled)
 *   3. Industry (multi-select checkboxes)
 *   4. Stage (single-select pills)
 *   5. Modality (single-select pills)
 *   6. City (single-select dropdown, disabled unless country is set)
 *   7. "Limpiar filtros" button (visible when any filter is active)
 *
 * Each control is fully controlled by the parent. The panel never
 * touches `useSearchParams` / `URLSearchParams` — it only forwards
 * `onChange` events upward. URL mutation belongs to the parent
 * (`DirectoryClient`, Unit 4) so URL SSOT stays single-venue.
 *
 * ## Page reset
 *
 * Any change to `q | industry | country | city | stage | modality` must
 * reset `page` to `1` (`design.md` decision §5). The panel centralizes
 * this rule: every `onChange` it emits includes `page: 1`. The parent
 * just passes the result to `buildDirectoryUrl`, which already drops
 * `page=1` from the serialized URL.
 *
 * Country changes also clear `city` (`design.md` decision §6 + spec
 * "Visitor clears country selection"). The panel enforces that locally
 * so the parent does not need to.
 *
 * ## Responsive layout
 *
 *  - **`<md` (mobile)**: the whole panel sits inside a native
 *    `<details open>` with a `<summary>` that reads "Filtros". The
 *    user collapses / expands the disclosure with a tap on the
 *    summary. No client JS is required to toggle — the browser owns
 *    `<details>` semantics, which means screen-reader announcement,
 *    keyboard `Enter` / `Space` activation, and reduced-motion support
 *    all come for free.
 *  - **`≥md` (desktop)**: the same `<details>` is used, but the
 *    `<summary>` is hidden (`md:hidden`) and the content area is
 *    rendered as a sticky aside so it follows the visitor as they
 *    scroll the grid.
 *
 * The component is a client component because it owns the
 * "Limpiar filtros" button (`onClick`) and the `<details>` `<summary>`
 * state. The HTML `<details>` element is itself server-renderable, but
 * the panel needs the client interactivity for the clear button and
 * the panel-level callbacks.
 */
"use client";

import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import type { DirectoryFilter } from "@/lib/filtering";
import type { Country, Modality, Stage } from "@/lib/types";

import { CitySelect } from "./city-select";
import { CountryFilter } from "./country-filter";
import {
  hasActiveFilters,
  type CountryFilterOption,
  type FilterOption,
  type ModalityFilterOption,
  type StageFilterOption,
} from "./option";
import { IndustryFilter } from "./industry-filter";
import { ModalityFilter } from "./modality-filter";
import { SearchInput } from "./search-input";
import { StageFilter } from "./stage-filter";

/**
 * The bundle of options the parent passes down. Each filter type is
 * optional so the panel degrades gracefully if the parent forgets to
 * compute one — the corresponding sub-control just renders nothing.
 *
 * Country / stage / modality use their narrowed option type so the
 * `value` of the matching option narrows to the enum and the child's
 * `onChange` returns the precise type without a cast.
 */
export interface FilterPanelOptions {
  country: CountryFilterOption[];
  industry: FilterOption[];
  stage: StageFilterOption[];
  modality: ModalityFilterOption[];
  city: FilterOption[];
}

export interface FilterPanelProps {
  /** Current filter (the URL SSOT). The panel never mutates it. */
  filter: DirectoryFilter;
  /** Per-filter option lists with counts. */
  options: FilterPanelOptions;
  /**
   * Called with the next filter. The panel always includes
   * `page: 1` (the design's page-reset rule). Country changes also
   * clear `city`. The parent is expected to call `buildDirectoryUrl`
   * with the result and `router.replace(url, { scroll: false })`.
   */
  onChange: (next: DirectoryFilter) => void;
  /**
   * Called when the visitor hits "Limpiar filtros". The panel does not
   * implement the clearing — the parent decides whether to clear all
   * fields, drop the URL, etc. The default handler (`onChange(DEFAULT_FILTER)`)
   * is provided if the parent wants to skip the prop.
   */
  onClearAll?: () => void;
  /** Extra classes appended to the outer wrapper. */
  className?: string;
}

/**
 * The visual heading the panel shows above the filter list. The mobile
 * `<summary>` reuses the same wording ("Filtros") so the visitor sees
 * one brand voice across breakpoints.
 */
const PANEL_HEADING = "Filtros";
const CLEAR_LABEL = "Limpiar filtros";

export function FilterPanel({
  filter,
  options,
  onChange,
  onClearAll,
  className,
}: FilterPanelProps) {
  const anyActive = hasActiveFilters(filter);
  const cityDisabled = filter.country === null;
  const detailsRef = useRef<HTMLDetailsElement>(null);

  /**
   * Force the disclosure open on `≥md` so a visitor who collapses the
   * panel on mobile and then resizes to desktop still sees the
   * filters. Browsers cannot force `<details>` open via CSS — the
   * `open` attribute is a UA-managed boolean — so a small effect is
   * the only portable solution. The listener is attached once and
   * torn down on unmount.
   */
  useEffect(() => {
    const details = detailsRef.current;
    if (!details) return;
    const mql = window.matchMedia("(min-width: 768px)");
    function sync() {
      if (details && mql.matches) details.open = true;
    }
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  /**
   * Apply a partial filter change and reset the page. Centralized so
   * the page-reset rule is enforced in one place. The parent receives
   * the complete next filter, so URL building stays single-venue.
   */
  const applyChange = useCallback(
    (patch: Partial<DirectoryFilter>) => {
      onChange({ ...filter, ...patch, page: 1 });
    },
    [filter, onChange]
  );

  /**
   * Country cascade: changing country also clears the city filter
   * (spec: "Visitor clears country selection → city filter is also
   * cleared"). The parent does not need to know about this rule.
   */
  const handleCountryChange = useCallback(
    (next: Country | null) => {
      // City is always bound to the country — clearing the country
      // clears the city, and switching to a new country also clears
      // any stale city that belonged to the previous country.
      onChange({
        ...filter,
        country: next,
        city: null,
        page: 1,
      });
    },
    [filter, onChange]
  );

  const handleIndustryChange = useCallback(
    (next: string[]) => applyChange({ industry: next }),
    [applyChange]
  );
  const handleStageChange = useCallback(
    (next: Stage | null) => applyChange({ stage: next }),
    [applyChange]
  );
  const handleModalityChange = useCallback(
    (next: Modality | null) => applyChange({ modality: next }),
    [applyChange]
  );
  const handleCityChange = useCallback(
    (next: string | null) => applyChange({ city: next }),
    [applyChange]
  );
  const handleSearchChange = useCallback(
    (next: string) => applyChange({ q: next }),
    [applyChange]
  );
  const handleClearAll = useCallback(() => {
    if (onClearAll) {
      onClearAll();
    } else {
      onChange({ ...filter, q: "", industry: [], country: null, city: null, stage: null, modality: null, page: 1 });
    }
  }, [filter, onChange, onClearAll]);

  return (
    <details
      // The panel is always "open" — the mobile disclosure toggles via
      // the browser-native `<summary>` element. On desktop the
      // summary is hidden and the content is forced visible.
      ref={detailsRef}
      open
      className={cn(
        "group border border-border bg-surface",
        "md:sticky md:top-20 md:self-start",
        className
      )}
    >
      <summary
        className={cn(
          "data-label flex cursor-pointer list-none items-center justify-between px-4 py-3 transition-colors hover:text-primary md:hidden"
        )}
      >
        <span>{PANEL_HEADING}</span>
        <svg
          className="size-4 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 9l7 7 7-7"
          />
        </svg>
      </summary>

      {/*
        The header inside the panel is visible on both breakpoints.
        On desktop it acts as the section heading; on mobile it sits
        inside the disclosure content.
      */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-tight">
          {PANEL_HEADING}
        </h2>
        {anyActive ? (
          <button
            type="button"
            onClick={handleClearAll}
            className="data-label press text-muted-foreground hover:text-primary"
          >
            {CLEAR_LABEL}
          </button>
        ) : null}
      </div>

      <div className="space-y-6 p-4">
        <div>
          <h3 className="data-label mb-3 block">Buscar</h3>
          <SearchInput
            value={filter.q}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre, industria, ciudad…"
          />
        </div>

        <div>
          <h3 className="data-label mb-3 block">País</h3>
          {options.country.length > 0 ? (
            <CountryFilter
              value={filter.country}
              options={options.country}
              onChange={handleCountryChange}
            />
          ) : null}
        </div>

        <div>
          <h3 className="data-label mb-3 block">Industria</h3>
          {options.industry.length > 0 ? (
            <IndustryFilter
              values={filter.industry}
              options={options.industry}
              onChange={handleIndustryChange}
            />
          ) : null}
        </div>

        <div>
          <h3 className="data-label mb-3 block">Etapa</h3>
          {options.stage.length > 0 ? (
            <StageFilter
              value={filter.stage}
              options={options.stage}
              onChange={handleStageChange}
            />
          ) : null}
        </div>

        <div>
          <h3 className="data-label mb-3 block">Modalidad</h3>
          {options.modality.length > 0 ? (
            <ModalityFilter
              value={filter.modality}
              options={options.modality}
              onChange={handleModalityChange}
            />
          ) : null}
        </div>

        <div>
          <CitySelect
            value={filter.city}
            options={options.city}
            disabled={cityDisabled}
            onChange={handleCityChange}
          />
        </div>
      </div>
    </details>
  );
}
