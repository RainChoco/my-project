import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import EvaluationCriteriaPage from '../../src/features/evaluations/pages/EvaluationCriteriaPage';
import * as evaluationCriteriaApi from '../../src/features/evaluations/services/evaluationCriteriaApi';
import * as contractApi from '../../src/features/contracts/services/contractApi';
import { useAuth } from '../../src/context';

vi.mock('../../src/features/evaluations/services/evaluationCriteriaApi', () => ({
  fetchCriteria: vi.fn(),
  createCriterion: vi.fn(),
  updateCriterion: vi.fn(),
  deactivateCriterion: vi.fn(),
  reactivateCriterion: vi.fn(),
  deleteCriterionPermanently: vi.fn(),
  previewDuplicateCleanup: vi.fn(),
  runDuplicateCleanup: vi.fn(),
}));
vi.mock('../../src/features/contracts/services/contractApi', () => ({
  fetchContracts: vi.fn(),
}));
vi.mock('../../src/context');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <EvaluationCriteriaPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('EvaluationCriteriaPage (Jerrold - Scope B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    useAuth.mockReturnValue({ role: 'ma_staff' });
    contractApi.fetchContracts.mockResolvedValue([]);
  });

  it('renders the criteria table and summary cards', async () => {
    evaluationCriteriaApi.fetchCriteria.mockResolvedValue({
      data: [
        { id: 1, criteria_name: 'Price Competitiveness', category: 'price', weight_percentage: 60, is_active: true, is_used: true, description: 'Price desc', is_duplicate_name: false },
        { id: 2, criteria_name: 'Technical Quality', category: 'quality', weight_percentage: 40, is_active: true, is_used: false, description: 'Quality desc', is_duplicate_name: false },
      ],
      active_weight_total: 100,
    });

    renderComponent();

    expect(await screen.findByText('Price Competitiveness')).toBeInTheDocument();
    expect(await screen.findByText('Technical Quality')).toBeInTheDocument();
    expect(screen.getByText('Total Criteria')).toBeInTheDocument();
    // Active Weight Total summary card
    expect(screen.getByText('100%')).toBeInTheDocument();
    // Readiness at exactly 100%
    expect(screen.getByText('Ready for Evaluation')).toBeInTheDocument();
  });

  it('shows "Not Ready" when active weights do not total 100%', async () => {
    evaluationCriteriaApi.fetchCriteria.mockResolvedValue({
      data: [
        { id: 1, criteria_name: 'Price Competitiveness', category: 'price', weight_percentage: 60, is_active: true, is_used: false, description: 'Price desc', is_duplicate_name: false },
      ],
      active_weight_total: 60,
    });

    renderComponent();

    expect(await screen.findByText('Price Competitiveness')).toBeInTheDocument();
    expect(screen.getByText('Not Ready')).toBeInTheDocument();
  });

  it('creates a new criterion from a quick-add suggestion and shows a success message', async () => {
    // No active criteria yet, so the "Common Evaluation Templates" suggestions render.
    evaluationCriteriaApi.fetchCriteria.mockResolvedValue({ data: [], active_weight_total: 0 });
    evaluationCriteriaApi.createCriterion.mockResolvedValue({
      id: 10,
      criteria_name: 'Price Competitiveness',
      category: 'price',
      weight_percentage: 60,
      is_active: true,
      description: 'Checks whether the submitted price is reasonable and competitive.',
    });

    renderComponent();

    const suggestionHeading = await screen.findByText('Price Competitiveness');
    const card = suggestionHeading.closest('.rounded-lg');
    fireEvent.click(within(card).getByText('Use this'));

    expect(await screen.findByText('Add evaluation criterion')).toBeInTheDocument();

    const weightInput = screen.getByLabelText('Weight percentage');
    fireEvent.change(weightInput, { target: { value: '60' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(evaluationCriteriaApi.createCriterion).toHaveBeenCalled();
    });
    expect(evaluationCriteriaApi.createCriterion.mock.calls[0][0]).toEqual(
      expect.objectContaining({ criteria_name: 'Price Competitiveness', category: 'price', weight_percentage: 60 })
    );

    expect(await screen.findByText('"Price Competitiveness" was added.')).toBeInTheDocument();
    expect(screen.queryByText('Add evaluation criterion')).not.toBeInTheDocument();
  });

  it('prompts to reuse the existing criterion when creation is rejected as a duplicate', async () => {
    evaluationCriteriaApi.fetchCriteria.mockResolvedValue({ data: [], active_weight_total: 0 });
    evaluationCriteriaApi.createCriterion.mockRejectedValue({
      response: {
        data: {
          error: 'duplicate_criterion_name',
          existing_criterion: { id: 99, criteria_name: 'Price Competitiveness', is_active: true },
        },
      },
    });

    renderComponent();

    const suggestionHeading = await screen.findByText('Price Competitiveness');
    const card = suggestionHeading.closest('.rounded-lg');
    fireEvent.click(within(card).getByText('Use this'));

    fireEvent.change(screen.getByLabelText('Weight percentage'), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Criterion already exists')).toBeInTheDocument();
    expect(screen.getByText(/A criterion named 'Price Competitiveness' already exists/)).toBeInTheDocument();
  });

  it('deactivates an active criterion after confirmation', async () => {
    evaluationCriteriaApi.fetchCriteria.mockResolvedValue({
      data: [
        { id: 1, criteria_name: 'Price Competitiveness', category: 'price', weight_percentage: 60, is_active: true, is_used: true, description: 'Price desc', is_duplicate_name: false },
        { id: 2, criteria_name: 'Technical Quality', category: 'quality', weight_percentage: 40, is_active: true, is_used: false, description: 'Quality desc', is_duplicate_name: false },
      ],
      active_weight_total: 100,
    });
    evaluationCriteriaApi.deactivateCriterion.mockResolvedValue({ id: 1, is_active: false });

    renderComponent();

    await screen.findByText('Price Competitiveness');
    const row = screen.getByText('Price Competitiveness').closest('tr');
    fireEvent.click(within(row).getByRole('button', { name: 'Deactivate' }));

    expect(await screen.findByText('Deactivate "Price Competitiveness"?')).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole('button', { name: 'Deactivate' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(evaluationCriteriaApi.deactivateCriterion).toHaveBeenCalled();
    });
    expect(evaluationCriteriaApi.deactivateCriterion.mock.calls[0][0]).toBe(1);
    expect(await screen.findByText('Criterion deactivated.')).toBeInTheDocument();
  });

  it('blocks permanent deletion in the UI for a criterion that is already in use', async () => {
    evaluationCriteriaApi.fetchCriteria.mockResolvedValue({
      data: [
        { id: 1, criteria_name: 'Price Competitiveness', category: 'price', weight_percentage: 60, is_active: true, is_used: true, description: 'Price desc', is_duplicate_name: false },
      ],
      active_weight_total: 60,
    });

    renderComponent();

    await screen.findByText('Price Competitiveness');
    const row = screen.getByText('Price Competitiveness').closest('tr');
    expect(within(row).getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('permanently deletes an unused criterion after confirmation', async () => {
    evaluationCriteriaApi.fetchCriteria.mockResolvedValue({
      data: [
        { id: 2, criteria_name: 'Technical Quality', category: 'quality', weight_percentage: 40, is_active: true, is_used: false, description: 'Quality desc', is_duplicate_name: false },
      ],
      active_weight_total: 40,
    });
    evaluationCriteriaApi.deleteCriterionPermanently.mockResolvedValue({ id: 2, criteria_name: 'Technical Quality' });

    renderComponent();

    await screen.findByText('Technical Quality');
    const row = screen.getByText('Technical Quality').closest('tr');
    fireEvent.click(within(row).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Delete criterion?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Criterion' }));

    await waitFor(() => {
      expect(evaluationCriteriaApi.deleteCriterionPermanently).toHaveBeenCalled();
    });
    expect(evaluationCriteriaApi.deleteCriterionPermanently.mock.calls[0][0]).toBe(2);
    expect(await screen.findByText('"Technical Quality" was permanently deleted.')).toBeInTheDocument();
  });
});
