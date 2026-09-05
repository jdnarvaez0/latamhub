import type { Metadata } from "next";
import { SubmitStartupForm } from "@/components/submit/submit-startup-form";

export const metadata: Metadata = {
  title: "Publicar startup — Col/Labs",
  description:
    "Publicá tu startup en el directorio de Col/Labs. Es gratis y llega a miles de personas del ecosistema startup latinoamericano.",
};

export default function SubmitPage() {
  return (
    <main className="flex-1 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-8 animate-reveal">
        {/* Header */}
        <div className="space-y-2">
          <p className="data-label">Col/Labs · Envío</p>
          <h1 className="font-display text-3xl font-bold">Publicá tu startup</h1>
          <p className="text-muted-foreground">
            Completá el formulario y el equipo de Col/Labs revisará tu startup.
            Una vez aprobada, aparecerá en el directorio público.
          </p>
        </div>

        {/* Form card */}
        <div className="border border-border bg-surface p-6 sm:p-8">
          <SubmitStartupForm />
        </div>
      </div>
    </main>
  );
}
