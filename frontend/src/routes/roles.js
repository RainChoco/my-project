// Matches backend/src/models/user.js's `role` ENUM and design/test-tokens.md.
// Kept in its own module (not routeConfig.jsx) so pages that routeConfig.jsx
// imports can import ROLES without creating a circular dependency.
export const ROLES = {
  MA_STAFF: 'ma_staff',
  EVALUATOR: 'evaluator',
  MANAGEMENT: 'management',
  REPORT_PREPARER: 'report_preparer',
  VENDOR_LIAISON: 'vendor_liaison',
};

export const ALL_ROLES = Object.values(ROLES);
