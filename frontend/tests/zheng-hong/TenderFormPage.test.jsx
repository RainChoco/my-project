import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import TenderFormPage from '../../src/features/tenders/pages/TenderFormPage';
import * as tenderApi from '../../src/features/tenders/services/tenderApi';
import * as contractApi from '../../src/features/contracts/services/contractApi';

vi.mock('../../src/features/tenders/services/tenderApi', () => ({
  createTender: vi.fn(),
  updateTender: vi.fn(),
  getTender: vi.fn(),
  uploadTenderImage: vi.fn(),
  listTenders: vi.fn(),
}));
vi.mock('../../src/features/contracts/services/contractApi', () => ({
  fetchContracts: vi.fn(),
}));

const CONTRACTS = [
  { id: 'CTR-001', name: 'Estate Cleaning FY26', status: 'Open', closingDate: '2026-12-31' },
];

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const renderPage = (mode = 'create') =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/tenders/new']}>
        <TenderFormPage mode={mode} />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe('TenderFormPage (Zheng Hong)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    contractApi.fetchContracts.mockResolvedValue(CONTRACTS);
    tenderApi.listTenders.mockResolvedValue({ data: [], pagination: { page: 1, limit: 100, total: 0 } });
  });

  it('shows the entry-mode selection screen first, then the manual form on request', async () => {
    renderPage();

    expect(await screen.findByText("Choose how you'd like to log this tender.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /New Tender Submission/i }));

    expect(await screen.findByLabelText(/Vendor Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contract Opportunity/i)).toBeInTheDocument();
  });

  it('blocks submission with validation errors when required fields are missing', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /New Tender Submission/i }));

    const vendorInput = await screen.findByLabelText(/Vendor Name/i);
    fireEvent.blur(vendorInput);

    await waitFor(() => expect(screen.getByText('Vendor name is required')).toBeInTheDocument());
    expect(tenderApi.createTender).not.toHaveBeenCalled();
  });

  it('submits a valid tender and creates it against the selected contract', async () => {
    tenderApi.createTender.mockResolvedValue({ id: 42, tender_ref_no: 'TC-2026-001' });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /New Tender Submission/i }));

    fireEvent.change(await screen.findByLabelText(/Contract Opportunity/i), { target: { value: 'CTR-001' } });
    fireEvent.change(screen.getByLabelText(/Vendor Name/i), { target: { value: 'Acme Facilities' } });
    fireEvent.change(screen.getByLabelText(/Submission Date/i), { target: { value: '2026-01-05' } });
    fireEvent.change(screen.getByLabelText(/Main Offer Price/i), { target: { value: '800000' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save Tender' }));

    await waitFor(() => expect(tenderApi.createTender).toHaveBeenCalledTimes(1));
    const payload = tenderApi.createTender.mock.calls[0][0];
    expect(payload.contractId).toBe('CTR-001');
    expect(payload.vendor_name).toBe('Acme Facilities');
    expect(payload.main_offer_price).toBe(800000);
  });

  it('disables submission while the selected contract is blocked from new tenders (e.g. Closed)', async () => {
    contractApi.fetchContracts.mockResolvedValue([{ id: 'CTR-002', name: 'Closed Contract', status: 'Closed', closingDate: '2026-01-01' }]);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /New Tender Submission/i }));

    fireEvent.change(await screen.findByLabelText(/Contract Opportunity/i), { target: { value: 'CTR-002' } });

    expect(await screen.findByText(/Tender submission is not allowed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Tender' })).toBeDisabled();
  });

  it('surfaces the server error and highlights tender_ref_no on a duplicate-reference 409', async () => {
    tenderApi.createTender.mockRejectedValue({
      response: { status: 409, data: { message: 'tender_ref_no already exists' } },
    });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /New Tender Submission/i }));

    fireEvent.change(await screen.findByLabelText(/Contract Opportunity/i), { target: { value: 'CTR-001' } });
    fireEvent.change(screen.getByLabelText(/Vendor Name/i), { target: { value: 'Acme Facilities' } });
    fireEvent.change(screen.getByLabelText(/Submission Date/i), { target: { value: '2026-01-05' } });
    fireEvent.change(screen.getByLabelText(/Main Offer Price/i), { target: { value: '800000' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save Tender' }));

    await waitFor(() => expect(screen.getAllByText('tender_ref_no already exists').length).toBeGreaterThan(0));
  });
});
