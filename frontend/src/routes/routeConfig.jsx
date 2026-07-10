import { DashboardPage } from '../features/dashboard';
import { ComingSoonPage } from '../pages';

// Matches backend/src/models/user.js's `role` ENUM and design/test-tokens.md.
export const ROLES = {
  MA_STAFF: 'ma_staff',
  EVALUATOR: 'evaluator',
  MANAGEMENT: 'management',
  REPORT_PREPARER: 'report_preparer',
  VENDOR_LIAISON: 'vendor_liaison',
};

export const ALL_ROLES = Object.values(ROLES);

const { MA_STAFF, EVALUATOR, MANAGEMENT, REPORT_PREPARER, VENDOR_LIAISON } = ROLES;

// Single source of truth for both the sidebar nav and the route/role guards below -
// a role's nav item and its route access can never drift apart.
//
// Role lists are inferred from each scope's design/<name>/use-cases.md actors, since
// Calista's use-cases.md names generic actors ("Procurement Officer", "Manager") rather
// than the actual `role` enum - mapped here as report_preparer/management respectively,
// per problem-statement.md's inferred role list. Adjust if the team decides otherwise.
export const routeConfig = [
  {
    path: '/',
    label: 'Dashboard',
    roles: ALL_ROLES, // design/kai-xuan/use-cases.md UC-KX-01/02 name evaluator/ma_staff; no role restriction documented on the read endpoints, so left open to all
    element: <DashboardPage />,
  },
  {
    path: '/tenders',
    label: 'Tenders',
    roles: [MA_STAFF, EVALUATOR, MANAGEMENT, REPORT_PREPARER], // UC-A2 (ma_staff/evaluator/management) + Calista UC1 step 2 needs to select a tender
    element: <ComingSoonPage title="Tenders" description="Tender intake, CRUD, documents, eligibility (Zheng Hong)." />,
  },
  {
    path: '/tenders/config',
    label: 'Eligibility Config',
    roles: [MA_STAFF], // UC-A9/UC-A10, explicitly "admin function"
    element: <ComingSoonPage title="Eligibility Configuration" description="BCA grade limits & eligibility thresholds (Zheng Hong)." />,
  },
  {
    path: '/evaluations/criteria',
    label: 'Evaluation Criteria',
    roles: [MA_STAFF], // UC-B1/UC-B2, explicitly "admin function"
    element: <ComingSoonPage title="Evaluation Criteria" description="Price/quality weight setup (Jerrold)." />,
  },
  {
    path: '/evaluations',
    label: 'Evaluations',
    roles: [MA_STAFF, EVALUATOR, MANAGEMENT], // UC-B3/B4/B6/B9/B10 actors
    element: <ComingSoonPage title="Evaluations" description="PQM scoring, risk matrix, approvals (Jerrold)." />,
  },
  {
    path: '/board-papers',
    label: 'Board Papers',
    roles: [REPORT_PREPARER, MANAGEMENT], // Calista's "Procurement Officer" / "Manager" actors
    element: <ComingSoonPage title="Board Papers" description="Board paper & proposal generation (Calista)." />,
  },
  {
    path: '/clarifications',
    label: 'Clarifications',
    roles: [MA_STAFF, VENDOR_LIAISON, EVALUATOR], // UC-D1-D9 actors; evaluator is notified per UC-D5
    element: <ComingSoonPage title="Clarifications" description="Pricing deviation clarifications & job adjustments (Sulaiman)." />,
  },
];
