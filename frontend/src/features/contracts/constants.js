// Enum values and display metadata mirroring backend/src/validators/contractValidator.js -
// keep in sync with those if the schema changes.

export const CATEGORY_VALUES = [
  'Cleaning',
  'Conservancy',
  'Maintenance',
  'Landscaping',
  'Horticulture',
  'Lift Maintenance',
  'Mechanical & Electrical (M&E) Works',
  'Pest Control',
  'Repair & Redecoration (R&R)',
  'Upgrading Works',
];

// 'Active'/'Pending Award'/'Under Evaluation'/'Completed' describe an already-awarded
// contract's own execution lifecycle, additive alongside the original tender-opportunity
// statuses (Draft/Open/.../Cancelled) - see backend/src/validators/contractValidator.js.
export const STATUS_VALUES = [
  'Draft',
  'Open',
  'Evaluating',
  'Awarded',
  'Closed',
  'Archived',
  'Cancelled',
  'Active',
  'Pending Award',
  'Under Evaluation',
  'Completed',
];

// Shared badge color mapping so the list and detail pages can't drift apart.
export const STATUS_BADGE_VARIANTS = {
  Draft: 'secondary',
  Open: 'success',
  Evaluating: 'warning',
  Awarded: 'default',
  Active: 'success',
  'Pending Award': 'warning',
  'Under Evaluation': 'warning',
  Completed: 'outline',
  Closed: 'destructive',
  Archived: 'outline',
  Cancelled: 'warning',
};

// Statuses where a contract is no longer accepting new tender submissions. Additive to
// the original ['Archived', 'Closed', 'Cancelled'] gating in
// frontend/src/features/tenders/pages/TenderFormPage.jsx's ContractInfoPanel - these 4
// describe an already-awarded/executing contract (this seed batch's status values),
// which shouldn't take fresh tender submissions either.
export const TENDER_SUBMISSION_BLOCKED_STATUSES = [
  'Archived',
  'Closed',
  'Cancelled',
  'Active',
  'Pending Award',
  'Under Evaluation',
  'Completed',
];

// bizSAFE levels are shared with the tenders scope's minimum-requirement enum
// (backend/src/models/tender.js's bizsafe_level ENUM) - re-exported here rather than
// re-declared so the two scopes can't drift apart.
export { BIZSAFE_LEVELS } from '@/features/tenders/constants';

export const EXTENSION_TERMS_OPTIONS = ['None', '+1 Year', '+2 Years', '+1 Year, then +1 Year'];

// Prefilled default for the Governing Law Framework field (project-requirements.md) -
// still editable per-contract, not enforced.
export const DEFAULT_GOVERNING_LAW_FRAMEWORK =
  'Singapore Town Councils Act & Standard Public Sector Conditions of Contract (PSSCOC)';
