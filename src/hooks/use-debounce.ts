/**
 * `useDebounce<T>(value, delayMs)` — return a value that only updates
 * after it has been stable for `delayMs` milliseconds.
 *
 * Used by the free-text search input so typing does not produce a URL
 * mutation per keystroke. The 250ms default matches the design
 * (decision §8: "client `.toLowerCase().includes()`; debounce ~250ms").
 *
 * The hook is intentionally minimal: no leading-edge emit, no max-wait
 * timer, no equality short-circuit. The directory only needs the
 * "trailing edge after a quiet period" semantic, and equality
 * short-circuiting is the caller's job (React state already does it).
 */
"use client";

import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number = 250): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    // Schedule the trailing-edge update. Cleanup cancels the timer when
    // `value` or `delayMs` changes — that is the entire debounce
    // contract: only the last value in a burst survives.
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debounced;
}
