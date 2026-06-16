import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variantClass: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent/90",
  secondary: "bg-surface2 text-fg hover:bg-surface2/70",
  ghost: "bg-transparent text-fg hover:bg-surface2",
  outline: "border border-border bg-transparent text-fg hover:bg-surface2",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-9 px-4 text-sm rounded-lg",
  lg: "h-10 px-5 text-sm rounded-xl",
  icon: "h-9 w-9 rounded-lg",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium select-none",
        // ease-out everywhere; never ease-in (Emil)
        "transition-[transform,background-color,opacity,box-shadow] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
        // tactile :active scale (Emil's 0.97)
        "active:scale-[0.97] active:duration-100",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
