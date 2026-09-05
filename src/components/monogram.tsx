import { cn } from "@/lib/utils";

function extractDomain(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Square avatar used in nav, startup rows, and detail pages.
 * Shows the company logo image when available, falls back to high-res favicon from website,
 * and falls back to the monogram letter if both are unavailable or fail to load.
 */
export function Monogram({
  letter,
  logoUrl,
  website,
  alt = "",
  size = "md",
  className,
}: {
  letter: string;
  logoUrl?: string | null;
  website?: string | null;
  alt?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const sizeClasses = size === "lg" ? "size-20 text-2xl" : "size-16 text-lg";
  const domain = extractDomain(website);
  const resolvedLogoUrl =
    logoUrl ||
    (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null);

  if (resolvedLogoUrl) {
    return (
      <div
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden border border-border bg-surface p-1.5",
          sizeClasses,
          className
        )}
      >
        <img
          src={resolvedLogoUrl}
          alt={alt}
          loading="lazy"
          className="size-full object-contain"
          onError={(e) => {
            // If image fails to load, replace with monogram fallback
            const target = e.currentTarget;
            target.style.display = "none";
            if (target.parentElement) {
              const span = document.createElement("span");
              span.className = "font-display font-bold tracking-tight text-primary";
              span.textContent = letter;
              target.parentElement.appendChild(span);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center border border-border bg-primary/10 font-display font-bold tracking-tight text-primary",
        sizeClasses,
        className
      )}
    >
      {letter}
    </div>
  );
}
