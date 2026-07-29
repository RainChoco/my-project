import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import ContractListPage from '../../src/features/contracts/pages/ContractListPage';
import * as contractApi from '../../src/features/contracts/services/contractApi';
import { useAuth } from '../../src/context';

vi.mock('../../src/features/contracts/services/contractApi', () => ({
  fetchContracts: vi.fn(),
  deleteContract: vi.fn(),
}));
vi.mock('../../src/context');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ContractListPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ContractListPage (Kai Xuan)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ role: 'admin' });
    contractApi.fetchContracts.mockResolvedValue([
      { id: 'CTR-1', name: 'Contract 1', category: 'Cleaning', status: 'Open', budgetLimit: '1000', tenders: [] }
    ]);
  });

  it('renders the contract list successfully', async () => {
    renderComponent();
    expect(await screen.findByText('Contract Opportunities')).toBeInTheDocument();
    expect(await screen.findByText('Contract 1')).toBeInTheDocument();
  });

  it('filters contracts by search term', async () => {
    renderComponent();
    const searchInput = await screen.findByPlaceholderText(/Search/i);
    
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Contract 1')).not.toBeInTheDocument();
    });
  });
});
