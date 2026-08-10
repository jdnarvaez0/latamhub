/**
 * Tests for `src/components/filters/option.ts` — the shared `Option`
 * shape consumed by every filter and the pure `hasActiveFilters`
 * helper that drives the "Limpiar filtros" affordance.
 *
 * Scope of this slice (testing foundation):
 *
 *   - `hasActiveFilters` is `true` when **any** of the six fields
 *     (`q`, `industry`, `country`, `city`, `stage`, `modality`) is
 *     non-default, and `false` only when every field is at its
 *     default. This is the predicate the `FilterPanel` uses to decide
 *     whether to render the "Limpiar filtros" button.
 *   - The structural type contracts (`FilterOption`,
 *     `CountryFilterOption`, `StageFilterOption`,
 *     `ModalityFilterOption`) are exercised at runtime via small
 *     object literals so the narrowing rules (`value: Country`,
 *     `value: Stage`, `value: Modality`) stay honest.
 *
 * The helper takes a structural shape (string for the enum fields,
 * not the narrowed `Country | Stage | Modality` types) — the tests
 * respect that and do not assume any narrower type at runtime. The
 * narrowing is enforced by `tsc --noEmit`, not by runtime checks.
 */
import { describe, expect, it } from "vitest";

import {
  hasActiveFilters,
  type CountryFilterOption,
  type FilterOption,
  type ModalityFilterOption,
  type StageFilterOption,
} from "@/components/filters/option";

/**
 * Default filter shape used by `hasActiveFilters`. Mirrors the
 * `DEFAULT_FILTER` shape in `@/lib/filtering` but uses `string`
 * (instead of `Country | Stage | Modality`) because
 * `hasActiveFilters` only checks for `null` / empty-string / empty-
 * array presence and does not need the closed enum narrowing.
 */
function makeBaseFilter() {
  return {
    q: "",
    industry: [] as string[],
    country: null as string | null,
    city: null as string | null,
    stage: null as string | null,
    modality: null as string | null,
  };
}

describe("hasActiveFilters", () => {
  it("returns false for the empty / default filter", () => {
    expect(hasActiveFilters(makeBaseFilter())).toBe(false);
  });

  it("returns true when q is non-empty (even one whitespace-free character)", () => {
    expect(hasActiveFilters({ ...makeBaseFilter(), q: "a" })).toBe(true);
    expect(hasActiveFilters({ ...makeBaseFilter(), q: "acme" })).toBe(true);
  });

  it("returns true when q is whitespace-only is left to the caller — the helper does not trim", () => {
    // Documenting current behaviour: `hasActiveFilters` checks
    // `filter.q.length > 0` literally. The URL parser / build pipeline
    // is responsible for trimming; this helper just reports presence.
    expect(hasActiveFilters({ ...makeBaseFilter(), q: " " })).toBe(true);
  });

  it("returns true when industry has at least one slug", () => {
    expect(hasActiveFilters({ ...makeBaseFilter(), industry: ["fintech"] })).toBe(true);
    expect(hasActiveFilters({ ...makeBaseFilter(), industry: ["fintech", "edtech"] })).toBe(true);
  });

  it("returns true when country is set", () => {
    expect(hasActiveFilters({ ...makeBaseFilter(), country: "CO" })).toBe(true);
  });

  it("returns true when city is set", () => {
    expect(hasActiveFilters({ ...makeBaseFilter(), city: "Bogotá" })).toBe(true);
  });

  it("returns true when stage is set", () => {
    expect(hasActiveFilters({ ...makeBaseFilter(), stage: "seed" })).toBe(true);
  });

  it("returns true when modality is set", () => {
    expect(hasActiveFilters({ ...makeBaseFilter(), modality: "remote" })).toBe(true);
  });

  it("returns true when several fields are set together (single boolean output)", () => {
    expect(
      hasActiveFilters({
        ...makeBaseFilter(),
        q: "acme",
        industry: ["fintech"],
        country: "CO",
        city: "Bogotá",
        stage: "seed",
        modality: "remote",
      })
    ).toBe(true);
  });

  it("returns false again when every field is reset to its default", () => {
    const filter = {
      q: "x",
      industry: ["fintech"] as string[],
      country: "CO" as string | null,
      city: "Bogotá" as string | null,
      stage: "seed" as string | null,
      modality: "remote" as string | null,
    };
    expect(hasActiveFilters(filter)).toBe(true);
    expect(
      hasActiveFilters({
        q: "",
        industry: [],
        country: null,
        city: null,
        stage: null,
        modality: null,
      })
    ).toBe(false);
  });
});

describe("FilterOption shape", () => {
  it("accepts a minimal FilterOption literal", () => {
    const option: FilterOption = {
      value: "fintech",
      label: "Fintech",
      count: 3,
    };
    expect(option).toEqual({ value: "fintech", label: "Fintech", count: 3 });
    expect(option.disabled).toBeUndefined();
  });

  it("accepts a disabled FilterOption", () => {
    const option: FilterOption = {
      value: "agtech",
      label: "Agtech",
      count: 0,
      disabled: true,
    };
    expect(option.disabled).toBe(true);
  });

  it("narrows CountryFilterOption.value to the Country union", () => {
    const co: CountryFilterOption = {
      value: "CO",
      label: "Colombia",
      count: 7,
    };
    const br: CountryFilterOption = {
      value: "BR",
      label: "Brasil",
      count: 0,
      disabled: true,
    };
    expect(co.value).toBe("CO");
    expect(br.value).toBe("BR");
  });

  it("narrows StageFilterOption.value to the Stage union", () => {
    const seed: StageFilterOption = {
      value: "seed",
      label: "Semilla",
      count: 2,
    };
    expect(seed.value).toBe("seed");
  });

  it("narrows ModalityFilterOption.value to the Modality union", () => {
    const remote: ModalityFilterOption = {
      value: "remote",
      label: "Remoto",
      count: 4,
    };
    expect(remote.value).toBe("remote");
  });
});
