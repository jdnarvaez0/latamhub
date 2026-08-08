/**
 * Display maps for the COL/LABS domain enums. Spanish labels for the UI;
 * English values are stored in the database.
 */
import type { Country, Modality, Stage } from "@/lib/types";

export const COUNTRY_LABELS: Record<Country, string> = {
  CO: "Colombia",
  BR: "Brasil",
  CL: "Chile",
  AR: "Argentina",
  MX: "México",
};

export const STAGE_LABELS: Record<Stage, string> = {
  "pre-seed": "Pre-semilla",
  "seed": "Semilla",
  "series-a": "Serie A",
  "series-b+": "Serie B+",
  "bootstrapped": "Bootstrapped",
};

export const MODALITY_LABELS: Record<Modality, string> = {
  remote: "Remoto",
  hybrid: "Híbrido",
  onsite: "Presencial",
};

export const STARTUP_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};
