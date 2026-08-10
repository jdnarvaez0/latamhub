/**
 * Directory error state — distinct, retryable presentation for the
 * Supabase query failure path.
 *
 * Spec: `directory-states` "Supabase error state". The three directory
 * states (empty / error / incomplete-data) must be visually distinct:
 *
 *  - **Icon**: circular exclamation badge (different from the empty
 *    state's dashed card and the inline "No proporcionado"
 *    placeholders used by `<StartupRow/>`).
 *  - **Headline**: "No pudimos cargar el directorio".
 *  - **Hint**: transient-failure copy asking the visitor to retry.
 *  - **Action**: primary retry button calling `router.refresh()` —
 *    the page is a Server Component, so the only way to re-run the
 *    Supabase query from a click handler is to refresh the route.
 *
 * Client Component because `router.refresh()` is client-only. Does
 * not import `useSearchParams` — retry keeps whatever filter was
 * active.
 *
 * Spanish copy throughout, matching the project's convention. The
 * server-side error string (`@/lib/queries.ts`) is also Spanish;
 * this component never re-reads it, so the two are coupled by
 * convention, not by code.
 */
"use client";

import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

const RETRY_LABEL = "Reintentar";
export const DIRECTORY_ERROR_HEADING = "No pudimos cargar el directorio";
export const DIRECTORY_ERROR_HINT =
  "Hubo un problema al consultar las startups. Revisa tu conexión y vuelve a intentarlo.";

function ErrorIcon() {
  return (
    <svg
      className="text-primary size-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        strokeWidth="2"
        className="text-primary/30"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4m0 4h.01"
        className="text-primary"
      />
    </svg>
  );
}

/**
 * Primary retry button. Real `<button>` so the browser owns the
 * activation semantics. `router.refresh()` re-runs the Server
 * Component subtree and re-invokes `getApprovedStartups()`.
 */
function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press inline-flex items-center justify-center bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
      )}
    >
      {RETRY_LABEL}
    </button>
  );
}

export interface DirectoryErrorStateProps {
  /**
   * Optional pre-formatted error message. The server component
   * (`app/page.tsx`) owns the message wording. Defaults to the
   * canonical "transient failure" hint.
   */
  message?: string;
  /** Extra classes appended to the root card. */
  className?: string;
}

export function DirectoryErrorState({
  message = DIRECTORY_ERROR_HINT,
  className,
}: DirectoryErrorStateProps) {
  const router = useRouter();

  const handleRetry = () => {
    router.refresh();
  };

  return (
    <EmptyState
      title={DIRECTORY_ERROR_HEADING}
      hint={message}
      icon={<ErrorIcon />}
      action={<RetryButton onClick={handleRetry} />}
      className={className}
    />
  );
}
