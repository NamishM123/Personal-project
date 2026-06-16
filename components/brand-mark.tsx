import { cn } from "@/lib/utils";

/**
 * Carved-tile mark. Solid accent ground, single diagonal that cuts to the
 * page surface. No gradient, no glow; the shape carries the brand.
 */
export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect x="1" y="1" width="30" height="30" rx="6" fill="hsl(var(--accent))" />
      <path
        d="M9 23 L23 9"
        stroke="hsl(var(--bg))"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
