import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import EvaluationsPage from '../../src/features/evaluations/pages/EvaluationsPage';
import * as evaluationApi from '../../src/features/evaluations/services/evaluationApi';
import * as evaluationCriteriaApi from '../../src/features/evaluations/services/evaluationCriteriaApi';
import * as tenderApi from '../../src/features/tenders/services/tenderApi';
import { useAuth } from '../../src/context';

vi.mock('../../src/features/evaluations/services/evaluationApi', () => ({
  fetchEvaluationsForTender: vi.fn(),
  createEvaluationFromTender: vi.fn(),
  fetchCompletedEvaluations: vi.fn(),
  fetchEvaluation: vi.fn(),
  saveDraftScores: vi.fn(),
  submitEvaluation: vi.fn(),
}));
vi.mock('../../src/features/evaluations/services/evaluationCriteriaApi', () => ({
  fetchCriteria: vi.fn(),
}));
vi.mock('../../src/features/tenders/services/tenderApi', () => ({
  listTenders: vi.fn(),
  getTender: vi.fn(),
}));
vi.mock('../../src/context');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const renderComponent = (initialPath = '/evaluations') => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <EvaluationsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const criteriaResponse = {
  data: [
    { id: 1, criteria_name: 'Price', category: 'price', weight_percentage: 60, is_active: true, description: 'Price desc' },
    { id: 2, criteria_name: 'Quality', category: 'quality', weight_percentage: 40, is_active: true, description: 'Quality desc' },
  ],
  active_weight_total: 100,
};

const tender1 = {
  id: 1,
  tender_ref_no: 'TC-1',
  vendor_name: 'Vendor A',
  submission_date: '2026-01-01',
  contract: { name: 'Contract A', category: 'Cleaning', budgetLimit: 1000 },
};

describe('EvaluationsPage (Jerrold - Scope B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    // jsdom does not implement scrollIntoView.
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    useAuth.mockReturnValue({ role: 'evaluator' });
    tenderApi.listTenders.mockResolvedValue({ data: [{ id: 1, tender_ref_no: 'TC-1', vendor_name: 'Vendor A' }] });
    evaluationCriteriaApi.fetchCriteria.mockResolvedValue(criteriaResponse);
    evaluationApi.fetchCompletedEvaluations.mockResolvedValue({ data: [] });
  });

  it('shows an in-progress evaluation for the selected tender and allows continuing it', async () => {
    tenderApi.getTender.mockResolvedValue(tender1);
    evaluationApi.fetchEvaluationsForTender.mockResolvedValue({ data: [{ id: 10, status: 'processing', evaluation_date: null }] });
    evaluationApi.fetchEvaluation.mockResolvedValue({
      id: 10,
      tender_id: 1,
      tender_ref_no: 'TC-1',
      vendor_name: 'Vendor A',
      status: 'processing',
      price_score: null,
      quality_score: null,
      pqm_score: null,
      evaluation_date: null,
      evaluated_by: 5,
      criterion_scores: [
        { evaluation_criteria_id: 1, criteria_name: 'Price', category: 'price', weight_percentage: 60, staff_score: null, weighted_score: null, remarks: null },
        { evaluation_criteria_id: 2, criteria_name: 'Quality', category: 'quality', weight_percentage: 40, staff_score: null, weighted_score: null, remarks: null },
      ],
    });

    renderComponent('/evaluations?tenderId=1');

    expect(await screen.findByText('Tender summary')).toBeInTheDocument();
    expect(await screen.findByText('An evaluation is already in progress for this tender.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue Evaluation' }));

    expect(await screen.findByText('Tender Evaluation')).toBeInTheDocument();

    // Previous evaluations table shows the attempt ("Evaluator #5" also appears
    // in the tender summary card and workspace panel, so scope to the row).
    const attemptRow = screen.getByText('#10').closest('tr');
    expect(within(attemptRow).getByText('Evaluator #5')).toBeInTheDocument();
  });

  it('lets an evaluator create a new evaluation once readiness checks pass', async () => {
    tenderApi.getTender.mockResolvedValue(tender1);
    evaluationApi.fetchEvaluationsForTender.mockResolvedValue({ data: [] });
    evaluationApi.createEvaluationFromTender.mockResolvedValue({ id: 20, status: 'processing' });

    renderComponent('/evaluations?tenderId=1');

    expect(await screen.findByText('READY TO EVALUATE')).toBeInTheDocument();

    const createButton = screen.getByRole('button', { name: 'Create Evaluation' });
    expect(createButton).not.toBeDisabled();
    fireEvent.click(createButton);

    expect(await screen.findByText(/Create an evaluation for TC-1 - Vendor A\?/)).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole('button', { name: 'Create Evaluation' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(evaluationApi.createEvaluationFromTender).toHaveBeenCalledWith(1);
    });
    expect(await screen.findByText('Evaluation created successfully.')).toBeInTheDocument();
  });

  it('disables evaluation creation for a role that cannot create evaluations', async () => {
    useAuth.mockReturnValue({ role: 'management' });
    tenderApi.getTender.mockResolvedValue(tender1);
    evaluationApi.fetchEvaluationsForTender.mockResolvedValue({ data: [] });

    renderComponent('/evaluations?tenderId=1');

    const createButton = await screen.findByRole('button', { name: 'Create Evaluation' });
    expect(createButton).toBeDisabled();
    expect(screen.getByText('Only evaluators can create an evaluation.')).toBeInTheDocument();
  });

  it('renders the completed evaluations comparison table', async () => {
    evaluationApi.fetchCompletedEvaluations.mockResolvedValue({
      data: [
        { id: 30, tender_ref_no: 'TC-2', vendor_name: 'Vendor B', status: 'approved', price_score: 50, quality_score: 30, pqm_score: 80, evaluation_date: '2026-02-01' },
      ],
    });

    renderComponent('/evaluations');

    expect(await screen.findByText('TC-2 - Vendor B')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });
});
