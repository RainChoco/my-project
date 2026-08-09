/** @vitest-environment jsdom */
// Calista - Scope C: AI Board Paper & Proposal Generation (design/calista/use-cases.md UC1).
// Mirrors the Radix Select workaround already used elsewhere in this suite (jsdom lacks
// PointerEvent capture / scrollIntoView, both of which Radix's Select popup needs).
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));
vi.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));
vi.mock('../../src/features/board-papers/services/boardPaperApi', () => ({
  generateBoardPaper: vi.fn(),
}));
vi.mock('../../src/features/tenders/services/tenderApi', () => ({
  listTenders: vi.fn(),
}));

import BoardPaperPage from '../../src/features/board-papers/pages/BoardPaperPage';
import { generateBoardPaper } from '../../src/features/board-papers/services/boardPaperApi';
import { listTenders } from '../../src/features/tenders/services/tenderApi';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderPage = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <BoardPaperPage />
    </QueryClientProvider>
  );

describe('BoardPaperPage (Calista - Scope C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    window.HTMLElement.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    listTenders.mockResolvedValue({
      data: [{ id: 7, tender_ref_no: 'TC-CALISTA-001', vendor_name: 'Calista Eligible Vendor' }],
    });
  });

  it('blocks generation and lists every missing field when nothing has been filled in (edge case)', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Generate Board Paper' }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Please complete all required fields',
          description: 'Tender, Board Paper Title, Purpose, Prepared By',
          variant: 'destructive',
        })
      );
    });
    expect(generateBoardPaper).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('selects a tender, auto-fills the title, and generates the board paper (UC1 main flow)', async () => {
    generateBoardPaper.mockResolvedValue({
      report: { id: 55, tenderId: 7, title: 'Board Paper - TC-CALISTA-001', confidence: 82 },
    });

    renderPage();
    const user = userEvent.setup();

    const [tenderSelect, purposeSelect] = await screen.findAllByRole('combobox');

    await user.click(tenderSelect);
    await user.click(await screen.findByRole('option', { name: 'TC-CALISTA-001' }));
    expect(await screen.findByText('Calista Eligible Vendor')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Board Paper - TC-CALISTA-001')).toBeInTheDocument();

    await user.click(purposeSelect);
    await user.click(await screen.findByRole('option', { name: 'Approval Required' }));

    await user.type(screen.getByPlaceholderText('Enter your name'), 'Calista Report Preparer');

    await user.click(screen.getByRole('button', { name: 'Generate Board Paper' }));

    await waitFor(() => expect(generateBoardPaper).toHaveBeenCalled());
    expect(generateBoardPaper).toHaveBeenCalledWith({
      tenderId: 7,
      title: 'Board Paper - TC-CALISTA-001',
      purpose: 'Approval Required',
      preparedBy: 'Calista Report Preparer',
    });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        '/board-papers/result',
        expect.objectContaining({
          state: expect.objectContaining({
            tenderLabel: 'TC-CALISTA-001',
            title: 'Board Paper - TC-CALISTA-001',
            purpose: 'Approval Required',
            preparedBy: 'Calista Report Preparer',
          }),
        })
      )
    );
  });

  it('shows an error toast and does not navigate when AI generation fails (edge case)', async () => {
    generateBoardPaper.mockRejectedValue({ response: { data: { message: 'AI generation failed.' } } });

    renderPage();
    const user = userEvent.setup();

    const [tenderSelect, purposeSelect] = await screen.findAllByRole('combobox');
    await user.click(tenderSelect);
    await user.click(await screen.findByRole('option', { name: 'TC-CALISTA-001' }));
    await user.click(purposeSelect);
    await user.click(await screen.findByRole('option', { name: 'Approval Required' }));
    await user.type(screen.getByPlaceholderText('Enter your name'), 'Calista Report Preparer');

    await user.click(screen.getByRole('button', { name: 'Generate Board Paper' }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'AI generation failed.',
          variant: 'destructive',
        })
      );
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
