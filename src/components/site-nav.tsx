import Link from "next/link";

/**
 * Top navigation bar.
 *
 * Public navigation bar with direct link to submit startup.
 */
export function SiteNav() {
  return (
    <nav className="bg-background/80 sticky top-0 z-50 border-b border-border backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-display text-xl font-bold uppercase tracking-tight transition-colors hover:text-primary"
          >
            Col/Labs
          </Link>
          <div className="text-muted-foreground hidden gap-6 text-sm font-medium md:flex">
            <Link
              href="/"
              className="nav-underline transition-colors hover:text-foreground"
            >
              Directorio
            </Link>
            <Link
              href="/jobs"
              className="nav-underline transition-colors hover:text-foreground"
            >
              Empleos
            </Link>
            <Link
              href="/ecosystem"
              className="nav-underline transition-colors hover:text-foreground"
            >
              Ecosistema
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden bg-primary/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary sm:inline-block">
            LatAm · 5 países
          </span>

          <Link
            href="/submit"
            className="press bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-primary"
          >
            Publicar startup
          </Link>
        </div>
      </div>
    </nav>
  );
}
