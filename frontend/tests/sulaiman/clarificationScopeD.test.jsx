/** @vitest-environment jsdom */
// Sulaiman - Scope D: Alternate Proposal Communication / Clarifications
// (design/sulaiman/use-cases.md UC-D1 detection entry point, UC-D6 list & filter).
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}));
vi.mock('@/context', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../../src/features/clarifications/services/clarificationApi', () => ({
  listClarificationLogs: vi.fn(),
  detectDeviation: vi.fn(),
}));

import ClarificationLogsPage from '../../src/features/clarifications/pages/ClarificationLogsPage';
import { useAuth } from '@/context';
import { listClarificationLogs, detectDeviation } from '../../src/features/clarifications/services/clarificationApi';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const renderPage = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <ClarificationLogsPage />
    </QueryClientProvider>
  );

const LOGS_RESPONSE = {
  data: [
    {
      id: 1,
      tender_id: 7,
      tender_ref_no: 'TC-D-001',
      vendor_name: 'Vendor Flagged Pte Ltd',
      log_type: 'pricing_deviation',
      status: 'flagged',
      deviation_percentage: 6,
      follow_up_due_at: null,
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ],
  pagination: { page: 1, limit: 20, total: 1 },
};

describe('ClarificationLogsPage (Sulaiman - Scope D)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('lists clarification logs with deviation and status, and hides Detect deviation for a non ma_staff role (UC-D6)', async () => {
    useAuth.mockReturnValue({ role: 'vendor_liaison' });
    listClarificationLogs.mockResolvedValue(LOGS_RESPONSE);

    renderPage();

    expect(await screen.findByText('TC-D-001')).toBeInTheDocument();
    expect(screen.getByText('Vendor Flagged Pte Ltd')).toBeInTheDocument();
    expect(screen.getByText('6%')).toBeInTheDocument();
    expect(screen.getByText('Flagged')).toBeInTheDocument();
    expect(screen.getByText('Pricing Deviation')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /detect deviation/i })).not.toBeInTheDocument();
  });

  it('lets ma_staff run deviation detection from the list and opens the resulting log (UC-D1)', async () => {
    useAuth.mockReturnValue({ role: 'ma_staff' });
    listClarificationLogs.mockResolvedValue({ data: [], pagination: { page: 1, limit: 20, total: 0 } });
    detectDeviation.mockResolvedValue({ id: 42, tender_id: 7, status: 'flagged' });

    renderPage();
    const user = userEvent.setup();

    expect(await screen.findByText('No logs match the current filter.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /detect deviation/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Detect pricing deviation')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Tender ID'), '7');
    await user.click(within(dialog).getByRole('button', { name: 'Run detection' }));

    await waitFor(() => expect(detectDeviation).toHaveBeenCalledWith(7));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/clarifications/42'));
  });

  it('filters by tender id and shows the adjust-filters hint, then clears back to the full list (edge case)', async () => {
    useAuth.mockReturnValue({ role: 'vendor_liaison' });
    listClarificationLogs
      .mockResolvedValueOnce(LOGS_RESPONSE)
      .mockResolvedValueOnce({ data: [], pagination: { page: 1, limit: 20, total: 0 } })
      .mockResolvedValueOnce(LOGS_RESPONSE);

    renderPage();

    expect(await screen.findByText('TC-D-001')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Tender ID'), { target: { value: '999' } });

    await waitFor(() =>
      expect(screen.getByText('No logs match the current filter. Adjust or clear the filters above to see more.')).toBeInTheDocument()
    );
    expect(listClarificationLogs).toHaveBeenLastCalledWith(expect.objectContaining({ tender_id: 999 }));

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => expect(screen.getByText('TC-D-001')).toBeInTheDocument());
    const lastCallParams = listClarificationLogs.mock.calls[listClarificationLogs.mock.calls.length - 1][0];
    expect(lastCallParams).not.toHaveProperty('tender_id');
  });
});
