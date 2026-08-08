import Link from "next/link";

/**
 * Static footer. Server component, fully static for Phase 0.
 */
export function SiteFooter() {
  return (
    <footer className="bg-surface mt-24 border-t border-border py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="col-span-1 space-y-4 md:col-span-2">
            <span className="font-display text-2xl font-bold uppercase tracking-tight">
              Col/Labs
            </span>
            <p className="text-muted-foreground max-w-sm text-sm">
              El directorio del ecosistema emprendedor latinoamericano. Empresas
              reales, vacantes abiertas y datos actualizados del sector.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="data-label">Plataforma</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-primary">
                  Directorio
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="hover:text-primary">
                  Bolsa de empleo
                </Link>
              </li>
              <li>
                <Link href="/submit" className="hover:text-primary">
                  Publicar perfil
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="data-label">Ecosistema</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/ecosystem" className="hover:text-primary">
                  Panorama 2026
                </Link>
              </li>
              <li>
                <Link href="/ecosystem" className="hover:text-primary">
                  Fondos de inversión
                </Link>
              </li>
              <li>
                <Link href="/ecosystem" className="hover:text-primary">
                  Aceleradoras
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
            © 2026 Col/Labs — hecho en LatAm, empezando por Colombia
          </p>
          <div className="text-muted-foreground flex gap-6 font-mono text-[10px] uppercase tracking-widest">
            <a
              href="https://github.com/jdnarvaez0/latamhub"
              className="hover:text-foreground"
            >
              GitHub
            </a>
            <a href="#" className="hover:text-foreground">
              Twitter
            </a>
            <a href="#" className="hover:text-foreground">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
