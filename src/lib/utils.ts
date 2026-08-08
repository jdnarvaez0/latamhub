/**
 * Tailwind class-name helper used by shadcn/ui components.
 * Kept in lib/utils so the shadcn CLI can find it via the components.json alias.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
