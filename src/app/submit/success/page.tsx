import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Startup enviada — Col/Labs",
  description: "Tu startup fue enviada para revisión en Col/Labs.",
  robots: { index: false },
};

export default function SubmitSuccessPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm space-y-6 text-center animate-reveal">
        <div className="text-5xl animate-flip-in">🚀</div>

        <div className="space-y-2">
          <p className="data-label">Col/Labs · Enviado</p>
          <h1 className="font-display text-2xl font-bold">
            ¡Startup enviada!
          </h1>
          <p className="text-muted-foreground text-sm">
            Tu startup quedó en revisión. El equipo de Col/Labs la revisará en los próximos días.
            Te avisaremos cuando esté aprobada.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="press block bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:bg-primary"
          >
            Ver el directorio
          </Link>
          <Link
            href="/submit"
            className="press block border border-border px-6 py-2.5 text-sm font-medium hover:border-primary hover:text-primary"
          >
            Publicar otra startup
          </Link>
        </div>
      </div>
    </main>
  );
}
