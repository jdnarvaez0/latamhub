import { cn } from "@/lib/utils";

/**
 * Square letter avatar used in nav and startup rows.
 * Pure presentational: callers compute the letter(s) and pass them in.
 */
export function Monogram({
  letter,
  size = "md",
  className,
}: {
  letter: string;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center border border-border bg-primary/10 font-display font-bold tracking-tight text-primary",
        size === "lg" ? "size-20 text-2xl" : "size-16 text-lg",
        className
      )}
    >
      {letter}
    </div>
  );
}
