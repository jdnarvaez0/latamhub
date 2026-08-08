/**
 * Root home page. Phase 0 placeholder — no filters, no data fetching yet.
 * The real directory grid lands in Phase 1.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="animate-reveal max-w-2xl text-center">
        <span className="data-label">Próximamente</span>
        <h1 className="font-display mt-3 text-5xl font-bold tracking-tight sm:text-6xl">
          El directorio de startups
          <br />
          de Latinoamérica
        </h1>
        <p className="text-muted-foreground mt-6 text-base sm:text-lg">
          Estamos cargando las primeras 20 empresas del ecosistema colombiano:
          nombres, industrias, etapas y vacantes abiertas. Vuelve pronto para
          explorar el directorio.
        </p>
      </div>
    </main>
  );
}
