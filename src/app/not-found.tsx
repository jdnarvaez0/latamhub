import Link from "next/link";

/**
 * Custom 404 page. Renders inside the root layout, so it inherits fonts and
 * the design system tokens.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="animate-reveal max-w-md text-center">
        <span className="data-label">Error 404</span>
        <h1 className="font-display mt-3 text-6xl font-bold tracking-tight">
          Página no encontrada
        </h1>
        <p className="text-muted-foreground mt-4 text-sm">
          La ruta que buscas no existe o se movió. Vuelve al directorio para
          seguir explorando.
        </p>
        <Link
          href="/"
          className="press mt-8 inline-flex items-center justify-center bg-foreground px-5 py-3 text-sm font-medium text-background hover:bg-primary"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
