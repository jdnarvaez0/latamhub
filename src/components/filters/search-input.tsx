/**
 * Search input — debounced free-text search box.
 *
 * Spec: `startup-filters` "Debounced free-text search" (~250 ms).
 *
 * Behaviour:
 *  - The visible `<input>` is **fully controlled by the parent** via
 *    the `value` prop — the URL is the source of truth, so reloading
 *    the page restores the search term.
 *  - Typing updates an internal `draft` so the input is responsive
 *    (no per-keystroke URL mutation). The `draft` is fed through
 *    `useDebounce(..., 250)` and the **debounced** value is what the
 *    parent sees in `onChange`. That is the spec's debounce contract:
 *    "no filtering occurs between each keystroke".
 *  - When the parent resets `value` (e.g. via the panel's "Limpiar
 *    filtros" button), an effect re-syncs `draft` so the input visually
 *    clears. The sync is guarded by a `lastValueRef` so a normal
 *    "user-typed, debounce-fired, parent-updated, value-changed-back"
 *    round trip does not interrupt the user's typing.
 *  - The first mount does not fire `onChange` — the URL is already
 *    authoritative and re-emitting the initial value would force a
 *    redundant `router.replace`.
 *
 * The component is a client component (`"use client"`) because it owns
 * the debounce timer, the `draft` state, and the `onChange` callback.
 * It does not import `useSearchParams` — the parent owns the URL.
 *
 * URL contract: the parent derives the URL via `buildDirectoryUrl`. The
 * component never touches `useSearchParams` / `URLSearchParams` — it
 * only fires `onChange` with the next string.
 */
"use client";

import { useEffect, useRef, useState } from "react";

import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

const DEFAULT_DELAY_MS = 250;

export interface SearchInputProps {
  /** Current search term (from the URL). */
  value: string;
  /**
   * Called with the **debounced** search term. The component never
   * calls `onChange` on every keystroke.
   */
  onChange: (value: string) => void;
  /**
   * Debounce delay in milliseconds. Defaults to 250 ms — the design's
   * locked value (`design.md` §8, decision "search debounce ~250ms").
   * Exposed as a prop for tests and for callers that want a longer
   * delay on mobile.
   */
  delayMs?: number;
  /** Visible placeholder string. Spanish by default. */
  placeholder?: string;
  /** Extra classes appended to the wrapper. */
  className?: string;
  /** `id` for the underlying `<input>`. Auto-generated when omitted. */
  id?: string;
}

export function SearchInput({
  value,
  onChange,
  delayMs = DEFAULT_DELAY_MS,
  placeholder = "Buscar por nombre, industria, ciudad…",
  className,
  id,
}: SearchInputProps) {
  const inputId = id ?? "directory-search";
  const descriptionId = `${inputId}-hint`;

  /**
   * Internal "what the input shows right now". Starts in sync with
   * `value`; updates immediately on typing. The debounced version of
   * this is what the parent receives.
   */
  const [draft, setDraft] = useState<string>(value);
  const debouncedDraft = useDebounce(draft, delayMs);

  /**
   * Track the last value we emitted (or received from the parent on
   * mount). When `value` changes from the parent side, we only resync
   * `draft` if the new `value` differs from what we last emitted —
   * that way the user typing → debounce → parent update loop is not
   * clobbered by a redundant re-sync.
   */
  const lastValueRef = useRef<string>(value);
  const isInitialMount = useRef<boolean>(true);

  // Re-sync draft when the parent's `value` changes externally (e.g.
  // "Limpiar filtros" clears it). The ref guard avoids a feedback loop
  // with the `useEffect` below.
  useEffect(() => {
    if (value !== lastValueRef.current) {
      lastValueRef.current = value;
      setDraft(value);
    }
  }, [value]);

  // Emit the debounced draft to the parent. Skip the initial mount so
  // a reload does not produce a redundant `router.replace`.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastValueRef.current = debouncedDraft;
      return;
    }
    if (debouncedDraft !== lastValueRef.current) {
      lastValueRef.current = debouncedDraft;
      onChange(debouncedDraft);
    }
  }, [debouncedDraft, onChange]);

  return (
    <div className={cn("relative w-full", className)}>
      <label htmlFor={inputId} className="sr-only">
        Buscar en el directorio
      </label>
      <div
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
      >
        <svg
          className="size-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        id={inputId}
        type="search"
        inputMode="search"
        autoComplete="off"
        spellCheck={false}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-describedby={descriptionId}
        className={cn(
          "h-10 w-full border border-border bg-surface pl-9 pr-3 text-sm transition-colors outline-none",
          "placeholder:text-muted-foreground",
          "focus:border-primary focus:ring-2 focus:ring-primary/20"
        )}
      />
      <span id={descriptionId} className="sr-only">
        La búsqueda se aplica tras una breve pausa para no saturar la URL.
      </span>
    </div>
  );
}
