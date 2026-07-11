import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

// Lightweight native <select> styled to match shadcn/ui's visual language, used by
// this scope's filter/form dropdowns (plain onChange + <option> children). Kept local
// to this feature rather than in components/ui/ since components/ui/select.jsx is the
// shared Radix compound Select (SelectTrigger/SelectContent/SelectItem) that the
// evaluations feature already depends on - the two APIs can't share one export name.
const NativeSelect = React.forwardRef(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1 pr-8 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  </div>
))
NativeSelect.displayName = "NativeSelect"

export { NativeSelect }
