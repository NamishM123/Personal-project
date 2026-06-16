"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  // We render the tree while open OR while closing, and drive the
  // CSS transition via `data-state`. This gives us interruptible
  // ease-out enter and exit per Emil's transition-not-keyframes rule.
  const [mounted, setMounted] = React.useState(open);
  const [state, setState] = React.useState<"open" | "closed">(open ? "open" : "closed");

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      // Next frame so the initial closed styles apply before we flip to open.
      const id = requestAnimationFrame(() => setState("open"));
      return () => cancelAnimationFrame(id);
    }
    setState("closed");
    const t = setTimeout(() => setMounted(false), 220);
    return () => clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        data-dialog-overlay
        data-state={state}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        data-dialog-content
        data-state={state}
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-[0_24px_70px_-20px_rgba(0,0,0,0.45)]",
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted transition-colors hover:bg-surface2 hover:text-fg active:scale-95"
          aria-label="Close"
        >
          <X size={16} />
        </button>
        {(title || description) && (
          <div className="px-5 pt-5 pb-2">
            {title && <h2 className="text-base font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
        )}
        <div className="p-5 pt-3">{children}</div>
      </div>
    </div>
  );
}
