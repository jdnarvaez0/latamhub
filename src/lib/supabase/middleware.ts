/**
 * Middleware helper: refreshes the Supabase auth session on every request.
 *
 * Reads the incoming cookies from the request, lets the Supabase client refresh
 * the access token if needed, and writes the refreshed cookies back to the
 * response (also propagating any custom headers returned by Supabase so CDNs
 * don't cache the auth-bearing response).
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          // Supabase returns headers it wants on the response (e.g. to disable
          // CDN caching of the auth cookies). Forward them to NextResponse.
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    }
  );

  // Touch the session so the client refreshes the token if it is about to
  // expire. The result is unused; we just need the side effect on cookies.
  await supabase.auth.getSession();

  return response;
}
