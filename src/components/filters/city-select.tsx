/**
 * City filter — single-select dropdown of cities for the selected country.
 *
 * Spec: `startup-filters` "City filter depends on country":
 *  - Visitors can filter by city **when a supported country is
 *    selected**.
 *  - Clearing the country selection clears the city filter (handled by
 *    the parent's `onChangeCountry` cascade — see design §6).
 *
 * The component is **disabled** when:
 *  - the parent passed `disabled === true` (the canonical signal for
 *    "no country is selected"), or
 *  - there are no `options` to choose from (e.g. the country has no
 *    approved startups yet).
 *
 * In the disabled state the control still shows the currently selected
 * city (if any) so the URL is not "lost" — the user sees what they have
 * and knows they need to pick a country to change it. Selecting a city
 * triggers `onChange(value)`; selecting the "Todas las ciudades" entry
 * (or the currently selected city a second time on a focused select —
 * the browser handles that) triggers `onChange(null)`.
 *
 * The native `<select>` is used on purpose: it gives us free keyboard
 * navigation, mobile native pickers and screen-reader announcement
 * without any custom JS. We style it with Tailwind to match the
 * directory's border / focus-ring language; the native chevron is left
 * visible so the control looks like a `<select>` everywhere.
 *
 * URL contract: the parent derives the URL via `buildDirectoryUrl`. The
 * component never touches `useSearchParams` / `URLSearchParams` — it
 * only fires `onChange` with the next city string or `null`.
 */
"use client";

import { cn } from "@/lib/utils";

import type { FilterOption } from "./option";

const ALL_CITIES_VALUE = "__all__";

export interface CitySelectProps {
  /** Currently selected city label, or `null` for no city filter. */
  value: string | null;
  /**
   * City options for the **currently selected country**. The parent is
   * responsible for deriving these from the live startups; the
   * component never reads the country itself.
   */
  options: FilterOption[];
  /**
   * Disable the control. The parent passes `disabled={country === null}`
   * (or equivalent) so city selection requires a country first.
   */
  disabled?: boolean;
  /**
   * Called with the next city, or `null` to clear the city filter. The
   * native `<select>` always returns a non-null string, so we map the
   * "Todas" sentinel back to `null` for the parent.
   */
  onChange: (value: string | null) => void;
  /** Extra classes appended to the `<select>`. */
  className?: string;
}

export function CitySelect({
  value,
  options,
  disabled = false,
  onChange,
  className,
}: CitySelectProps) {
  const isDisabled = disabled || options.length === 0;

  /**
   * Map the native `<select>` value back to the parent's contract.
   * `ALL_CITIES_VALUE` is the sentinel for "no city filter" — the
   * component never lets `null` reach the DOM, because `<select>` does
   * not have a native `null` value (and using `value=""` would collide
   * with a real city named "" if one ever exists).
   */
  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (next === ALL_CITIES_VALUE) {
      onChange(null);
    } else {
      onChange(next);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor="city-select"
        className="data-label block"
      >
        Ciudad
      </label>
      <select
        id="city-select"
        value={value ?? ALL_CITIES_VALUE}
        onChange={handleChange}
        disabled={isDisabled}
        aria-describedby={isDisabled ? "city-select-hint" : undefined}
        className={cn(
          "w-full cursor-pointer border border-border bg-surface px-3 py-2 text-sm transition-colors outline-none",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60"
        )}
      >
        <option value={ALL_CITIES_VALUE}>Todas las ciudades</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled === true}>
            {option.label}
            {typeof option.count === "number" ? ` (${option.count})` : ""}
          </option>
        ))}
      </select>
      {isDisabled ? (
        <p id="city-select-hint" className="text-muted-foreground text-xs">
          Selecciona un país para filtrar por ciudad.
        </p>
      ) : null}
    </div>
  );
}
