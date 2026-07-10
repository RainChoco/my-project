class MockEvaluationRepository {
  async getRankingsForTender(tenderId) {
    if (tenderId === 'TND-2026-001') {
      return [
        { vendorId: 'V-001', vendorName: 'CleanTech Pte Ltd', pqmScore: 89.2, riskLevel: 'Low' },
        { vendorId: 'V-002', vendorName: 'EverGreen Services', pqmScore: 75.0, riskLevel: 'Medium' },
        { vendorId: 'V-003', vendorName: 'CitySweep', pqmScore: 92.5, riskLevel: 'Low' }
      ].sort((a, b) => b.pqmScore - a.pqmScore)
       .map((v, idx) => ({ ...v, rank: idx + 1 }));
    }
    return [];
  }
  
  async getAllRankings() {
    return [
      { tenderId: 'TND-2026-001', title: 'Town Council Cleaning', vendor: 'CitySweep', pqmScore: 92.5, rank: 1, status: 'Evaluating' },
      { tenderId: 'TND-2026-002', title: 'Lift Maintenance', vendor: 'Elevate SG', pqmScore: 88.0, rank: 1, status: 'Awarded' },
      { tenderId: 'TND-2026-003', title: 'Landscaping Phase 2', vendor: 'GreenThumbs', pqmScore: 95.1, rank: 1, status: 'Evaluating' }
    ];
  }
}

module.exports = MockEvaluationRepository;
