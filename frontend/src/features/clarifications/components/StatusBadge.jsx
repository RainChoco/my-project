import { Badge } from '@/components/ui/badge';
import {
  LOG_STATUS_LABELS,
  LOG_STATUS_BADGE_VARIANTS,
  LOG_TYPE_LABELS,
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_BADGE_VARIANTS,
} from '../constants';

// clarification_logs.status
export function ClarificationStatusBadge({ status }) {
  return <Badge variant={LOG_STATUS_BADGE_VARIANTS[status] ?? 'outline'}>{LOG_STATUS_LABELS[status] ?? status}</Badge>;
}

// clarification_logs.log_type
export function LogTypeBadge({ logType }) {
  return <Badge variant="outline">{LOG_TYPE_LABELS[logType] ?? logType}</Badge>;
}

// job_adjustment_requests.approval_status
export function ApprovalStatusBadge({ status }) {
  return (
    <Badge variant={APPROVAL_STATUS_BADGE_VARIANTS[status] ?? 'outline'}>
      {APPROVAL_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
