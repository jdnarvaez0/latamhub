/**
 * Server-side Supabase client for use in React Server Components, Server Actions,
 * and Route Handlers.
 *
 * In Next.js 16, `cookies()` is fully async and `set()` may only be called from
 * a Server Action or Route Handler — never from a Server Component. So this
 * client only declares `getAll`; cookie refresh is handled by the middleware
 * (see `src/lib/supabase/middleware.ts`).
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // No setAll: cookies can only be written from Server Functions /
        // Route Handlers. The middleware updates the auth session on every
        // request, which keeps the user signed in across navigations.
      },
    }
  );
}
