/**
 * Next.js middleware entrypoint. Runs on every matched request to keep the
 * Supabase auth session fresh.
 *
 * NOTE: Next.js 16 deprecates `middleware` in favor of `proxy`. The file name
 * and export name here follow the Supabase SSR convention; the file works
 * but will eventually be renamed to `proxy.ts` with a `proxy` export.
 */
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Skip Next.js internals and static assets to keep the middleware cheap.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
