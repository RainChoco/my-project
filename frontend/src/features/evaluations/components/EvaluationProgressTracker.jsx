import { Check, X } from 'lucide-react';
import { cn } from '../../../lib';

// Purely presentational - `steps` is [{ label, state }] where state is one of
// 'done' | 'current' | 'failed' | 'pending'. Callers derive state from the
// evaluation's status + live form completion (see EvaluationWorkspacePanel).
export function EvaluationProgressTracker({ steps }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-4">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium',
              step.state === 'done' && 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
              step.state === 'current' && 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 ring-1 ring-blue-500',
              step.state === 'failed' && 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
              step.state === 'pending' && 'border-muted-foreground/30 text-muted-foreground'
            )}
          >
            {step.state === 'done' && <Check className="h-3.5 w-3.5" />}
            {step.state === 'failed' && <X className="h-3.5 w-3.5" />}
            {(step.state === 'current' || step.state === 'pending') && (
              <span className={cn('h-2 w-2 rounded-full', step.state === 'current' ? 'bg-blue-600' : 'border border-current')} />
            )}
            {step.label}
          </div>
          {index < steps.length - 1 && <span className="text-muted-foreground">&rarr;</span>}
        </div>
      ))}
    </div>
  );
}
