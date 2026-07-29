import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../../src/features/dashboard/pages/DashboardPage';
import { fetchContracts } from '../../src/features/contracts/services/contractApi';
import { fetchKPIs, fetchRankings, archiveRankings } from '../../src/features/dashboard/services/dashboardApi';
import useDashboardFilters from '../../src/features/dashboard/hooks/useDashboardFilters';

vi.mock('../../src/features/contracts/services/contractApi');
vi.mock('../../src/features/dashboard/services/dashboardApi');
vi.mock('../../src/features/dashboard/hooks/useDashboardFilters');

// Mock child components that might use heavy libraries like Recharts
vi.mock('../../src/features/dashboard/charts/TrendChart', () => ({ default: () => <div data-testid='trend-chart' /> }));
vi.mock('../../src/features/dashboard/charts/CategoryChart', () => ({ default: () => <div data-testid='cat-chart' /> }));
vi.mock('../../src/features/dashboard/charts/RiskChart', () => ({ default: () => <div data-testid='risk-chart' /> }));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>
  );
};

describe('DashboardPage (Kai Xuan)', () => {
  let mockUpdateFilter;
  const mockRankingData = [{ 
    tenderId: '1', 
    tenderRefNo: 'REF-123',
    supplierName: 'Test Vendor', 
    category: 'Cleaning',
    status: 'Awarded',
    pqmScore: 85, 
    riskLevel: 'Low',
    rank: 1
  }];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateFilter = vi.fn();
    useDashboardFilters.mockReturnValue({
      filters: { contractId: '' },
      updateFilter: mockUpdateFilter,
    });
    fetchContracts.mockResolvedValue([
      { id: 'CTR-1', name: 'Contract 1' },
    ]);
  });

  it('renders EmptyState when no contract is selected', async () => {
    renderComponent();
    expect(await screen.findByText(/Strategic Rankings Dashboard/i)).toBeInTheDocument();
    expect(await screen.findByText(/Please select a Contract Opportunity above/i)).toBeInTheDocument();
  });

  it('fetches and displays KPIs when a contract is selected', async () => {
    useDashboardFilters.mockReturnValue({
      filters: { contractId: 'CTR-1' },
      updateFilter: mockUpdateFilter,
    });
    
    fetchKPIs.mockResolvedValue({
      totalTenders: 10,
      averagePQM: 85.5,
      highRiskTenders: 2,
      recentSubmissions: 5
    });
    
    fetchRankings.mockResolvedValue({
      data: mockRankingData,
      pagination: { totalPages: 1, currentPage: 1 }
    });

    renderComponent();
    
    expect(await screen.findByText('Total Tenders')).toBeInTheDocument();
    expect(await screen.findByText('10')).toBeInTheDocument();
    expect(await screen.findByText('Average PQM Score')).toBeInTheDocument();
    expect(await screen.findByText('85.5')).toBeInTheDocument();
  });

  it('triggers archive mutation', async () => {
    useDashboardFilters.mockReturnValue({
      filters: { contractId: 'CTR-1' },
      updateFilter: mockUpdateFilter,
    });
    
    fetchKPIs.mockResolvedValue({ totalTenders: 10, averagePQM: 85.5, highRiskTenders: 2, recentSubmissions: 5 });
    fetchRankings.mockResolvedValue({
      data: mockRankingData,
      pagination: { totalPages: 1, currentPage: 1 }
    });
    archiveRankings.mockResolvedValue({});

    renderComponent();
    
    const archiveBtn = await screen.findByText(/Archive Final Rankings/i);
    expect(archiveBtn).not.toBeDisabled();
    
    fireEvent.click(archiveBtn);
    
    const confirmBtn = await screen.findByRole('button', { name: /Confirm Archive/i });
    fireEvent.click(confirmBtn);
    
    await waitFor(() => {
      expect(archiveRankings).toHaveBeenCalledWith('CTR-1', expect.any(String));
    });
  });
});
