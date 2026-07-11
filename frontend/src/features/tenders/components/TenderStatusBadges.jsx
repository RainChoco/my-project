import { Badge } from '@/components/ui/badge';
import {
  STATUS_LABELS,
  ELIGIBILITY_STATUS_LABELS,
  STATUS_BADGE_VARIANTS,
  ELIGIBILITY_BADGE_VARIANTS,
} from '../constants';

export function StatusBadge({ status }) {
  return <Badge variant={STATUS_BADGE_VARIANTS[status] ?? 'outline'}>{STATUS_LABELS[status] ?? status}</Badge>;
}

export function EligibilityBadge({ eligibilityStatus }) {
  return (
    <Badge variant={ELIGIBILITY_BADGE_VARIANTS[eligibilityStatus] ?? 'outline'}>
      {ELIGIBILITY_STATUS_LABELS[eligibilityStatus] ?? eligibilityStatus}
    </Badge>
  );
}
