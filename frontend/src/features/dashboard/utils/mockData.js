export const mockKPIs = {
  totalTenders: 42,
  averagePQM: 85.4,
  highRiskTenders: 3,
  recentSubmissions: 12
};

export const mockRankings = {
  data: [
    { tenderId: 'TND-2026-001', vendorName: 'CleanTech Pte Ltd', pqmScore: 92.5, riskLevel: 'Low', rank: 1, status: 'Evaluating' },
    { tenderId: 'TND-2026-001', vendorName: 'EverGreen Services', pqmScore: 88.0, riskLevel: 'Medium', rank: 2, status: 'Evaluating' },
    { tenderId: 'TND-2026-002', vendorName: 'Elevate SG', pqmScore: 95.1, riskLevel: 'Low', rank: 1, status: 'Awarded' },
  ],
  pagination: { page: 1, pageSize: 10, totalRecords: 3, totalPages: 1 }
};
