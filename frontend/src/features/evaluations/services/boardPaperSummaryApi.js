import { apiClient } from '../../../lib';

// Read-only lookup into Calista's board papers (Scope C) for the Approval page's
// report summary. Her feature has no "board paper by tender id" endpoint yet, so
// this reuses her existing GET /api/boardpapers list and filters client-side -
// deliberately not touching her routes/controller.
export const fetchBoardPaperForTender = async (tenderId) => {
  const { data } = await apiClient.get('/boardpapers');
  const papers = Array.isArray(data) ? data : [];
  const forTender = papers
    .filter((paper) => paper.tenderId === tenderId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return forTender[0] ?? null;
};
