import { cn } from "@/lib/utils";

/**
 * Square avatar used in nav, startup rows, and detail pages.
 * Shows the company logo image when available; falls back to the monogram letter.
 */
export function Monogram({
  letter,
  logoUrl,
  alt = "",
  size = "md",
  className,
}: {
  letter: string;
  logoUrl?: string | null;
  alt?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const sizeClasses = size === "lg" ? "size-20 text-2xl" : "size-16 text-lg";

  if (logoUrl) {
    return (
      <div
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden border border-border bg-surface p-1.5",
          sizeClasses,
          className
        )}
      >
        <img
          src={logoUrl}
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
