/**
 * Domain types and enums for the COL/LABS data model.
 * Mirrors supabase/migrations/00001..00003 and docs/DATA_MODEL.md.
 */

export type Country = "CO" | "BR" | "CL" | "AR" | "MX";

export type Stage =
  | "pre-seed"
  | "seed"
  | "series-a"
  | "series-b+"
  | "bootstrapped";

export type Modality = "remote" | "hybrid" | "onsite";

export type StartupStatus = "pending" | "approved" | "rejected";

export type JobStatus = "active" | "closed";

export interface Industry {
  slug: string;
  label: string;
  icon: string | null;
}

export interface Startup {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string | null;
  logoUrl: string | null;
  website: string | null;
  linkedinUrl: string | null;
  country: Country;
  city: string | null;
  industry: string; // industry slug
  stage: Stage | null;
  foundedYear: number | null;
  employeeRange: string | null;
  investors: string[];
  status: StartupStatus;
  submittedBy: string | null;
  createdAt: string;
  updatedAt: string;
  jobs: Job[];
}

export interface Job {
  id: string;
  startupId: string;
  title: string;
  area: string | null;
  location: string | null;
  modality: Modality;
  salaryRange: string | null;
  applyUrl: string;
}

/**
 * A job vacancy enriched with the minimal startup metadata needed to
 * render a job row in the /jobs directory without a second round-trip.
 * Produced by `getActiveJobs()` in `lib/queries.ts`.
 */
export interface JobWithStartup extends Job {
  startupName: string;
  startupSlug: string;
  startupLogoUrl: string | null;
  startupCountry: Country;
  startupCity: string | null;
}
