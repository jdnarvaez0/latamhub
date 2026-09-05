"use client";

/**
 * Submit startup form — client island.
 *
 * Uses React's useActionState to wire the Server Action and display
 * field-level errors returned from the action without a full page reload.
 */
import { useActionState } from "react";
import { submitStartup, type SubmitStartupResult } from "@/app/submit/actions";
import { COUNTRY_LABELS, STAGE_LABELS, INDUSTRY_LABELS } from "@/lib/constants";
import type { Country, Stage } from "@/lib/types";

const INITIAL_STATE: SubmitStartupResult = { success: false };

const COUNTRY_OPTIONS = Object.entries(COUNTRY_LABELS) as [Country, string][];
const STAGE_OPTIONS = Object.entries(STAGE_LABELS) as [Stage, string][];
const INDUSTRY_OPTIONS = Object.entries(INDUSTRY_LABELS);

export function SubmitStartupForm() {
  const [state, action, isPending] = useActionState(submitStartup, INITIAL_STATE);

  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-6">
      {/* Global error */}
      {state.error && (
        <div role="alert" className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Name */}
        <Field
          id="name"
          label="Nombre de la startup"
          required
          error={fe.name}
          colSpan="full"
        >
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            placeholder="Ej. Rappi, Platzi, Bancolombia"
            className={inputClass(!!fe.name)}
          />
        </Field>

        {/* Website */}
        <Field id="website" label="Sitio web" required error={fe.website}>
          <input
            id="website"
            name="website"
            type="url"
            required
            placeholder="https://miempresa.co"
            className={inputClass(!!fe.website)}
          />
        </Field>

        {/* Country */}
        <Field id="country" label="País" required error={fe.country}>
          <select
            id="country"
            name="country"
            required
            defaultValue=""
            className={inputClass(!!fe.country)}
          >
            <option value="" disabled>
              Seleccioná un país
            </option>
            {COUNTRY_OPTIONS.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        {/* City */}
        <Field id="city" label="Ciudad" error={fe.city}>
          <input
            id="city"
            name="city"
            type="text"
            placeholder="Bogotá, Medellín, Buenos Aires..."
            className={inputClass(!!fe.city)}
          />
        </Field>

        {/* Industry */}
        <Field id="industry" label="Industria" required error={fe.industry}>
          <select
            id="industry"
            name="industry"
            required
            defaultValue=""
            className={inputClass(!!fe.industry)}
          >
            <option value="" disabled>
              Seleccioná una industria
            </option>
            {INDUSTRY_OPTIONS.map(([slug, label]) => (
              <option key={slug} value={slug}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        {/* Stage */}
        <Field id="stage" label="Etapa" error={fe.stage}>
          <select
            id="stage"
            name="stage"
            defaultValue=""
            className={inputClass(!!fe.stage)}
          >
            <option value="">No sé / Prefiero no decir</option>
            {STAGE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        {/* Description */}
        <Field
          id="description"
          label="Descripción corta"
          hint="1–2 oraciones, máx. 280 caracteres."
          required
          error={fe.description}
          colSpan="full"
        >
          <textarea
            id="description"
            name="description"
            required
            maxLength={280}
            rows={3}
            placeholder="Plataforma de pagos digitales para pymes latinoamericanas..."
            className={inputClass(!!fe.description)}
          />
        </Field>

        {/* Contact email */}
        <Field
          id="contact_email"
          label="Email de contacto"
          hint="Opcional. Solo para uso interno del equipo de Col/Labs."
          error={fe.contact_email}
          colSpan="full"
        >
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            placeholder="fundador@startup.co"
            className={inputClass(!!fe.contact_email)}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <p className="text-xs text-muted-foreground max-w-xs">
          Tu startup quedará en revisión. El equipo de Col/Labs la aprobará en los próximos días.
        </p>
        <button
          id="submit-startup-btn"
          type="submit"
          disabled={isPending}
          className="press bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:bg-primary disabled:opacity-50 shrink-0"
        >
          {isPending ? "Enviando..." : "Enviar startup"}
        </button>
      </div>
    </form>
  );
}

// --- Sub-components ---

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  colSpan?: "full";
  children: React.ReactNode;
}

function Field({ id, label, hint, required, error, colSpan, children }: FieldProps) {
  return (
    <div className={colSpan === "full" ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="data-label mb-1.5 block">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return [
    "w-full border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-1 focus:ring-ring",
    hasError ? "border-destructive" : "border-border",
  ].join(" ");
}
