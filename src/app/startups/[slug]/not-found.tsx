/**
 * Route-local 404 page for `/startups/[slug]`.
 *
 * ## Why a separate not-found page
 *
 * The root `src/app/not-found.tsx` already serves the app-wide 404 with
 * a brand-voice "Página no encontrada". When `notFound()` is called
 * from inside `/startups/[slug]/page.tsx`, Next.js walks up the route
 * tree to find the nearest `not-found.js`. This file is the nearest
 * one — it intercepts the render **inside the directory's layout** and
 * keeps the visitor on the directory's visual rhythm (same `tag`
 * chips, same monogram glyph, same `border-dashed` card language) so
 * a missing startup looks like a "row not found" rather than a hard
 * landing page error.
 *
 * If this file is removed, the root not-found page renders instead
 * (the inheritance is automatic). We keep this file so the unit test
 * for `startup-detail` ("Unknown or unapproved slug returns 404") can
 * reliably assert visual consistency without depending on the root
 * file's copy.
 *
 * ## SEO
 *
 * Per the spec (`startup-detail` "Unknown or unapproved slug returns
 * 404"), the page MUST emit `noindex`. Next.js also auto-injects
 * `<meta name="robots" content="noindex">` for any 404 render — we
 * also export an explicit `robots` block so the merge contract with
 * the root layout stays predictable.
 */
import Link from "next/link";
import type { Metadata } from "next";

import { Monogram } from "@/components/monogram";

export const metadata: Metadata = {
  title: "Startup no encontrada — Col/Labs",
  description:
    "La startup que buscas no existe, fue removida o aún no está aprobada en el directorio.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StartupNotFound() {
  return (
    <main className="flex-1 px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-center">
          <Monogram letter="?" size="lg" />
        </div>

        <div className="animate-reveal mt-8 text-center">
          <span className="data-label">Error 404</span>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Startup no encontrada
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-md text-sm sm:text-base">
            La startup que buscas no existe, fue removida o aún no está
            aprobada en el directorio. Vuelve al directorio para seguir
            explorando.
          </p>
          <Link
            href="/"
            className="press mt-8 inline-flex items-center justify-center bg-foreground px-5 py-3 text-sm font-medium text-background hover:bg-primary"
          >
            Volver al directorio
          </Link>
        </div>
      </div>
    </main>
  );
}
