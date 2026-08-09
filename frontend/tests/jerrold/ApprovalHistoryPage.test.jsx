import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ApprovalHistoryPage from '../../src/features/evaluations/pages/ApprovalHistoryPage';
import * as evaluationApi from '../../src/features/evaluations/services/evaluationApi';
import * as approvalApi from '../../src/features/evaluations/services/approvalApi';
import * as boardPaperSummaryApi from '../../src/features/evaluations/services/boardPaperSummaryApi';
import { useAuth } from '../../src/context';

vi.mock('../../src/features/evaluations/services/evaluationApi', () => ({
  fetchEvaluation: vi.fn(),
}));
vi.mock('../../src/features/evaluations/services/approvalApi', () => ({
  fetchApprovals: vi.fn(),
  createApproval: vi.fn(),
}));
vi.mock('../../src/features/evaluations/services/boardPaperSummaryApi', () => ({
  fetchBoardPaperForTender: vi.fn(),
}));
vi.mock('../../src/context');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const renderComponent = (id = 5) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/evaluations/${id}/approval`]}>
        <Routes>
          <Route path="/evaluations/:id/approval" element={<ApprovalHistoryPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const scoredEvaluation = {
  id: 5,
  tender_id: 1,
  tender_ref_no: 'TC-1',
  vendor_name: 'Vendor A',
  status: 'scored',
  price_score: 48,
  quality_score: 36,
  pqm_score: 84,
  evaluation_date: '2026-01-01',
  criterion_scores: [
    { evaluation_criteria_id: 1, criteria_name: 'Price', category: 'price', weight_percentage: 60, staff_score: 80, weighted_score: 48, remarks: 'Competitive' },
  ],
};

describe('ApprovalHistoryPage (Jerrold - Scope B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    evaluationApi.fetchEvaluation.mockResolvedValue(scoredEvaluation);
    approvalApi.fetchApprovals.mockResolvedValue({ data: [] });
    boardPaperSummaryApi.fetchBoardPaperForTender.mockResolvedValue(null);
  });

  it('does not show decision controls to a non-management role, even on a scored evaluation', async () => {
    useAuth.mockReturnValue({ role: 'evaluator' });

    renderComponent(5);

    await screen.findByText('Approval');
    expect(screen.queryByRole('button', { name: 'Approve Evaluation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reject Evaluation' })).not.toBeInTheDocument();
  });

  it('shows decision controls to a management role on a scored evaluation', async () => {
    useAuth.mockReturnValue({ role: 'management' });

    renderComponent(5);

    expect(await screen.findByRole('button', { name: 'Approve Evaluation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject Evaluation' })).toBeInTheDocument();
  });

  it('lets a manager approve a scored evaluation', async () => {
    useAuth.mockReturnValue({ role: 'management' });
    approvalApi.createApproval.mockResolvedValue({ id: 1, decision: 'approved' });

    renderComponent(5);

    fireEvent.click(await screen.findByRole('button', { name: 'Approve Evaluation' }));
    expect(await screen.findByText('Approve this evaluation?')).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole('button', { name: 'Approve Evaluation' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(approvalApi.createApproval).toHaveBeenCalledWith('5', { decision: 'approved', remarks: undefined });
    });
    expect(await screen.findByText('Evaluation approved successfully.')).toBeInTheDocument();
  });

  it('requires remarks before a manager can reject an evaluation', async () => {
    useAuth.mockReturnValue({ role: 'management' });
    approvalApi.createApproval.mockResolvedValue({ id: 2, decision: 'rejected' });

    renderComponent(5);

    fireEvent.click(await screen.findByRole('button', { name: 'Reject Evaluation' }));
    expect(await screen.findByText('Please provide a reason for rejecting this evaluation.')).toBeInTheDocument();
    expect(approvalApi.createApproval).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Manager Remarks'), { target: { value: 'Pricing needs clarification' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reject Evaluation' }));

    expect(await screen.findByText('Reject this evaluation?')).toBeInTheDocument();
    const confirmButtons = screen.getAllByRole('button', { name: 'Reject Evaluation' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(approvalApi.createApproval).toHaveBeenCalledWith('5', { decision: 'rejected', remarks: 'Pricing needs clarification' });
    });
  });

  it('renders the approval decision history', async () => {
    useAuth.mockReturnValue({ role: 'evaluator' });
    approvalApi.fetchApprovals.mockResolvedValue({
      data: [
        { id: 1, decision: 'approved', approver_name: 'Kai Xuan', decided_at: '2026-01-02T00:00:00Z', remarks: 'Looks good' },
      ],
    });

    renderComponent(5);

    expect(await screen.findByText('Kai Xuan')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Looks good')).toBeInTheDocument();
  });

  it('hides the decision form and shows a completed message once a decision has been made', async () => {
    useAuth.mockReturnValue({ role: 'management' });
    evaluationApi.fetchEvaluation.mockResolvedValue({ ...scoredEvaluation, status: 'approved' });

    renderComponent(5);

    expect(await screen.findByText('Decision Completed - see Decision history above.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve Evaluation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reject Evaluation' })).not.toBeInTheDocument();
  });
});
