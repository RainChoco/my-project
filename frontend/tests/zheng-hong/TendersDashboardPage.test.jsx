import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import TendersDashboardPage from '../../src/features/tenders/pages/TendersDashboardPage';
import * as tenderApi from '../../src/features/tenders/services/tenderApi';
import * as contractApi from '../../src/features/contracts/services/contractApi';
import { useAuth } from '../../src/context';

// tenderApi: the page's own service module (list/delete). contractApi: a sibling
// feature's module pulled in transitively by TenderFilters (contract dropdown) -
// mocked here too so the filter row doesn't make a real network call.
vi.mock('../../src/features/tenders/services/tenderApi', () => ({
  listTenders: vi.fn(),
  deleteTender: vi.fn(),
}));
vi.mock('../../src/features/contracts/services/contractApi', () => ({
  fetchContracts: vi.fn(),
}));
vi.mock('../../src/context');

// Recharts' ResponsiveContainer needs real layout dimensions it doesn't get in
// jsdom - stub the stats/chart panel out so it can't make this test flaky.
vi.mock('../../src/features/tenders/components/TenderStatsOverview', () => ({
  default: () => <div data-testid="tender-stats-overview" />,
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const renderPage = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TendersDashboardPage />
      </BrowserRouter>
    </QueryClientProvider>
  );

const SAMPLE_TENDERS = {
  data: [
    {
      id: 1,
      tender_ref_no: 'TC-2026-001',
      vendor_name: 'Acme Facilities',
      submission_date: '2026-01-05',
      main_offer_price: '800000.00',
      status: 'submitted',
      eligibility_status: 'eligible',
    },
    {
      id: 2,
      tender_ref_no: 'TC-2026-002',
      vendor_name: 'Beta Estate Co',
      submission_date: '2026-01-06',
      main_offer_price: '650000.00',
      status: 'draft',
      eligibility_status: 'pending',
    },
  ],
  pagination: { page: 1, limit: 20, total: 2 },
};

describe('TendersDashboardPage (Zheng Hong)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    contractApi.fetchContracts.mockResolvedValue([]);
    tenderApi.listTenders.mockResolvedValue(SAMPLE_TENDERS);
  });

  it('renders the tender list for an ma_staff user, including the create button', async () => {
    useAuth.mockReturnValue({ role: 'ma_staff' });
    renderPage();

    expect(await screen.findByText('Tender Management')).toBeInTheDocument();
    expect(await screen.findByText('TC-2026-001')).toBeInTheDocument();
    expect(screen.getByText('TC-2026-002')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Tender Submission/i })).toBeInTheDocument();
  });

  it('hides management actions and the create button for a non ma_staff role', async () => {
    useAuth.mockReturnValue({ role: 'evaluator' });
    renderPage();

    await screen.findByText('TC-2026-001');
    expect(screen.queryByRole('button', { name: /New Tender Submission/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    // View is still available to everyone.
    expect(screen.getAllByRole('button', { name: 'View' }).length).toBe(2);
  });

  it('shows an empty state when there are no tenders on record', async () => {
    useAuth.mockReturnValue({ role: 'ma_staff' });
    tenderApi.listTenders.mockResolvedValue({ data: [], pagination: { page: 1, limit: 20, total: 0 } });
    renderPage();

    expect(await screen.findByText('No tenders match the current filters.')).toBeInTheDocument();
  });

  it('surfaces an error alert when the tender list fails to load', async () => {
    useAuth.mockReturnValue({ role: 'ma_staff' });
    tenderApi.listTenders.mockRejectedValue({ response: { data: { message: 'Server exploded' } } });
    renderPage();

    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
  });

  it('deletes a tender after confirming in the dialog', async () => {
    useAuth.mockReturnValue({ role: 'ma_staff' });
    tenderApi.deleteTender.mockResolvedValue();
    renderPage();

    await screen.findByText('TC-2026-001');
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    expect(await screen.findByText(/permanently delete/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: 'Delete tender' });
    fireEvent.click(confirmButton);

    await waitFor(() => expect(tenderApi.deleteTender).toHaveBeenCalledWith(1));
  });

  it('disables Delete for a tender whose status locks it (e.g. approved)', async () => {
    useAuth.mockReturnValue({ role: 'ma_staff' });
    tenderApi.listTenders.mockResolvedValue({
      data: [
        {
          id: 3,
          tender_ref_no: 'TC-2026-003',
          vendor_name: 'Locked Vendor',
          submission_date: '2026-01-07',
          main_offer_price: '400000.00',
          status: 'approved',
          eligibility_status: 'eligible',
        },
      ],
      pagination: { page: 1, limit: 20, total: 1 },
    });
    renderPage();

    await screen.findByText('TC-2026-003');
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });
});
