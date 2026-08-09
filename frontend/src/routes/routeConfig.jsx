import { Navigate } from 'react-router-dom';
import { DashboardPage } from '../features/dashboard';
import { ContractListPage, ContractFormPage } from '../features/contracts';
import ContractDetailPage from '../features/contracts/pages/ContractDetailPage';
import {
  TendersDashboardPage,
  TenderFormPage,
  TenderDetailPage,
  TenderRecordLookupPage,
  EligibilityConfigPage,
} from '../features/tenders';
import { EvaluationCriteriaPage, EvaluationsPage, EvaluationDetailPage, ApprovalHistoryPage, PendingApprovalsPage } from '../features/evaluations';
import {
  BoardPaperPage,
  BoardPaperResultPage,
  ProposalGeneratorPage,
  ProposalResultPage,
  HistoryPage
} from '../features/board-papers';
import ClarificationLogsPage from '../features/clarifications/pages/ClarificationLogsPage';
import ClarificationLogDetailPage from '../features/clarifications/pages/ClarificationLogDetailPage';
import JobAdjustmentRequestsPage from '../features/clarifications/pages/JobAdjustmentRequestsPage';
import { ROLES, ALL_ROLES } from './roles';

export { ROLES, ALL_ROLES };

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
    path: '/contracts',
    label: 'Contracts',
    roles: ALL_ROLES, // All roles can view contracts (Contract Opportunity is a public listing)
    element: <ContractListPage />,
    children: [
      { path: 'new',  roles: [MA_STAFF], element: <ContractFormPage mode="create" /> },
      { path: ':id', roles: ALL_ROLES, element: <ContractDetailPage /> },
      { path: ':id/edit', roles: [MA_STAFF], element: <ContractFormPage mode="edit" /> },
    ],
  },
  {
    path: '/tenders',
    label: 'Tenders',
    roles: [MA_STAFF, EVALUATOR, MANAGEMENT, REPORT_PREPARER], // UC-A2 (ma_staff/evaluator/management) + Calista UC1 step 2 needs to select a tender
    element: <TendersDashboardPage />,
    // Dynamic sub-routes (new/:id/:id-edit) can't be expressed as a single flat path,
    // so this scope's route entry carries children - see AppRoutes.jsx for how these nest.
    children: [
      { path: 'new', roles: [MA_STAFF], element: <TenderFormPage mode="create" /> }, // UC-A1
      { path: 'lookup', roles: [MA_STAFF], element: <TenderRecordLookupPage /> }, // Existing/past record (OCR) entry option from the 'new' mode-selection screen
      { path: ':id', roles: [MA_STAFF, EVALUATOR, MANAGEMENT, REPORT_PREPARER], element: <TenderDetailPage /> }, // UC-A2/UC-A8
      { path: ':id/edit', roles: [MA_STAFF], element: <TenderFormPage mode="edit" /> }, // UC-A3
    ],
  },
  {
    path: '/tenders/config',
    label: 'Eligibility Config',
    roles: [MA_STAFF], // UC-A9/UC-A10, explicitly "admin function"
    element: <EligibilityConfigPage />,
  },
  {
    path: '/evaluations/criteria',
    label: 'Evaluation Criteria',
    roles: [MA_STAFF], // UC-B1/UC-B2, explicitly "admin function"
    element: <EvaluationCriteriaPage />,
  },
  {
    path: '/evaluations',
    label: 'Evaluations',
    roles: [MA_STAFF, EVALUATOR, MANAGEMENT], // UC-B3/B4/B6/B9/B10 actors
    element: <EvaluationsPage />,
  },
  {
    path: '/evaluations/pending-approvals',
    label: 'Approval',
    roles: [MA_STAFF, EVALUATOR, MANAGEMENT], // UC-B9/B10: queue of evaluations awaiting a manager decision
    element: <PendingApprovalsPage />,
  },
  {
    path: '/evaluations/:id',
    // Not in the sidebar nav (no `label`) - reached by clicking a row on
    // /evaluations, not a top-level nav item. Same actor list as /evaluations.
    roles: [MA_STAFF, EVALUATOR, MANAGEMENT],
    element: <EvaluationDetailPage />,
    children: [
      // UC-B9/B10: dedicated manager-decision screen, linked from EvaluationDetailPage.
      { path: 'approval', roles: [MA_STAFF, EVALUATOR, MANAGEMENT], element: <ApprovalHistoryPage /> },
    ],
  },
  {
  path: '/board-papers',
  label: 'Board Papers',
  roles: [REPORT_PREPARER, MANAGEMENT, MA_STAFF], // Calista's "Procurement Officer" / "Manager" actors
  element: <BoardPaperPage />,
  children: [
    {
      path: "result",
      roles: [REPORT_PREPARER, MANAGEMENT, MA_STAFF],
      element: <BoardPaperResultPage />
    },
    {
      path: "proposal-generation",
      roles: [REPORT_PREPARER, MANAGEMENT, MA_STAFF],
      element: <ProposalGeneratorPage />
    },
    {
      path: "proposal-result",
      roles: [REPORT_PREPARER, MANAGEMENT, MA_STAFF],
      element: <ProposalResultPage />
    },
    {
      path: "history",
      roles: [REPORT_PREPARER, MANAGEMENT, MA_STAFF],
      element: <HistoryPage />
    }
  ]
},
  {
    path: '/history',
    label: 'History',
    roles: [REPORT_PREPARER, MANAGEMENT, MA_STAFF],
    element: <Navigate to="/board-papers/history" replace />,
  },
  {
    path: '/proposal-report',
    label: 'Proposal Reports',
    roles: [REPORT_PREPARER, MANAGEMENT, MA_STAFF],
    element: <ProposalGeneratorPage />,
    children: [
      {
        path: 'result',
        roles: [REPORT_PREPARER, MANAGEMENT, MA_STAFF],
        element: <ProposalResultPage />
      }
    ]
  },
  {
    path: '/clarifications',
    label: 'Clarifications',
    roles: [MA_STAFF, VENDOR_LIAISON, EVALUATOR], // UC-D1-D9 actors; evaluator is notified per UC-D5
    element: <ClarificationLogsPage />,
    children: [
      { path: ':id', roles: [MA_STAFF, VENDOR_LIAISON, EVALUATOR], element: <ClarificationLogDetailPage /> }, // UC-D2-D9
    ],
  },
  {
    path: '/job-adjustment-requests',
    label: 'Job Adjustments',
    roles: [MA_STAFF, VENDOR_LIAISON], // UC-D7 actors
    element: <JobAdjustmentRequestsPage />,
  },
];
