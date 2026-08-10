/**
 * Country filter — single-select radio group with coming-soon countries
 * disabled and a "Próximamente" tooltip.
 *
 * Spec: `startup-filters` "Coming-soon countries are disabled".
 *
 * Behaviour:
 *  - Colombia (`CO`) is the single live country in Phase 1.
 *  - Brazil / Chile / Argentina / Mexico are rendered as **disabled**
 *    pills with:
 *      * the Spanish label (`COUNTRY_LABELS[country]`),
 *      * the `count` from the parent's `options` (always 0 — they have
 *        no approved startups yet),
 *      * a `title="Próximamente"` tooltip,
 *      * `aria-disabled="true"` + visible disabled styling.
 *  - The parent passes `options: CountryFilterOption[]` with **all five
 *    countries** so the component knows the live count for CO and the
 *    `0` counts for the rest. The component **forces count=0 and
 *    disabled=true** on any option whose value is in
 *    `COMING_SOON_COUNTRIES`, so a wrong count from the parent cannot
 *    leak through.
 *  - Selecting the currently-selected country a second time clears the
 *    selection (toggle off → `onChange(null)`). The "Todos los países"
 *    pill is the explicit way to clear too.
 *
 * The component is a client component because every option is a button
 * with an `onClick` handler. The button is a real `<button type="button">`,
 * not a `<label>` wrapping a hidden radio, so the keyboard activation
 * behaviour is uniform and screen readers announce it as a toggle.
 *
 * URL contract: the parent derives the URL via `buildDirectoryUrl`. The
 * component never touches `useSearchParams` / `URLSearchParams` — it
 * only fires `onChange` with the next `Country | null`.
 */
"use client";

import { cn } from "@/lib/utils";
import {
  COMING_SOON_COUNTRIES,
  COUNTRY_LABELS,
} from "@/lib/constants";
import type { Country } from "@/lib/types";

import type { CountryFilterOption } from "./option";

const COMING_SOON_TOOLTIP = "Próximamente";

const basePillClass =
  "press inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors";

export interface CountryFilterProps {
  /** Currently selected country, or `null` for no country filter. */
  value: Country | null;
  /**
   * Per-country options with live counts. Must contain all 5 countries;
   * the parent builds it from `COUNTRY_LABELS`. The component forces
   * count=0 / disabled for any coming-soon country regardless of the
   * count the parent passed.
   */
  options: CountryFilterOption[];
  /**
   * Called with the next country, or `null` to clear the filter.
   * Tapping the currently-selected country toggles it off.
   */
  onChange: (value: Country | null) => void;
  /** Extra classes appended to the pill row. */
  className?: string;
}

export function CountryFilter({
  value,
  options,
  onChange,
  className,
}: CountryFilterProps) {
  /**
   * Resolve a `CountryFilterOption` to a row with the coming-soon policy
   * applied. The parent might have passed `count: 5` for Brazil by
   * accident; we still render it as `count: 0, disabled: true` because
   * the URL parser drops coming-soon values anyway — better to be
   * honest at the UI layer than to contradict the parser.
   */
  function resolve(option: CountryFilterOption) {
    const isComingSoon = (COMING_SOON_COUNTRIES as readonly Country[]).includes(
      option.value
    );
    return {
      label: option.label ?? COUNTRY_LABELS[option.value],
      count: isComingSoon ? 0 : option.count,
      disabled: isComingSoon || option.disabled === true,
    };
  }

  const isAll = value === null;

  return (
    <div role="radiogroup" aria-label="País" className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          role="radio"
          aria-checked={isAll}
          onClick={() => onChange(null)}
          className={cn(
            basePillClass,
            isAll
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-surface text-foreground hover:border-primary hover:text-primary"
          )}
        >
          Todos los países
        </button>

        {options.map((option) => {
          const resolved = resolve(option);
          const isActive = value === option.value && !resolved.disabled;

          const handleClick = () => {
            if (resolved.disabled) return;
            onChange(isActive ? null : option.value);
          };

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-disabled={resolved.disabled || undefined}
              aria-describedby={
                resolved.disabled
                  ? `country-${option.value}-hint`
                  : undefined
              }
              disabled={resolved.disabled}
              title={resolved.disabled ? COMING_SOON_TOOLTIP : undefined}
              onClick={handleClick}
              className={cn(
                basePillClass,
                resolved.disabled
                  ? "border-border bg-surface text-muted-foreground/40 cursor-not-allowed"
                  : isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-foreground hover:border-primary hover:text-primary"
              )}
            >
              <span>{resolved.label}</span>
              <span
                className={cn(
                  "font-mono text-[10px]",
                  isActive ? "opacity-80" : "text-muted-foreground"
                )}
                aria-hidden="true"
              >
                {resolved.count}
              </span>
              {resolved.disabled ? (
                <span id={`country-${option.value}-hint`} className="sr-only">
                  {COMING_SOON_TOOLTIP}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
