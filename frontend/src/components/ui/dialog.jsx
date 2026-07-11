import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Minimal, dependency-free modal (backdrop + Escape-to-close) styled like shadcn/ui's
// Dialog. A full Radix Dialog isn't pulled in for this one modal use case (delete/withdraw
// confirmation) - this covers the same open/close and a11y-label needs without the extra dependency.
function Dialog({ open, onOpenChange, children }) {
  React.useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onOpenChange?.(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
        aria-hidden="true"
      />
      <div className="relative z-50">{children}</div>
    </div>
  );
}

const DialogContent = React.forwardRef(({ className, children, onClose, ...props }, ref) => (
  <div
    ref={ref}
    role="dialog"
    aria-modal="true"
    className={cn(
      "grid w-full max-w-lg gap-4 border border-border bg-background p-6 shadow-lg rounded-lg",
      className
    )}
    {...props}
  >
    {children}
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    )}
  </div>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
);

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
