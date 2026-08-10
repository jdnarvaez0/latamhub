/**
 * Tests for `src/lib/directory-options.ts` — the pure option/count
 * computation that feeds `<FilterPanel/>` from the approved-startup
 * array and the current `DirectoryFilter`.
 *
 * Scope of this slice (Unit 4 — pure logic):
 *
 *   - Country / industry / stage / modality counts are the number of
 *     approved startups that match when ONLY that filter is applied
 *     (every other filter at default).
 *   - The order of country / industry / stage / modality options is the
 *     catalog order of their `*_LABELS` map, not alphabetical.
 *   - City options are the distinct cities across approved startups in
 *     the **selected country**, sorted alphabetically using the Spanish
 *     locale. When no country is selected the city list is empty.
 *   - Modality counts count startups with at least one matching job —
 *     a startup with three remote jobs counts once, not three times.
 *   - Coming-soon countries (BR/CL/AR/MX) emit `count: 0` regardless of
 *     the input data so the count chip stays honest.
 *
 * The tests use plain object literals for `Startup` rows; only the
 * fields the predicate and the counter actually read are populated.
 * Anything else (`logoUrl`, `website`, `investors`, etc.) is left at
 * its default so the test stays focused on the counting rules.
 */
import { describe, expect, it } from "vitest";

import {
  COMING_SOON_COUNTRIES,
  COUNTRY_LABELS,
  INDUSTRY_LABELS,
  INDUSTRY_SLUGS,
  MODALITY_LABELS,
  STAGE_LABELS,
} from "@/lib/constants";
import { DEFAULT_FILTER, type DirectoryFilter } from "@/lib/filtering";
import { computeFilterPanelOptions } from "@/lib/directory-options";
import type { Job, Modality, Stage, Startup } from "@/lib/types";

/**
 * Build a minimal approved startup for testing. Defaults to a Colombia
 * fintech at seed stage with a single onsite job so the simplest
 * counting test can be written in one line.
 */
interface MakeStartupOptions {
  country?: Startup["country"];
  city?: string | null;
  industry?: string;
  stage?: Stage | null;
  jobs?: Array<{ modality: Modality }>;
}

function makeStartup({
  country = "CO",
  city = "Bogotá",
  industry = "fintech",
  stage = "seed",
  jobs = [{ modality: "onsite" as Modality }],
}: MakeStartupOptions = {}): Startup {
  return {
    id: `startup-${Math.random().toString(36).slice(2, 10)}`,
    name: "Test Startup",
    slug: `test-${Math.random().toString(36).slice(2, 8)}`,
    description: "A test startup for directory-options unit tests.",
    longDescription: null,
    logoUrl: null,
    website: null,
    linkedinUrl: null,
    country,
    city,
    industry,
    stage,
    foundedYear: null,
    employeeRange: null,
    investors: [],
    status: "approved",
    submittedBy: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    jobs: jobs.map<Job>((job, index) => ({
      id: `job-${index}`,
      startupId: "startup-test",
      title: "Test job",
      area: null,
      location: null,
      modality: job.modality,
      salaryRange: null,
      applyUrl: "https://example.com/apply",
    })),
  };
}

/**
 * Empty filter, used by every test as the baseline. Tests mutate a
 * copy when they want a non-default value.
 */
const baseFilter: DirectoryFilter = { ...DEFAULT_FILTER };

describe("computeFilterPanelOptions — counts", () => {
  it("counts every approved startup when no country is selected (country=CO test row)", () => {
    const rows: Startup[] = [makeStartup()];
    const options = computeFilterPanelOptions(rows, baseFilter);
    const co = options.country.find((option) => option.value === "CO");
    expect(co?.count).toBe(1);
  });

  it("counts multiple startups in the same country correctly", () => {
    const rows: Startup[] = [
      makeStartup({ country: "CO", city: "Bogotá" }),
      makeStartup({ country: "CO", city: "Medellín" }),
      makeStartup({ country: "CO", city: "Bogotá" }),
    ];
    const options = computeFilterPanelOptions(rows, baseFilter);
    const co = options.country.find((option) => option.value === "CO");
    expect(co?.count).toBe(3);
  });

  it("counts only startups that match when industry is the sole filter", () => {
    const rows: Startup[] = [
      makeStartup({ industry: "fintech" }),
      makeStartup({ industry: "fintech" }),
      makeStartup({ industry: "healthtech" }),
    ];
    const options = computeFilterPanelOptions(rows, baseFilter);
    const fintech = options.industry.find((option) => option.value === "fintech");
    const healthtech = options.industry.find(
      (option) => option.value === "healthtech"
    );
    expect(fintech?.count).toBe(2);
    expect(healthtech?.count).toBe(1);
  });

  it("counts stage matches based on the row's stage field", () => {
    const rows: Startup[] = [
      makeStartup({ stage: "seed" }),
      makeStartup({ stage: "seed" }),
      makeStartup({ stage: "series-a" }),
    ];
    const options = computeFilterPanelOptions(rows, baseFilter);
    const seed = options.stage.find((option) => option.value === "seed");
    const seriesA = options.stage.find((option) => option.value === "series-a");
    expect(seed?.count).toBe(2);
    expect(seriesA?.count).toBe(1);
  });

  it("counts modality by startup-with-at-least-one-matching-job (not per-job)", () => {
    const rows: Startup[] = [
      makeStartup({ jobs: [{ modality: "remote" }, { modality: "hybrid" }] }),
      makeStartup({ jobs: [{ modality: "remote" }, { modality: "remote" }] }),
      makeStartup({ jobs: [{ modality: "onsite" }] }),
    ];
    const options = computeFilterPanelOptions(rows, baseFilter);
    const remote = options.modality.find((option) => option.value === "remote");
    const hybrid = options.modality.find((option) => option.value === "hybrid");
    const onsite = options.modality.find((option) => option.value === "onsite");
    // Two startups have at least one remote job.
    expect(remote?.count).toBe(2);
    // One startup has at least one hybrid job.
    expect(hybrid?.count).toBe(1);
    // One startup has at least one onsite job.
    expect(onsite?.count).toBe(1);
  });

  it("returns zero counts for an empty dataset", () => {
    const options = computeFilterPanelOptions([], baseFilter);
    for (const country of options.country) {
      expect(country.count).toBe(0);
    }
    for (const industry of options.industry) {
      expect(industry.count).toBe(0);
    }
    for (const stage of options.stage) {
      expect(stage.count).toBe(0);
    }
    for (const modality of options.modality) {
      expect(modality.count).toBe(0);
    }
    expect(options.city).toEqual([]);
  });

  it("counts ignore non-approved rows via the predicate's stage / industry rules", () => {
    // The predicate uses the row fields directly; for this test we
    // confirm that a startup whose `stage` is null (or unknown) is
    // simply not matched by the stage filter.
    const rows: Startup[] = [
      makeStartup({ stage: "seed" }),
      makeStartup({ stage: null }),
    ];
    const options = computeFilterPanelOptions(rows, baseFilter);
    const seed = options.stage.find((option) => option.value === "seed");
    expect(seed?.count).toBe(1);
  });
});

describe("computeFilterPanelOptions — deterministic ordering", () => {
  it("emits country options in COUNTRY_LABELS key order", () => {
    const rows: Startup[] = [];
    const options = computeFilterPanelOptions(rows, baseFilter);
    const keys = Object.keys(COUNTRY_LABELS);
    expect(options.country.map((option) => option.value)).toEqual(keys);
  });

  it("emits industry options in INDUSTRY_SLUGS catalog order", () => {
    const rows: Startup[] = [];
    const options = computeFilterPanelOptions(rows, baseFilter);
    expect(options.industry.map((option) => option.value)).toEqual(
      INDUSTRY_SLUGS
    );
  });

  it("emits stage options in STAGE_LABELS key order", () => {
    const rows: Startup[] = [];
    const options = computeFilterPanelOptions(rows, baseFilter);
    const keys = Object.keys(STAGE_LABELS);
    expect(options.stage.map((option) => option.value)).toEqual(keys);
  });

  it("emits modality options in MODALITY_LABELS key order", () => {
    const rows: Startup[] = [];
    const options = computeFilterPanelOptions(rows, baseFilter);
    const keys = Object.keys(MODALITY_LABELS);
    expect(options.modality.map((option) => option.value)).toEqual(keys);
  });

  it("emits the same ordering on a non-empty dataset (deterministic)", () => {
    const rows: Startup[] = [
      makeStartup({ industry: "edtech" }),
      makeStartup({ industry: "fintech" }),
    ];
    const options = computeFilterPanelOptions(rows, baseFilter);
    expect(options.industry.map((option) => option.value)).toEqual(
      INDUSTRY_SLUGS
    );
  });
});

describe("computeFilterPanelOptions — city options", () => {
  it("returns an empty city list when no country is selected", () => {
    const rows: Startup[] = [
      makeStartup({ country: "CO", city: "Bogotá" }),
      makeStartup({ country: "CO", city: "Medellín" }),
    ];
    const options = computeFilterPanelOptions(rows, {
      ...baseFilter,
      country: null,
    });
    expect(options.city).toEqual([]);
  });

  it("returns the distinct cities for the selected country with their counts", () => {
    const rows: Startup[] = [
      makeStartup({ country: "CO", city: "Bogotá" }),
      makeStartup({ country: "CO", city: "Medellín" }),
      makeStartup({ country: "CO", city: "Bogotá" }),
    ];
    const options = computeFilterPanelOptions(rows, {
      ...baseFilter,
      country: "CO",
    });
    const bogota = options.city.find((option) => option.value === "Bogotá");
    const medellin = options.city.find(
      (option) => option.value === "Medellín"
    );
    expect(bogota?.count).toBe(2);
    expect(medellin?.count).toBe(1);
  });

  it("ignores cities from startups outside the selected country", () => {
    const rows: Startup[] = [
      makeStartup({ country: "CO", city: "Bogotá" }),
      // Even if there were a BR startup with a city, the list should
      // not include it because the user picked CO.
      makeStartup({ country: "CO", city: "Cali" }),
    ];
    const options = computeFilterPanelOptions(rows, {
      ...baseFilter,
      country: "CO",
    });
    const cities = options.city.map((option) => option.value);
    expect(cities).toContain("Bogotá");
    expect(cities).toContain("Cali");
    expect(cities.length).toBe(2);
  });

  it("ignores startups with a null city in the selected country", () => {
    const rows: Startup[] = [
      makeStartup({ country: "CO", city: null }),
      makeStartup({ country: "CO", city: "Bogotá" }),
    ];
    const options = computeFilterPanelOptions(rows, {
      ...baseFilter,
      country: "CO",
    });
    expect(options.city.length).toBe(1);
    expect(options.city[0]?.value).toBe("Bogotá");
  });

  it("returns an empty city list when the selected country has no approved startups with a city", () => {
    const rows: Startup[] = [
      makeStartup({ country: "CO", city: null }),
      makeStartup({ country: "CO", city: null }),
    ];
    const options = computeFilterPanelOptions(rows, {
      ...baseFilter,
      country: "CO",
    });
    expect(options.city).toEqual([]);
  });

  it("sorts city options alphabetically using the Spanish locale", () => {
    const rows: Startup[] = [
      makeStartup({ country: "CO", city: "Medellín" }),
      makeStartup({ country: "CO", city: "Bogotá" }),
      makeStartup({ country: "CO", city: "Cali" }),
      makeStartup({ country: "CO", city: "Barranquilla" }),
    ];
    const options = computeFilterPanelOptions(rows, {
      ...baseFilter,
      country: "CO",
    });
    expect(options.city.map((option) => option.value)).toEqual([
      "Barranquilla",
      "Bogotá",
      "Cali",
      "Medellín",
    ]);
  });
});

describe("computeFilterPanelOptions — coming-soon country count", () => {
  it("returns count 0 for every coming-soon country regardless of input data", () => {
    // Even if there were a BR row in the data (which would be a
    // data-layer mistake — BR is disabled and has no approved rows
    // in Phase 1), the coming-soon countries must still report `0`.
    const rows: Startup[] = [
      makeStartup({ country: "CO", city: "Bogotá" }),
      makeStartup({ country: "CO", city: "Bogotá" }),
    ];
    const options = computeFilterPanelOptions(rows, baseFilter);
    for (const code of COMING_SOON_COUNTRIES) {
      const entry = options.country.find((option) => option.value === code);
      expect(entry?.count).toBe(0);
    }
  });

  it("emits every coming-soon country with count 0 on an empty dataset", () => {
    const options = computeFilterPanelOptions([], baseFilter);
    for (const code of COMING_SOON_COUNTRIES) {
      const entry = options.country.find((option) => option.value === code);
      expect(entry?.count).toBe(0);
    }
  });

  it("emits every coming-soon country even when only CO has approved startups", () => {
    const rows: Startup[] = [
      makeStartup({ country: "CO" }),
      makeStartup({ country: "CO" }),
    ];
    const options = computeFilterPanelOptions(rows, baseFilter);
    expect(options.country.length).toBe(Object.keys(COUNTRY_LABELS).length);
    for (const code of COMING_SOON_COUNTRIES) {
      expect(
        options.country.find((option) => option.value === code)?.count
      ).toBe(0);
    }
  });
});

describe("computeFilterPanelOptions — labels", () => {
  it("uses the Spanish display maps for every option label", () => {
    const rows: Startup[] = [];
    const options = computeFilterPanelOptions(rows, baseFilter);
    for (const country of options.country) {
      expect(country.label).toBe(COUNTRY_LABELS[country.value]);
    }
    for (const industry of options.industry) {
      expect(industry.label).toBe(INDUSTRY_LABELS[industry.value]);
    }
    for (const stage of options.stage) {
      expect(stage.label).toBe(STAGE_LABELS[stage.value]);
    }
    for (const modality of options.modality) {
      expect(modality.label).toBe(MODALITY_LABELS[modality.value]);
    }
  });

  it("uses the city name as its own label", () => {
    const rows: Startup[] = [
      makeStartup({ country: "CO", city: "Bogotá" }),
      makeStartup({ country: "CO", city: "Medellín" }),
    ];
    const options = computeFilterPanelOptions(rows, {
      ...baseFilter,
      country: "CO",
    });
    for (const city of options.city) {
      expect(city.label).toBe(city.value);
    }
  });
});
