/**
 * Public startup detail page at `/startups/[slug]`.
 *
 * Spec: `startup-detail`. Design §15 (Next 16 async `params`).
 *
 * Async Server Component. `await params` reads the route slug; the
 * single server round-trip is `getStartupBySlug(slug)`, which already
 * collapses "unknown" and "unapproved" to the same `null` return so we
 * never leak whether a row exists (design §7 / risk "Unapproved slug
 * leaks data"). `null` triggers `notFound()`, which renders the
 * route-local `not-found.tsx` with `robots: noindex`.
 *
 * `generateMetadata` exports the full SEO block for approved startups
 * (title, description, canonical `/startups/[slug]` resolved against
 * the root layout's `metadataBase`, OpenGraph `article` with logo
 * image when available) and a safe noindex fallback for the not-found
 * path. Next.js's auto-injected `<meta name="robots" content="noindex">`
 * for 404 renders is intentionally redundant with the explicit
 * `robots` block so the metadata merge contract stays predictable
 * when the layout adds its own `robots` later.
 *
 * Canonical and `openGraph.url` use **relative paths** (Unit 6 audit).
 * The root layout declares `metadataBase = https://latamhub.com` so
 * Next.js resolves `/startups/${slug}` → `https://latamhub.com/startups/${slug}`
 * at metadata-emit time. This keeps the site origin in a single file
 * (the layout) and removes the duplicated constant + helper that
 * previously lived here.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Monogram } from "@/components/monogram";
import {
  COUNTRY_LABELS,
  INDUSTRY_LABELS,
  MODALITY_LABELS,
  STAGE_LABELS,
} from "@/lib/constants";
import { getStartupBySlug } from "@/lib/queries";
import type { Startup } from "@/lib/types";

const NOT_PROVIDED = "No proporcionado";

/** 1–2 char monogram letter from a startup name; never throws. */
function monogramLetter(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "·";
  return trimmed.slice(0, 2).toUpperCase();
}

/** Relative canonical path for a startup detail page. */
function canonicalPath(slug: string): string {
  return `/startups/${slug}`;
}

/** `${name} — ${industry} · Col/Labs` page title. */
function detailTitle(startup: Startup): string {
  const industry = INDUSTRY_LABELS[startup.industry] ?? startup.industry;
  return `${startup.name} — ${industry} · Col/Labs`;
}

/**
 * Description for `<meta name="description">` and `openGraph.description`.
 * Prefers `longDescription` when the curation team wrote one; otherwise
 * falls back to the one-liner. Collapses whitespace and length-caps so
 * a runaway string never overflows the page head.
 */
function descriptionFor(startup: Startup): string {
  const source = startup.longDescription?.trim() || startup.description;
  return source.replace(/\s+/g, " ").slice(0, 200);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const startup = await getStartupBySlug(slug);

  if (!startup) {
    return {
      title: "Startup no encontrada — Col/Labs",
      description:
        "La startup que buscas no existe, fue removida o aún no está aprobada en el directorio.",
      robots: { index: false, follow: false },
    };
  }

  const title = detailTitle(startup);
  const description = descriptionFor(startup);
  // Relative path — resolved against the root layout's `metadataBase`
  // (`https://latamhub.com`) by Next.js at metadata-emit time. See the
  // file docblock for the Unit 6 audit rationale.
  const canonical = canonicalPath(startup.slug);

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Col/Labs",
      locale: "es_CO",
      type: "article",
      // `"article"` requires an image; emit only when the curation team
      // has set one so we never emit a broken `<meta>` tag. `logoUrl`
      // is treated as already-absolute (the curation team uploads it
      // to the public asset bucket), so we DO NOT resolve it through
      // `metadataBase` — `openGraph.images` requires an absolute URL,
      // and the value stored on the row already satisfies that.
      ...(startup.logoUrl
        ? {
            images: [
              { url: startup.logoUrl, alt: `${startup.name} logo` },
            ],
          }
        : {}),
    },
    twitter: {
      card: startup.logoUrl ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

export default async function StartupDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const startup = await getStartupBySlug(slug);

  if (!startup) {
    notFound();
  }

  // Resolve all display strings up-front so the JSX stays readable.
  const industryLabel =
    INDUSTRY_LABELS[startup.industry] ?? startup.industry;
  const countryLabel = COUNTRY_LABELS[startup.country] ?? startup.country;
  const cityLabel = startup.city ?? NOT_PROVIDED;
  const stageLabel = startup.stage
    ? STAGE_LABELS[startup.stage] ?? startup.stage
    : NOT_PROVIDED;
  const foundedYearLabel = startup.foundedYear
    ? String(startup.foundedYear)
    : NOT_PROVIDED;
  const employeeRangeLabel = startup.employeeRange ?? NOT_PROVIDED;
  const longDescription = startup.longDescription?.trim()
    ? startup.longDescription
    : startup.description;

  return (
    <main className="flex-1 px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          ← Volver al directorio
        </Link>

        <header className="border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <Monogram
              letter={monogramLetter(startup.name)}
              logoUrl={startup.logoUrl}
              website={startup.website}
              alt={`${startup.name} logo`}
              size="lg"
            />

            <div className="min-w-0 flex-1">
              <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                {startup.name}
              </h1>
              <p className="text-muted-foreground mt-3 max-w-2xl text-lg">
                {startup.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="tag">{industryLabel}</span>
                <span className="tag">{stageLabel}</span>
                <span className="tag">
                  {cityLabel}, {countryLabel}
                </span>
                {startup.jobs.length > 0 ? (
                  <span className="tag tag-primary">
                    {startup.jobs.length === 1
                      ? "1 vacante"
                      : `${startup.jobs.length} vacantes`}
                  </span>
                ) : null}
              </div>
            </div>

            {startup.website ? (
              <a
                href={startup.website}
                target="_blank"
                rel="noopener noreferrer"
                className="press shrink-0 bg-foreground px-5 py-3 text-sm font-medium text-background hover:bg-primary"
              >
                Visitar sitio
              </a>
            ) : null}
          </div>
        </header>

        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="flex-1 space-y-12">
            <section>
              <h2 className="data-label mb-4 block">Sobre la empresa</h2>
              <p className="max-w-2xl leading-relaxed whitespace-pre-line">
                {longDescription}
              </p>
            </section>

            <section>
              <h2 className="data-label mb-4 block">
                Vacantes abiertas ({startup.jobs.length})
              </h2>
              {startup.jobs.length === 0 ? (
                <p className="border border-border bg-surface p-6 text-sm text-muted-foreground">
                  Esta startup no tiene vacantes publicadas por ahora.
                </p>
              ) : (
                <ul className="space-y-3">
                  {startup.jobs.map((job) => {
                    const modalityLabel =
                      MODALITY_LABELS[job.modality] ?? job.modality;
                    return (
                      <li key={job.id} className="list-none">
                        <div className="flex animate-flip-in flex-col justify-between gap-3 border border-border bg-surface p-5 row-hover hover:border-primary sm:flex-row sm:items-center">
                          <div className="min-w-0">
                            <p className="font-display font-bold">
                              {job.title}
                            </p>
                            <p className="text-muted-foreground mt-1 font-mono text-[11px] uppercase tracking-tight">
                              {[job.area, modalityLabel, job.location]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            {job.salaryRange ? (
                              <span className="font-mono text-xs text-primary">
                                {job.salaryRange}
                              </span>
                            ) : null}
                            <a
                              href={job.applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="press shrink-0 border border-foreground px-4 py-2 font-mono text-[11px] uppercase tracking-widest hover:bg-foreground hover:text-background"
                              aria-label={`Postularme a ${job.title} en ${startup.name}`}
                            >
                              Postularme →
                            </a>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <aside className="w-full shrink-0 lg:w-72">
            <div className="space-y-5 border border-border bg-surface p-6">
              <FactRow label="Fundada" value={foundedYearLabel} />
              <FactRow label="Equipo" value={employeeRangeLabel} />
              <FactRow label="Etapa" value={stageLabel} />
              <FactRow label="Sede" value={`${cityLabel}, ${countryLabel}`} />

              {startup.linkedinUrl ? (
                <div>
                  <span className="data-label">LinkedIn</span>
                  <a
                    href={startup.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary mt-2 block text-sm font-medium break-all hover:underline"
                  >
                    Ver perfil
                  </a>
                </div>
              ) : null}

              <div>
                <span className="data-label">Inversionistas</span>
                {startup.investors.length === 0 ? (
                  <p className="text-muted-foreground mt-2 text-sm">
                    {NOT_PROVIDED}
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {startup.investors.map((investor) => (
                      <span key={investor} className="tag">
                        {investor}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

/**
 * "Label / value" row used in the detail sidebar. Keeps the sidebar's
 * vertical rhythm consistent across the four always-present facts.
 */
function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3">
      <span className="data-label">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
