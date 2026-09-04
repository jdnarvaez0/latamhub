/**
 * Tests for `src/lib/jobs-filtering.ts` — URL parsing / building and the
 * pure jobs predicate.
 *
 * Scope:
 *   - `parseJobsUrl` and `buildJobsUrl` round-trip the URL contract.
 *   - Unknown enum values are dropped by `parseJobsUrl`.
 *   - `DEFAULT_JOBS_FILTER` is the identity parse of an empty URL.
 *   - `filterJobs` honours every filter (country, modality, free text).
 *   - Free-text matches title, startupName, area, location, startupCity.
 *   - No filters → all jobs returned.
 *   - All tests are hermetic: no network, no Supabase, no side-effects.
 */
import { describe, expect, it } from "vitest";

import {
  buildJobsUrl,
  DEFAULT_JOBS_FILTER,
  filterJobs,
  parseJobsUrl,
  type JobsFilter,
} from "@/lib/jobs-filtering";
import type { JobWithStartup } from "@/lib/types";

// ---------------------------------------------------------------------------
// Fixture factory.
// ---------------------------------------------------------------------------

function makeJob(overrides: Partial<JobWithStartup> = {}): JobWithStartup {
  return {
    id: "job-1",
    startupId: "startup-1",
    title: "Software Engineer",
    area: "engineering",
    location: "Bogotá",
    modality: "onsite",
    salaryRange: "COP 8M - 12M",
    applyUrl: "https://example.com/apply",
    startupName: "Acme",
    startupSlug: "acme",
    startupLogoUrl: null,
    startupCountry: "CO",
    startupCity: "Bogotá",
    ...overrides,
  };
}

function sp(params: Record<string, string>): URLSearchParams {
  return new URLSearchParams(params);
}

// ---------------------------------------------------------------------------
// parseJobsUrl — defaults.
// ---------------------------------------------------------------------------

describe("parseJobsUrl — defaults", () => {
  it("returns DEFAULT_JOBS_FILTER for empty params", () => {
    expect(parseJobsUrl(sp({}))).toEqual(DEFAULT_JOBS_FILTER);
  });

  it("trims whitespace from q", () => {
    expect(parseJobsUrl(sp({ q: "  frontend  " })).q).toBe("frontend");
  });

  it("sets q to empty string when param is absent", () => {
    expect(parseJobsUrl(sp({})).q).toBe("");
  });
});

// ---------------------------------------------------------------------------
// parseJobsUrl — country.
// ---------------------------------------------------------------------------

describe("parseJobsUrl — country", () => {
  it("accepts valid country codes", () => {
    for (const code of ["CO", "BR", "CL", "AR", "MX"]) {
      expect(parseJobsUrl(sp({ country: code })).country).toBe(code);
    }
  });

  it("drops unknown country codes", () => {
    expect(parseJobsUrl(sp({ country: "US" })).country).toBeNull();
    expect(parseJobsUrl(sp({ country: "xx" })).country).toBeNull();
  });

  it("returns null when country param absent", () => {
    expect(parseJobsUrl(sp({})).country).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseJobsUrl — modality.
// ---------------------------------------------------------------------------

describe("parseJobsUrl — modality", () => {
  it("accepts valid modality values", () => {
    for (const mod of ["remote", "hybrid", "onsite"]) {
      expect(parseJobsUrl(sp({ modality: mod })).modality).toBe(mod);
    }
  });

  it("drops unknown modality values", () => {
    expect(parseJobsUrl(sp({ modality: "freelance" })).modality).toBeNull();
    expect(parseJobsUrl(sp({ modality: "" })).modality).toBeNull();
  });

  it("returns null when modality absent", () => {
    expect(parseJobsUrl(sp({})).modality).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// buildJobsUrl — serialization.
// ---------------------------------------------------------------------------

describe("buildJobsUrl — serialization", () => {
  it("returns empty string for default filter with no pathname", () => {
    expect(buildJobsUrl(DEFAULT_JOBS_FILTER)).toBe("");
  });

  it("returns pathname only when all filters are default", () => {
    expect(buildJobsUrl(DEFAULT_JOBS_FILTER, "/jobs")).toBe("/jobs");
  });

  it("encodes q", () => {
    const filter: JobsFilter = { ...DEFAULT_JOBS_FILTER, q: "product" };
    expect(buildJobsUrl(filter)).toContain("q=product");
  });

  it("encodes country", () => {
    const filter: JobsFilter = { ...DEFAULT_JOBS_FILTER, country: "BR" };
    expect(buildJobsUrl(filter)).toContain("country=BR");
  });

  it("encodes modality", () => {
    const filter: JobsFilter = { ...DEFAULT_JOBS_FILTER, modality: "remote" };
    expect(buildJobsUrl(filter)).toContain("modality=remote");
  });

  it("omits null fields", () => {
    const filter: JobsFilter = { q: "", country: null, modality: null };
    expect(buildJobsUrl(filter)).toBe("");
  });

  it("prepends pathname correctly", () => {
    const filter: JobsFilter = { ...DEFAULT_JOBS_FILTER, modality: "hybrid" };
    expect(buildJobsUrl(filter, "/jobs")).toBe("/jobs?modality=hybrid");
  });
});

// ---------------------------------------------------------------------------
// buildJobsUrl / parseJobsUrl round-trip.
// ---------------------------------------------------------------------------

describe("round-trip", () => {
  it("survives a full filter → url → parse cycle", () => {
    const original: JobsFilter = { q: "data", country: "CO", modality: "remote" };
    const url = buildJobsUrl(original);
    const parsed = parseJobsUrl(new URLSearchParams(url.replace(/^\?/, "")));
    expect(parsed).toEqual(original);
  });

  it("produces canonical first-page URL (no page param)", () => {
    // Jobs page has no pagination in Phase 2; verify buildJobsUrl never
    // adds a page param even if called with extra fields.
    const url = buildJobsUrl(DEFAULT_JOBS_FILTER, "/jobs");
    expect(url).not.toContain("page");
  });
});

// ---------------------------------------------------------------------------
// filterJobs — no filters.
// ---------------------------------------------------------------------------

describe("filterJobs — no filters", () => {
  it("returns all jobs when filter is default", () => {
    const jobs = [makeJob(), makeJob({ id: "job-2" })];
    expect(filterJobs(jobs, DEFAULT_JOBS_FILTER)).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(filterJobs([], DEFAULT_JOBS_FILTER)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// filterJobs — country.
// ---------------------------------------------------------------------------

describe("filterJobs — country", () => {
  it("keeps only jobs from the selected country", () => {
    const jobs = [
      makeJob({ id: "j1", startupCountry: "CO" }),
      makeJob({ id: "j2", startupCountry: "BR" }),
      makeJob({ id: "j3", startupCountry: "CO" }),
    ];
    const result = filterJobs(jobs, { ...DEFAULT_JOBS_FILTER, country: "CO" });
    expect(result).toHaveLength(2);
    expect(result.every((j) => j.startupCountry === "CO")).toBe(true);
  });

  it("null country keeps all", () => {
    const jobs = [
      makeJob({ startupCountry: "CO" }),
      makeJob({ startupCountry: "MX" }),
    ];
    expect(filterJobs(jobs, DEFAULT_JOBS_FILTER)).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// filterJobs — modality.
// ---------------------------------------------------------------------------

describe("filterJobs — modality", () => {
  it("keeps only remote jobs", () => {
    const jobs = [
      makeJob({ id: "j1", modality: "remote" }),
      makeJob({ id: "j2", modality: "onsite" }),
      makeJob({ id: "j3", modality: "remote" }),
    ];
    const result = filterJobs(jobs, { ...DEFAULT_JOBS_FILTER, modality: "remote" });
    expect(result).toHaveLength(2);
    expect(result.every((j) => j.modality === "remote")).toBe(true);
  });

  it("null modality keeps all", () => {
    const jobs = [
      makeJob({ modality: "remote" }),
      makeJob({ modality: "hybrid" }),
      makeJob({ modality: "onsite" }),
    ];
    expect(filterJobs(jobs, DEFAULT_JOBS_FILTER)).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// filterJobs — free-text search.
// ---------------------------------------------------------------------------

describe("filterJobs — free-text", () => {
  it("matches on job title (case-insensitive)", () => {
    const jobs = [
      makeJob({ id: "j1", title: "Frontend Engineer" }),
      makeJob({ id: "j2", title: "Data Analyst" }),
    ];
    const result = filterJobs(jobs, { ...DEFAULT_JOBS_FILTER, q: "frontend" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("j1");
  });

  it("matches on startupName", () => {
    const jobs = [
      makeJob({ id: "j1", startupName: "Nuvocargo" }),
      makeJob({ id: "j2", startupName: "Rappi" }),
    ];
    const result = filterJobs(jobs, { ...DEFAULT_JOBS_FILTER, q: "nuvo" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("j1");
  });

  it("matches on area", () => {
    const jobs = [
      makeJob({ id: "j1", area: "product" }),
      makeJob({ id: "j2", area: "engineering" }),
    ];
    expect(filterJobs(jobs, { ...DEFAULT_JOBS_FILTER, q: "product" })).toHaveLength(1);
  });

  it("matches on location", () => {
    const jobs = [
      makeJob({ id: "j1", location: "Medellín" }),
      makeJob({ id: "j2", location: "Bogotá" }),
    ];
    expect(filterJobs(jobs, { ...DEFAULT_JOBS_FILTER, q: "medellin" })).toHaveLength(0);
    // Exact accent match.
    expect(filterJobs(jobs, { ...DEFAULT_JOBS_FILTER, q: "medellín" })).toHaveLength(1);
  });

  it("matches on startupCity", () => {
    const jobs = [
      makeJob({ id: "j1", startupCity: "Cali" }),
      makeJob({ id: "j2", startupCity: "Bogotá" }),
    ];
    const result = filterJobs(jobs, { ...DEFAULT_JOBS_FILTER, q: "cali" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("j1");
  });

  it("returns empty when q does not match anything", () => {
    const jobs = [makeJob({ title: "Backend Engineer" })];
    expect(filterJobs(jobs, { ...DEFAULT_JOBS_FILTER, q: "zzznomatch" })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// filterJobs — combined filters.
// ---------------------------------------------------------------------------

describe("filterJobs — combined filters", () => {
  it("applies country + modality together", () => {
    const jobs = [
      makeJob({ id: "j1", startupCountry: "CO", modality: "remote" }),
      makeJob({ id: "j2", startupCountry: "CO", modality: "onsite" }),
      makeJob({ id: "j3", startupCountry: "BR", modality: "remote" }),
    ];
    const result = filterJobs(jobs, {
      q: "",
      country: "CO",
      modality: "remote",
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("j1");
  });

  it("applies q + country together", () => {
    const jobs = [
      makeJob({ id: "j1", startupCountry: "CO", title: "Frontend Engineer" }),
      makeJob({ id: "j2", startupCountry: "MX", title: "Frontend Engineer" }),
      makeJob({ id: "j3", startupCountry: "CO", title: "Data Analyst" }),
    ];
    const result = filterJobs(jobs, {
      q: "frontend",
      country: "CO",
      modality: null,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("j1");
  });
});
