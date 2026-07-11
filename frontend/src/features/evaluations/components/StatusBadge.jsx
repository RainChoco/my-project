import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib';

// evaluations.status - backend/src/models/evaluation.js
const EVALUATION_STATUS_STYLES = {
  processing: 'bg-secondary text-secondary-foreground',
  incomplete: 'border-amber-500 text-amber-700 dark:text-amber-400',
  scored: 'bg-blue-600 text-white border-transparent',
  approved: 'bg-green-600 text-white border-transparent',
  rejected: 'bg-destructive text-destructive-foreground border-transparent',
};

// approvals.decision - backend/src/models/approval.js
const DECISION_STATUS_STYLES = {
  approved: 'bg-green-600 text-white border-transparent',
  rejected: 'bg-destructive text-destructive-foreground border-transparent',
  revision_requested: 'border-amber-500 text-amber-700 dark:text-amber-400',
};

const LABELS = {
  processing: 'Processing',
  incomplete: 'Incomplete',
  scored: 'Scored',
  approved: 'Approved',
  rejected: 'Rejected',
  revision_requested: 'Revision requested',
};

export function EvaluationStatusBadge({ status }) {
  return (
    <Badge variant="outline" className={cn(EVALUATION_STATUS_STYLES[status])}>
      {LABELS[status] ?? status}
    </Badge>
  );
}

export function DecisionBadge({ decision }) {
  return (
    <Badge variant="outline" className={cn(DECISION_STATUS_STYLES[decision])}>
      {LABELS[decision] ?? decision}
    </Badge>
  );
}
