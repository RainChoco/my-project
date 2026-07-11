// Enum values and display metadata mirroring backend/src/validators/tenderValidator.js
// and backend/src/models/tender.js - keep in sync with those if the schema changes.

export const STATUS_VALUES = ['draft', 'submitted', 'under_evaluation', 'approved', 'rejected', 'withdrawn'];

export const ELIGIBILITY_STATUS_VALUES = ['pending', 'eligible', 'flagged', 'rejected'];

export const BCA_GRADES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

export const FILE_TYPE_VALUES = ['main_offer', 'alternative_offer', 'license', 'other'];

export const FILE_TYPE_LABELS = {
  main_offer: 'Main Offer',
  alternative_offer: 'Alternative Offer',
  license: 'License',
  other: 'Other',
};

// Statuses where PATCH /api/tenders/:id is blocked (409) - see LOCKED_FOR_EDIT_STATUSES
// in backend/src/controllers/tenderController.js.
export const LOCKED_FOR_EDIT_STATUSES = ['under_evaluation', 'approved', 'rejected', 'withdrawn'];

// Statuses where DELETE /api/tenders/:id is blocked (409) - see LOCKED_FOR_DELETE_STATUSES.
export const LOCKED_FOR_DELETE_STATUSES = ['under_evaluation', 'approved', 'rejected'];

export const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_evaluation: 'Under Evaluation',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const ELIGIBILITY_STATUS_LABELS = {
  pending: 'Pending',
  eligible: 'Eligible',
  flagged: 'Flagged',
  rejected: 'Rejected',
};

export const STATUS_BADGE_VARIANTS = {
  draft: 'secondary',
  submitted: 'default',
  under_evaluation: 'warning',
  approved: 'success',
  rejected: 'destructive',
  withdrawn: 'outline',
};

export const ELIGIBILITY_BADGE_VARIANTS = {
  pending: 'secondary',
  eligible: 'success',
  flagged: 'warning',
  rejected: 'destructive',
};
