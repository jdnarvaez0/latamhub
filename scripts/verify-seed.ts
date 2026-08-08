/**
 * Smoke test for the COL/LABS seed data.
 *
 * Asserts that, after running `supabase db seed`:
 *   - At least 20 startups with status='approved' are visible to the anon client.
 *   - Zero startups with status='pending' are visible to the anon client
 *     (RLS should hide them).
 *
 * Run with:  bun run scripts/verify-seed.ts
 * Requires:  NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 *            in the environment (sourced from .env.local if present).
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copy .env.example to .env.local and fill in the values."
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  // No local storage in a Node script; this avoids the auth layer mangling
  // the apikey header and getting "Invalid API key" back from PostgREST.
  auth: { persistSession: false },
});

async function countStartups(status: "approved" | "pending"): Promise<number> {
  const { count, error } = await supabase
    .from("startups")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  if (error) {
    throw new Error(`Query for status=${status} failed: ${error.message}`);
  }
  return count ?? 0;
}

async function main(): Promise<void> {
  const approved = await countStartups("approved");
  const pending = await countStartups("pending");

  console.log(`Approved startups (anon-visible): ${approved}`);
  console.log(`Pending  startups (anon-visible): ${pending}`);

  const failures: string[] = [];
  if (approved < 20) {
    failures.push(`expected >=20 approved, got ${approved}`);
  }
  if (pending !== 0) {
    failures.push(
      `expected 0 pending (RLS should hide them), got ${pending}`
    );
  }

  if (failures.length > 0) {
    console.error("FAIL");
    for (const message of failures) {
      console.error(`  - ${message}`);
    }
    process.exit(1);
  }

  console.log("PASS");
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
