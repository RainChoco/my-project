// Enum values and display metadata mirroring backend/src/validators/clarificationValidator.js
// and backend/src/models/clarificationLog.js et al. Keep in sync with those if the schema changes.

export const LOG_TYPE_VALUES = ['pricing_deviation', 'job_adjustment_notification'];

export const LOG_STATUS_VALUES = [
  'flagged',
  'no_action_required',
  'draft_ready',
  'approved',
  'sent',
  'responded',
  'escalated',
  'resolved',
];

export const DISPATCH_CHANNEL_VALUES = ['email', 'manual'];

export const APPROVAL_STATUS_VALUES = ['pending_approval', 'approved', 'rejected'];

export const LOG_TYPE_LABELS = {
  pricing_deviation: 'Pricing Deviation',
  job_adjustment_notification: 'Job Adjustment Notification',
};

export const LOG_STATUS_LABELS = {
  flagged: 'Flagged',
  no_action_required: 'No Action Required',
  draft_ready: 'Draft Ready',
  approved: 'Approved',
  sent: 'Sent',
  responded: 'Responded',
  escalated: 'Escalated',
  resolved: 'Resolved',
};

export const DISPATCH_CHANNEL_LABELS = {
  email: 'Email',
  manual: 'Manual (sent outside the system)',
};

export const APPROVAL_STATUS_LABELS = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

// Badge `variant` values map to components/ui/badge.jsx's cva variants
// (default/secondary/destructive/outline/success/warning).
export const LOG_STATUS_BADGE_VARIANTS = {
  flagged: 'warning',
  no_action_required: 'secondary',
  draft_ready: 'secondary',
  approved: 'default',
  sent: 'default',
  responded: 'success',
  escalated: 'destructive',
  resolved: 'success',
};

export const APPROVAL_STATUS_BADGE_VARIANTS = {
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

export const MESSAGE_TYPE_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  vendor_response: 'Vendor Response',
  reminder: 'Reminder',
};
