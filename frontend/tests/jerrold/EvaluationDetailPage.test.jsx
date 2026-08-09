import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EvaluationDetailPage from '../../src/features/evaluations/pages/EvaluationDetailPage';
import * as evaluationApi from '../../src/features/evaluations/services/evaluationApi';
import { useAuth } from '../../src/context';

vi.mock('../../src/features/evaluations/services/evaluationApi', () => ({
  fetchEvaluation: vi.fn(),
  saveDraftScores: vi.fn(),
  submitEvaluation: vi.fn(),
  reprocessEvaluation: vi.fn(),
}));
vi.mock('../../src/context');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const renderComponent = (id = 10) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/evaluations/${id}`]}>
        <Routes>
          <Route path="/evaluations/:id" element={<EvaluationDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const processingEvaluation = {
  id: 10,
  tender_id: 1,
  tender_ref_no: 'TC-1',
  vendor_name: 'Vendor A',
  status: 'processing',
  price_score: null,
  quality_score: null,
  pqm_score: null,
  evaluation_date: null,
  criterion_scores: [
    { evaluation_criteria_id: 1, criteria_name: 'Price', category: 'price', weight_percentage: 60, staff_score: null, weighted_score: null, remarks: null },
    { evaluation_criteria_id: 2, criteria_name: 'Quality', category: 'quality', weight_percentage: 40, staff_score: null, weighted_score: null, remarks: null },
  ],
};

describe('EvaluationDetailPage (Jerrold - Scope B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('lets an evaluator score every criterion and submit the evaluation', async () => {
    useAuth.mockReturnValue({ role: 'evaluator' });
    evaluationApi.fetchEvaluation.mockResolvedValue(processingEvaluation);
    evaluationApi.saveDraftScores.mockResolvedValue({ ...processingEvaluation });
    evaluationApi.submitEvaluation.mockResolvedValue({ id: 10, status: 'scored', pqm_score: 84 });

    renderComponent(10);

    const scoreInputs = await screen.findAllByRole('spinbutton');
    expect(scoreInputs).toHaveLength(2);
    fireEvent.change(scoreInputs[0], { target: { value: '80' } });
    fireEvent.change(scoreInputs[1], { target: { value: '90' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit evaluation' }));

    await waitFor(() => {
      expect(evaluationApi.saveDraftScores).toHaveBeenCalledWith(
        '10',
        expect.arrayContaining([
          expect.objectContaining({ evaluation_criteria_id: 1, staff_score: 80 }),
          expect.objectContaining({ evaluation_criteria_id: 2, staff_score: 90 }),
        ])
      );
      expect(evaluationApi.submitEvaluation).toHaveBeenCalledWith('10');
    });
    expect(await screen.findByText('Submitted - PQM score 84.')).toBeInTheDocument();
  });

  it('saves a draft without requiring every criterion to be scored', async () => {
    useAuth.mockReturnValue({ role: 'evaluator' });
    evaluationApi.fetchEvaluation.mockResolvedValue(processingEvaluation);
    evaluationApi.saveDraftScores.mockResolvedValue({ ...processingEvaluation });

    renderComponent(10);

    const scoreInputs = await screen.findAllByRole('spinbutton');
    fireEvent.change(scoreInputs[0], { target: { value: '80' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => {
      expect(evaluationApi.saveDraftScores).toHaveBeenCalled();
    });
    expect(await screen.findByText('Draft scores saved.')).toBeInTheDocument();
    expect(evaluationApi.submitEvaluation).not.toHaveBeenCalled();
  });

  it('blocks submission client-side while a criterion is still unscored', async () => {
    useAuth.mockReturnValue({ role: 'evaluator' });
    evaluationApi.fetchEvaluation.mockResolvedValue(processingEvaluation);

    renderComponent(10);

    const scoreInputs = await screen.findAllByRole('spinbutton');
    fireEvent.change(scoreInputs[0], { target: { value: '80' } });
    // Leave the Quality score empty.

    fireEvent.click(screen.getByRole('button', { name: 'Submit evaluation' }));

    expect(await screen.findByText('Still need a score for: Quality.')).toBeInTheDocument();
    expect(evaluationApi.submitEvaluation).not.toHaveBeenCalled();
  });

  it('renders a read-only scores table once scoring is not permitted', async () => {
    useAuth.mockReturnValue({ role: 'management' });
    evaluationApi.fetchEvaluation.mockResolvedValue({
      ...processingEvaluation,
      status: 'scored',
      criterion_scores: processingEvaluation.criterion_scores.map((c) => ({ ...c, staff_score: 80, weighted_score: 48 })),
    });

    renderComponent(10);

    await screen.findByText('Price');
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Submit evaluation' })).not.toBeInTheDocument();
  });

  it('lets an evaluator re-evaluate a rejected evaluation', async () => {
    useAuth.mockReturnValue({ role: 'evaluator' });
    evaluationApi.fetchEvaluation.mockResolvedValue({ ...processingEvaluation, status: 'rejected' });
    evaluationApi.reprocessEvaluation.mockResolvedValue({ id: 40, status: 'processing' });

    renderComponent(10);

    const reEvaluateButton = await screen.findByRole('button', { name: 'Re-evaluate' });
    fireEvent.click(reEvaluateButton);

    expect(await screen.findByText('Re-evaluate this tender?')).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole('button', { name: 'Re-evaluate' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(evaluationApi.reprocessEvaluation).toHaveBeenCalledWith('10');
    });
  });

  it('does not offer re-evaluation to a non-evaluator role even on a rejected evaluation', async () => {
    useAuth.mockReturnValue({ role: 'management' });
    evaluationApi.fetchEvaluation.mockResolvedValue({ ...processingEvaluation, status: 'rejected' });

    renderComponent(10);

    await screen.findByText('Price');
    expect(screen.queryByRole('button', { name: 'Re-evaluate' })).not.toBeInTheDocument();
  });
});
