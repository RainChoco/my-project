/** @vitest-environment jsdom */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
const mockToast = vi.fn();
const mockGetHistoryEntries = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: {} })
}));

vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

vi.mock('../services/proposalApi', () => ({
  generateProposal: vi.fn()
}));

vi.mock('../utils/historyStorage', () => ({
  getHistoryEntries: () => mockGetHistoryEntries()
}));

import ProposalGeneratorPage from './ProposalGeneratorPage';
import { generateProposal } from '../services/proposalApi';

describe('ProposalGeneratorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    mockToast.mockReset();
  });

  it('refreshes the board paper dropdown when history is updated', async () => {
    mockGetHistoryEntries
      .mockResolvedValueOnce([
        { id: 1, type: 'Board Paper', title: 'Board Paper A', entryData: { boardPaperId: 1 } },
        { id: 2, type: 'Board Paper', title: 'Board Paper B', entryData: { boardPaperId: 2 } }
      ])
      .mockResolvedValueOnce([
        { id: 1, type: 'Board Paper', title: 'Board Paper A', entryData: { boardPaperId: 1 } }
      ]);

    render(<ProposalGeneratorPage />);

    const select = await screen.findByRole('combobox');
    expect(within(select).getByText('Board Paper A')).toBeTruthy();
    expect(within(select).getByText('Board Paper B')).toBeTruthy();

    window.dispatchEvent(new CustomEvent('history-updated'));

    await waitFor(() => {
      expect(screen.queryByText('Board Paper B')).toBeNull();
    });
  });

  it('submits selected report sections without manual sections content', async () => {
    mockGetHistoryEntries.mockResolvedValue([
      {
        id: 1,
        type: 'Board Paper',
        title: 'Board Paper A',
        report: {
          title: 'Board Paper A',
          aiSummary: true,
          aiRecommendation: true,
          aiFinancialAnalysis: true,
          aiRiskAssessment: true,
          confidence: 92,
          score: '92 / 100',
          vendorName: 'BrightBuild Pte Ltd',
          contractValue: '1000000',
          contractDuration: '12 months'
        }
      }
    ]);

    vi.mocked(generateProposal).mockResolvedValue({
      proposal: {
        proposalTitle: 'Board Paper A Proposal',
        proposalType: 'Recommendation for Award',
        sections: {
          content: 'Executive Summary\n\nTest content'
        }
      }
    });

    render(<ProposalGeneratorPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Board Paper A Proposal')).toBeTruthy();
    });

    await userEvent.click(screen.getByRole('button', { name: /generate report/i }));

    await waitFor(() => {
      expect(generateProposal).toHaveBeenCalled();
    });

    const payload = vi.mocked(generateProposal).mock.calls[0][0];

    expect(payload).toEqual(expect.objectContaining({
      proposalTitle: 'Board Paper A Proposal',
      proposalType: 'Recommendation for Award',
      language: 'English',
      selectedReportSections: expect.arrayContaining([
        'Executive Summary',
        'Tender Overview',
        'Vendor Recommendation',
        'Financial Analysis',
        'Risk Assessment',
        'AI Recommendation',
        'Conclusion'
      ])
    }));
    expect(payload).not.toHaveProperty('sections');
  });

  it('submits the generated report directly without a manual proposal content editor', async () => {
    mockGetHistoryEntries.mockResolvedValue([
      {
        id: 1,
        type: 'Board Paper',
        title: 'Board Paper A',
        report: {
          title: 'Board Paper A',
          aiSummary: 'A strong recommendation.',
          aiRecommendation: 'Proceed to award.',
          aiFinancialAnalysis: 'Budget remains healthy.',
          aiRiskAssessment: 'Risk is manageable.'
        }
      }
    ]);

    vi.mocked(generateProposal).mockResolvedValue({
      proposal: {
        proposalTitle: 'Board Paper A Proposal',
        proposalType: 'Recommendation for Award',
        sections: {
          content: 'Executive Summary\n\nTest content'
        }
      }
    });

    render(<ProposalGeneratorPage />);

    expect(screen.queryByLabelText(/proposal content/i)).toBeNull();
    expect(screen.getByText(/The proposal report will be generated/i)).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Board Paper A Proposal')).toBeTruthy();
    });

    await userEvent.click(screen.getByRole('button', { name: /generate report/i }));

    await waitFor(() => {
      expect(generateProposal).toHaveBeenCalledWith(expect.objectContaining({
        proposalTitle: 'Board Paper A Proposal',
        proposalType: 'Recommendation for Award',
        language: 'English',
        selectedReportSections: expect.arrayContaining([
          'Executive Summary',
          'Tender Overview',
          'Vendor Recommendation',
          'Financial Analysis',
          'Risk Assessment',
          'AI Recommendation',
          'Conclusion'
        ])
      }));
    });

    expect(mockNavigate).toHaveBeenCalledWith('/proposal-report/result', {
      state: expect.objectContaining({
        proposalTitle: 'Board Paper A Proposal'
      })
    });
  });
});
