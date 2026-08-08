/**
 * Browser-side Supabase singleton for use in Client Components.
 *
 * The client is created lazily so that module-level code never runs on the
 * server during build (env vars are inlined for the browser, but reading
 * process.env at import time can warn during type checking).
 */
import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
