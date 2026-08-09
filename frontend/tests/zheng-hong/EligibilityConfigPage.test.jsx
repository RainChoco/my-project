import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EligibilityConfigPage from '../../src/features/tenders/pages/EligibilityConfigPage';
import * as tenderApi from '../../src/features/tenders/services/tenderApi';

vi.mock('../../src/features/tenders/services/tenderApi', () => ({
  listBcaGradeLimits: vi.fn(),
  updateBcaGradeLimit: vi.fn(),
  listEligibilityThresholds: vi.fn(),
  updateEligibilityThreshold: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const renderPage = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <EligibilityConfigPage />
    </QueryClientProvider>
  );

const GRADE_LIMITS = [
  { grade: 'L1', max_tender_value: '1500000.00' },
  { grade: 'L2', max_tender_value: '6000000.00' },
  { grade: 'L3', max_tender_value: '16000000.00' },
  { grade: 'L4', max_tender_value: '40000000.00' },
  { grade: 'L5', max_tender_value: '85000000.00' },
  { grade: 'L6', max_tender_value: null },
];
const THRESHOLDS = [
  { criterion_key: 'min_paid_up_capital', threshold_value: '2000000.00' },
  { criterion_key: 'min_bizsafe_level', threshold_value: '3' },
];

describe('EligibilityConfigPage (Zheng Hong)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    tenderApi.listBcaGradeLimits.mockResolvedValue(GRADE_LIMITS);
    tenderApi.listEligibilityThresholds.mockResolvedValue(THRESHOLDS);
  });

  it('renders the loaded BCA grade limits and compliance thresholds', async () => {
    renderPage();

    expect(await screen.findByText('Eligibility Configuration')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimum Paid-Up Capital (SGD)')).toHaveValue(2000000);
    // L6 has no ceiling (null max_tender_value) - its input is disabled and the
    // 'No limit' checkbox is checked.
    const l6Row = screen.getByText('L6').closest('tr');
    expect(l6Row.querySelector('input[type="checkbox"]')).toBeChecked();
  });

  it('shows an error state when the configuration fails to load', async () => {
    tenderApi.listBcaGradeLimits.mockRejectedValue(new Error('network error'));
    renderPage();

    expect(await screen.findByText(/Failed to load eligibility configuration/i)).toBeInTheDocument();
  });

  it('saves an updated minimum paid-up capital threshold', async () => {
    tenderApi.updateEligibilityThreshold.mockResolvedValue({ criterion_key: 'min_paid_up_capital', threshold_value: 2500000 });
    renderPage();

    const capitalInput = await screen.findByLabelText('Minimum Paid-Up Capital (SGD)');
    fireEvent.change(capitalInput, { target: { value: '2500000' } });

    const saveButton = screen.getByRole('button', { name: 'Save Rules' });
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(tenderApi.updateEligibilityThreshold).toHaveBeenCalledWith('min_paid_up_capital', { threshold_value: 2500000 })
    );
    // Unrelated BCA grade limits weren't touched since nothing about them changed.
    expect(tenderApi.updateBcaGradeLimit).not.toHaveBeenCalled();
  });

  it('resets the form back to the standard defaults when confirmed', async () => {
    renderPage();

    const capitalInput = await screen.findByLabelText('Minimum Paid-Up Capital (SGD)');
    fireEvent.change(capitalInput, { target: { value: '999' } });
    expect(capitalInput).toHaveValue(999);

    fireEvent.click(screen.getByRole('button', { name: 'Reset to Standard Rules' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Reset' }));

    await waitFor(() => expect(capitalInput).toHaveValue(2000000));
  });
});
