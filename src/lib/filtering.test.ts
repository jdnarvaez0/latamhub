/**
 * Tests for `src/lib/filtering.ts` — URL single-source-of-truth parsing /
 * building and the pure startup predicate.
 *
 * Scope of this slice (testing foundation):
 *
 *   - `parseDirectoryUrl` and `buildDirectoryUrl` round-trip the URL
 *     contract documented at the top of `filtering.ts`.
 *   - Repeated `industry` keys dedupe and order-preserve.
 *   - Unknown / coming-soon enum values are dropped.
 *   - City requires a valid country.
 *   - The default page (`1`) is omitted from the serialized URL.
 *   - `filterStartups` honors every filter, in particular modality
 *     through `Startup.jobs`.
 *   - `paginateStartups` / `totalPages` / `clampPage` respect the
 *     locked `DIRECTORY_PAGE_SIZE = 8` boundary and over-the-end pages.
 *
 * The tests are deterministic, hermetic and side-effect free: no
 * network, no Supabase, no `Date.now()`, no `Math.random()`. Realistic
 * `Startup` fixtures with the minimum required fields are built in a
 * tiny in-file factory so each test owns its dataset and reads
 * independently.
 */
import { describe, expect, it } from "vitest";

import {
  buildDirectoryUrl,
  DEFAULT_FILTER,
  DIRECTORY_PAGE_SIZE,
  filterStartups,
  paginateStartups,
  parseDirectoryUrl,
  totalPages,
  clampPage,
  type DirectoryFilter,
} from "@/lib/filtering";
import type { Country, Job, Modality, Stage, Startup } from "@/lib/types";

/**
 * Minimal valid `Startup` factory. Only the fields exercised by the
 * filtering predicate are populated; everything else is left at the
 * minimal legal value for the type (empty arrays, `null`, etc.).
 *
 * Each test gets its own object via the spread in `makeStartup`, so
 * tests cannot accidentally mutate each other's fixtures.
 */
function makeStartup(overrides: Partial<Startup> = {}): Startup {
  return {
    id: "startup-id",
    name: "Acme",
    slug: "acme",
    description: "Default description",
    longDescription: null,
    logoUrl: null,
    website: null,
    linkedinUrl: null,
    country: "CO",
    city: "Bogotá",
    industry: "fintech",
    stage: "seed",
    foundedYear: null,
    employeeRange: null,
    investors: [],
    status: "approved",
    submittedBy: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    jobs: [],
    ...overrides,
  };
}

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-id",
    startupId: "startup-id",
    title: "Engineer",
    area: null,
    location: null,
    modality: "remote",
    salaryRange: null,
    applyUrl: "https://example.com/apply",
    ...overrides,
  };
}

describe("parseDirectoryUrl", () => {
  it("returns DEFAULT_FILTER for an empty URL", () => {
    const result = parseDirectoryUrl(new URLSearchParams(""));
    expect(result).toEqual(DEFAULT_FILTER);
  });

  it("trims the search query and reads q", () => {
    const result = parseDirectoryUrl(new URLSearchParams("q=%20%20fintech%20%20"));
    expect(result.q).toBe("fintech");
  });

  it("drops unknown industry slugs", () => {
    const result = parseDirectoryUrl(
      new URLSearchParams("industry=fintech&industry=not-a-slug&industry=edtech")
    );
    expect(result.industry).toEqual(["fintech", "edtech"]);
  });

  it("reads and dedupes repeated industry keys (order preserved)", () => {
    const result = parseDirectoryUrl(
      new URLSearchParams("industry=fintech&industry=edtech&industry=fintech&industry=saas")
    );
    expect(result.industry).toEqual(["fintech", "edtech", "saas"]);
  });

  it("normalizes industry casing and whitespace", () => {
    const result = parseDirectoryUrl(
      new URLSearchParams("industry=%20FinTech%20&industry=EDTECH")
    );
    expect(result.industry).toEqual(["fintech", "edtech"]);
  });

  it("accepts every known country in COUNTRY_LABELS (live + coming-soon)", () => {
    // The parser validates against `COUNTRY_LABELS`, which mirrors the
    // closed `Country` enum (CO / BR / CL / AR / MX). Coming-soon
    // countries are a UI-layer concern (`country-filter.tsx` renders
    // them as disabled pills); the URL parser does not gatekeep them.
    // This is intentional per `filtering.ts` — see JSDoc on
    // `parseDirectoryUrl` and the `filterStartups` predicate, which
    // works on the `Country` enum, not on `LIVE_COUNTRIES`.
    for (const country of ["CO", "BR", "CL", "AR", "MX"] as Country[]) {
      const result = parseDirectoryUrl(
        new URLSearchParams(`country=${country}`)
      );
      expect(result.country).toBe(country);
    }
  });

  it("drops truly unknown country codes (e.g. ZZ)", () => {
    const result = parseDirectoryUrl(new URLSearchParams("country=ZZ"));
    expect(result.country).toBeNull();
  });

  it("drops city unless a valid country is also present", () => {
    const result = parseDirectoryUrl(new URLSearchParams("city=Bogot%C3%A1"));
    expect(result.city).toBeNull();
  });

  it("keeps city when a coming-soon country is set (parser does not gatekeep)", () => {
    // Matches the current implementation: `parseDirectoryUrl` only
    // drops city when `country === null`, not when the country is
    // coming-soon. UI rendering prevents the user from reaching this
    // state, but a hand-crafted URL round-trips faithfully.
    const result = parseDirectoryUrl(
      new URLSearchParams("country=BR&city=S%C3%A3o%20Paulo")
    );
    expect(result.country).toBe<Country>("BR");
    expect(result.city).toBe("São Paulo");
  });

  it("drops city when the country itself is unknown", () => {
    const result = parseDirectoryUrl(
      new URLSearchParams("country=ZZ&city=Bogot%C3%A1")
    );
    expect(result.country).toBeNull();
    expect(result.city).toBeNull();
  });

  it("keeps city when a live country is present", () => {
    const result = parseDirectoryUrl(
      new URLSearchParams("country=CO&city=Bogot%C3%A1")
    );
    expect(result.country).toBe<Country>("CO");
    expect(result.city).toBe("Bogotá");
  });

  it("drops unknown stage / modality enum values", () => {
    const result = parseDirectoryUrl(
      new URLSearchParams("stage=ipo&modality=teleport")
    );
    expect(result.stage).toBeNull();
    expect(result.modality).toBeNull();
  });

  it("clamps missing / non-numeric / negative page to 1", () => {
    expect(parseDirectoryUrl(new URLSearchParams("")).page).toBe(1);
    expect(parseDirectoryUrl(new URLSearchParams("page=0")).page).toBe(1);
    expect(parseDirectoryUrl(new URLSearchParams("page=-3")).page).toBe(1);
    expect(parseDirectoryUrl(new URLSearchParams("page=abc")).page).toBe(1);
  });

  it("preserves a positive integer page", () => {
    const result = parseDirectoryUrl(new URLSearchParams("page=4"));
    expect(result.page).toBe(4);
  });

  it("parses a fully populated URL", () => {
    const result = parseDirectoryUrl(
      new URLSearchParams(
        "q=acme&industry=fintech&industry=edtech&country=CO&city=Medell%C3%ADn&stage=seed&modality=remote&page=2"
      )
    );
    expect(result).toEqual<DirectoryFilter>({
      q: "acme",
      industry: ["fintech", "edtech"],
      country: "CO",
      city: "Medellín",
      stage: "seed",
      modality: "remote",
      page: 2,
    });
  });
});

describe("buildDirectoryUrl", () => {
  it("returns an empty query when the filter is the default", () => {
    expect(buildDirectoryUrl(DEFAULT_FILTER)).toBe("");
    expect(buildDirectoryUrl(DEFAULT_FILTER, "/directorio")).toBe("/directorio");
  });

  it("omits page=1 (the canonical first-page URL)", () => {
    const url = buildDirectoryUrl({ ...DEFAULT_FILTER, page: 1 });
    expect(url).not.toContain("page=");
  });

  it("serializes page when > 1", () => {
    const url = buildDirectoryUrl({ ...DEFAULT_FILTER, page: 3 });
    expect(url).toBe("?page=3");
  });

  it("serializes repeated industry keys", () => {
    const url = buildDirectoryUrl({
      ...DEFAULT_FILTER,
      industry: ["fintech", "edtech"],
    });
    // URLSearchParams orders appended keys in insertion order, which is
    // exactly what we want: a deterministic, readable URL.
    expect(url).toBe("?industry=fintech&industry=edtech");
  });

  it("encodes spaces / non-ASCII in q and city", () => {
    const url = buildDirectoryUrl({
      ...DEFAULT_FILTER,
      q: "dos palabras",
      country: "CO",
      city: "Bogotá",
    });
    expect(url).toContain("q=dos+palabras");
    expect(url).toContain("city=Bogot%C3%A1");
  });

  it("drops null / empty / page=1 fields", () => {
    const url = buildDirectoryUrl({
      q: "",
      industry: [],
      country: null,
      city: null,
      stage: null,
      modality: null,
      page: 1,
    });
    expect(url).toBe("");
  });
});

describe("parseDirectoryUrl ↔ buildDirectoryUrl round-trip", () => {
  it("round-trips a fully populated filter", () => {
    const original: DirectoryFilter = {
      q: "acme fintech",
      industry: ["fintech", "edtech"],
      country: "CO",
      city: "Bogotá",
      stage: "seed",
      modality: "remote",
      page: 2,
    };
    const url = buildDirectoryUrl(original);
    const reparsed = parseDirectoryUrl(new URLSearchParams(url));
    expect(reparsed).toEqual(original);
  });

  it("normalizes an industry casing drift on round-trip", () => {
    // The parser canonicalizes `FinTech` → `fintech`, and the builder
    // emits the canonical slug in the same `?industry=fintech` form.
    // The URL is NOT empty after the round-trip — the industry key
    // remains because `industry.length > 0`.
    const url = "?industry=FinTech";
    const reparsed = parseDirectoryUrl(new URLSearchParams(url));
    expect(reparsed.industry).toEqual(["fintech"]);
    expect(buildDirectoryUrl(reparsed)).toBe("?industry=fintech");
  });

  it("preserves a coming-soon country on round-trip (parser does not gatekeep)", () => {
    // Documenting current behaviour: a hand-crafted URL with
    // `country=BR` survives the round-trip because the parser does
    // not drop coming-soon countries. The UI is responsible for
    // preventing the user from generating this URL.
    const reparsed = parseDirectoryUrl(new URLSearchParams("country=BR"));
    expect(reparsed.country).toBe<Country>("BR");
    expect(buildDirectoryUrl(reparsed)).toBe("?country=BR");
  });
});

describe("filterStartups", () => {
  const bogotaFintech = makeStartup({
    id: "1",
    name: "Bogota Fintech",
    description: "Payments rails",
    city: "Bogotá",
    country: "CO",
    industry: "fintech",
    stage: "seed",
    jobs: [makeJob({ modality: "remote" })],
  });
  const medellinEdtech = makeStartup({
    id: "2",
    name: "Medellin Edtech",
    description: "Classroom platform",
    city: "Medellín",
    country: "CO",
    industry: "edtech",
    stage: "series-a",
    jobs: [makeJob({ modality: "onsite" })],
  });
  const saoPaulo = makeStartup({
    id: "3",
    name: "Sao Paulo Saas",
    description: "B2B SaaS",
    city: "São Paulo",
    country: "BR",
    industry: "saas",
    stage: "bootstrapped",
    jobs: [makeJob({ modality: "hybrid" })],
  });
  const noJobs = makeStartup({
    id: "4",
    name: "No Jobs Yet",
    description: "Pre-hire startup",
    city: "Bogotá",
    country: "CO",
    industry: "fintech",
    jobs: [],
  });

  const rows: Startup[] = [bogotaFintech, medellinEdtech, saoPaulo, noJobs];

  it("returns every row when the filter is the default", () => {
    expect(filterStartups(rows, DEFAULT_FILTER)).toHaveLength(rows.length);
  });

  it("filters by country", () => {
    const result = filterStartups(rows, { ...DEFAULT_FILTER, country: "CO" });
    expect(result.map((r) => r.id)).toEqual(["1", "2", "4"]);
  });

  it("filters by a single industry", () => {
    const result = filterStartups(rows, {
      ...DEFAULT_FILTER,
      industry: ["fintech"],
    });
    expect(result.map((r) => r.id)).toEqual(["1", "4"]);
  });

  it("filters by multiple industries (union semantics)", () => {
    const result = filterStartups(rows, {
      ...DEFAULT_FILTER,
      industry: ["edtech", "saas"],
    });
    expect(result.map((r) => r.id)).toEqual(["2", "3"]);
  });

  it("filters by stage", () => {
    const result = filterStartups(rows, { ...DEFAULT_FILTER, stage: "series-a" });
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });

  it("filters by modality through `Startup.jobs` (not the startup)", () => {
    // Bogota Fintech has a remote job → matches `remote`.
    // Medellin Edtech has an onsite job → does not match `remote`.
    // No Jobs Yet has no jobs at all → does not match any modality.
    const remoteOnly = filterStartups(rows, {
      ...DEFAULT_FILTER,
      modality: "remote" as Modality,
    });
    expect(remoteOnly.map((r) => r.id)).toEqual(["1"]);

    const onsiteOnly = filterStartups(rows, {
      ...DEFAULT_FILTER,
      modality: "onsite" as Modality,
    });
    expect(onsiteOnly.map((r) => r.id)).toEqual(["2"]);

    const hybridOnly = filterStartups(rows, {
      ...DEFAULT_FILTER,
      modality: "hybrid" as Modality,
    });
    expect(hybridOnly.map((r) => r.id)).toEqual(["3"]);
  });

  it("filters by city (requires the country filter too)", () => {
    const result = filterStartups(rows, {
      ...DEFAULT_FILTER,
      country: "CO",
      city: "Medellín",
    });
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });

  it("performs a case-insensitive substring search across name / description / city / industry", () => {
    const byName = filterStartups(rows, { ...DEFAULT_FILTER, q: "Bogota" });
    expect(byName.map((r) => r.id)).toEqual(["1"]);

    const byDesc = filterStartups(rows, { ...DEFAULT_FILTER, q: "classroom" });
    expect(byDesc.map((r) => r.id)).toEqual(["2"]);

    const byIndustry = filterStartups(rows, {
      ...DEFAULT_FILTER,
      q: "FINTECH",
    });
    expect(byIndustry.map((r) => r.id)).toEqual(["1", "4"]);
  });

  it("combines every filter with AND semantics", () => {
    const result = filterStartups(rows, {
      ...DEFAULT_FILTER,
      country: "CO",
      industry: ["fintech"],
      stage: "seed" as Stage,
      modality: "remote" as Modality,
      city: "Bogotá",
      q: "Bogota",
    });
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("returns an empty array when no rows match", () => {
    const result = filterStartups(rows, { ...DEFAULT_FILTER, country: "CO", industry: ["agtech"] });
    expect(result).toEqual([]);
  });
});

describe("pagination (DIRECTORY_PAGE_SIZE = 8)", () => {
  // Build 20 rows: 20 / 8 = 3 pages (8 + 8 + 4).
  const twenty = Array.from({ length: 20 }, (_, i) =>
    makeStartup({ id: `s-${i}`, name: `Startup ${i}` })
  );

  it("exposes DIRECTORY_PAGE_SIZE = 8 (locked design value)", () => {
    expect(DIRECTORY_PAGE_SIZE).toBe(8);
  });

  it("totalPages(20) === 3 and totalPages(0) === 0", () => {
    expect(totalPages(twenty)).toBe(3);
    expect(totalPages([])).toBe(0);
  });

  it("paginateStartups(page=1) returns the first 8 rows", () => {
    const page = paginateStartups(twenty, 1);
    expect(page).toHaveLength(8);
    expect(page[0]?.id).toBe("s-0");
    expect(page[7]?.id).toBe("s-7");
  });

  it("paginateStartups(page=2) returns the next 8 rows", () => {
    const page = paginateStartups(twenty, 2);
    expect(page).toHaveLength(8);
    expect(page[0]?.id).toBe("s-8");
    expect(page[7]?.id).toBe("s-15");
  });

  it("paginateStartups(page=3) returns the trailing 4 rows", () => {
    const page = paginateStartups(twenty, 3);
    expect(page).toHaveLength(4);
    expect(page[0]?.id).toBe("s-16");
    expect(page[3]?.id).toBe("s-19");
  });

  it("paginateStartups returns [] for pages past the end", () => {
    expect(paginateStartups(twenty, 4)).toEqual([]);
    expect(paginateStartups(twenty, 99)).toEqual([]);
  });

  it("clampPage(2, 3) === 2; clampPage(99, 3) === 3; clampPage(0, 3) === 1", () => {
    expect(clampPage(2, 3)).toBe(2);
    expect(clampPage(99, 3)).toBe(3);
    expect(clampPage(0, 3)).toBe(1);
    expect(clampPage(-5, 3)).toBe(1);
  });

  it("clampPage returns 1 when max is 0 (no rows)", () => {
    expect(clampPage(2, 0)).toBe(1);
    expect(clampPage(0, 0)).toBe(1);
  });
});
