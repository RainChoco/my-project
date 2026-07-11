import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const VARIANT_STYLES = {
  default: "border-border bg-background text-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  destructive: "border-red-200 bg-red-50 text-red-900",
};

function Toast({ id, title, description, variant = "default", dismiss }) {
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto relative flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg",
        VARIANT_STYLES[variant]
      )}
    >
      <div className="grid flex-1 gap-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  );
}

export { Toast };
