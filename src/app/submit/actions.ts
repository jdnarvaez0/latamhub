"use server";

/**
 * Server Action: submit a new startup for review.
 *
 * Validates the form data and inserts a row in `startups` with status = 'pending'.
 * No user session required — submissions are open to the community.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Country, Stage } from "@/lib/types";
import { INDUSTRY_SLUGS } from "@/lib/constants";

const VALID_COUNTRIES: Country[] = ["CO", "BR", "CL", "AR", "MX"];
const VALID_STAGES: Stage[] = ["pre-seed", "seed", "series-a", "series-b+", "bootstrapped"];

export interface SubmitStartupResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitStartup(
  _prev: SubmitStartupResult,
  formData: FormData
): Promise<SubmitStartupResult> {
  const supabase = await createClient();

  // Extract & trim fields.
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const website = (formData.get("website") as string | null)?.trim() ?? "";
  const country = (formData.get("country") as string | null)?.trim() ?? "";
  const city = (formData.get("city") as string | null)?.trim() || null;
  const industry = (formData.get("industry") as string | null)?.trim() ?? "";
  const stage = (formData.get("stage") as string | null)?.trim() || null;
  const description = (formData.get("description") as string | null)?.trim() ?? "";
  const contactEmail = (formData.get("contact_email") as string | null)?.trim() || null;

  // Validate required fields.
  const fieldErrors: Record<string, string> = {};

  if (!name) fieldErrors.name = "El nombre es obligatorio.";
  if (name.length > 120) fieldErrors.name = "El nombre no puede superar 120 caracteres.";

  if (!website) fieldErrors.website = "La web es obligatoria.";
  if (website && !isValidUrl(website)) fieldErrors.website = "Ingresá una URL válida (ej. https://miempresa.co).";

  if (!country || !VALID_COUNTRIES.includes(country as Country)) {
    fieldErrors.country = "Seleccioná un país válido.";
  }

  if (!industry || !INDUSTRY_SLUGS.includes(industry)) {
    fieldErrors.industry = "Seleccioná una industria válida.";
  }

  if (stage && !VALID_STAGES.includes(stage as Stage)) {
    fieldErrors.stage = "Etapa inválida.";
  }

  if (!description) fieldErrors.description = "La descripción es obligatoria.";
  if (description.length > 280) fieldErrors.description = "La descripción no puede superar 280 caracteres.";

  if (contactEmail && !isValidEmail(contactEmail)) {
    fieldErrors.contact_email = "Ingresá un email válido.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  // Generate a URL-friendly slug from the startup name.
  const slug = generateSlug(name);

  const { error: dbError } = await supabase.from("startups").insert({
    name,
    slug,
    website,
    country,
    city,
    industry,
    stage: stage || null,
    description,
    status: "pending",
  });

  if (dbError) {
    // Handle unique constraint on slug (duplicate startup name).
    if (dbError.code === "23505") {
      return {
        success: false,
        fieldErrors: { name: "Ya existe una startup con ese nombre. ¿Ya la publicaste?" },
      };
    }
    console.error("[submitStartup] DB error:", dbError);
    return { success: false, error: "Error al guardar la startup. Intentá de nuevo." };
  }

  // Redirect to the success page after a clean insert.
  redirect("/submit/success");
}

// --- Helpers ---

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Generates a slug from a startup name.
 * Appends a 4-char random suffix to reduce collision probability.
 */
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48);

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
