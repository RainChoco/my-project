export const mockKPIs = {
  totalTenders: 42,
  averagePQM: 85.4,
  highRiskTenders: 3,
  recentSubmissions: 12
};

export const mockRankings = {
  data: [
    { tenderId: 'TND-2026-001', tenderRefNo: 'TND-2026-001', supplierName: 'CleanTech Pte Ltd', category: 'Cleaning', pqmScore: 92.5, riskLevel: 'Low', rank: 1, status: 'Evaluating', submissionDate: '2026-06-01' },
    { tenderId: 'TND-2026-001', tenderRefNo: 'TND-2026-001', supplierName: 'EverGreen Services', category: 'Cleaning', pqmScore: 88.0, riskLevel: 'Medium', rank: 2, status: 'Evaluating', submissionDate: '2026-06-02' },
    { tenderId: 'TND-2026-002', tenderRefNo: 'TND-2026-002', supplierName: 'Elevate SG', category: 'Cleaning', pqmScore: 95.1, riskLevel: 'Low', rank: 1, status: 'Awarded', submissionDate: '2026-05-20' },
  ],
  pagination: { page: 1, pageSize: 10, totalRecords: 3, totalPages: 1 }
};
