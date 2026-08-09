import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import PendingApprovalsPage from '../../src/features/evaluations/pages/PendingApprovalsPage';
import * as evaluationApi from '../../src/features/evaluations/services/evaluationApi';
import * as approvalApi from '../../src/features/evaluations/services/approvalApi';
import * as tenderApi from '../../src/features/tenders/services/tenderApi';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../src/features/evaluations/services/evaluationApi', () => ({
  fetchCompletedEvaluations: vi.fn(),
  fetchEvaluation: vi.fn(),
}));
vi.mock('../../src/features/evaluations/services/approvalApi', () => ({
  fetchApprovals: vi.fn(),
}));
vi.mock('../../src/features/tenders/services/tenderApi', () => ({
  getTender: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PendingApprovalsPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PendingApprovalsPage (Jerrold - Scope B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    evaluationApi.fetchCompletedEvaluations.mockResolvedValue({
      data: [
        { id: 1, tender_id: 1, tender_ref_no: 'TC-1', vendor_name: 'Vendor A', status: 'scored', pqm_score: 84, evaluation_date: '2026-01-01' },
        { id: 2, tender_id: 2, tender_ref_no: 'TC-2', vendor_name: 'Vendor B', status: 'approved', pqm_score: 75, evaluation_date: '2026-01-02' },
      ],
    });
    evaluationApi.fetchEvaluation.mockResolvedValue({ evaluated_by: 7 });
    tenderApi.getTender.mockResolvedValue({ contract: { name: 'Contract A' } });
    approvalApi.fetchApprovals.mockResolvedValue({
      data: [{ decision: 'approved', decided_at: new Date().toISOString() }],
    });
  });

  it('lists evaluations awaiting a manager decision with summary counts', async () => {
    renderComponent();

    expect(await screen.findByText('TC-1')).toBeInTheDocument();
    expect(screen.getByText('Vendor A')).toBeInTheDocument();
    expect(screen.getByText('Contract A')).toBeInTheDocument();
    expect(screen.getByText('Evaluator #7')).toBeInTheDocument();

    // Pending Approvals summary count (appears in both the page heading and the stat card).
    expect(screen.getAllByText('Pending Approvals').length).toBeGreaterThanOrEqual(2);
    // The already-approved evaluation is not part of the pending queue.
    expect(screen.queryByText('TC-2')).not.toBeInTheDocument();
  });

  it('filters the pending list by search term', async () => {
    renderComponent();

    await screen.findByText('TC-1');
    const searchInput = screen.getByPlaceholderText(/Search tender reference/i);
    fireEvent.change(searchInput, { target: { value: 'Nonexistent Vendor' } });

    await waitFor(() => {
      expect(screen.queryByText('TC-1')).not.toBeInTheDocument();
    });
    expect(screen.getByText('No pending approvals match your search.')).toBeInTheDocument();
  });

  it('navigates to the approval page when Review is clicked', async () => {
    renderComponent();

    const reviewButton = await screen.findByRole('button', { name: 'Review' });
    fireEvent.click(reviewButton);

    expect(mockNavigate).toHaveBeenCalledWith('/evaluations/1/approval');
  });
});
