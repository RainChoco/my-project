class MockTenderRepository {
  async findAll({ status, category, dateFrom, dateTo } = {}) {
    let tenders = [
      { id: 'TND-2026-001', title: 'Town Council Cleaning', category: 'Cleaning', status: 'Evaluating', createdAt: new Date('2026-06-15') },
      { id: 'TND-2026-002', title: 'Lift Maintenance', category: 'Maintenance', status: 'Awarded', createdAt: new Date('2026-05-10') },
      { id: 'TND-2026-003', title: 'Landscaping Phase 2', category: 'Landscaping', status: 'Evaluating', createdAt: new Date('2026-07-01') },
    ];
    if (status) tenders = tenders.filter(t => t.status === status);
    if (category) tenders = tenders.filter(t => t.category === category);
    if (dateFrom) tenders = tenders.filter(t => t.createdAt >= new Date(dateFrom));
    if (dateTo) tenders = tenders.filter(t => t.createdAt <= new Date(dateTo));
    return tenders;
  }
  
  async findById(id) {
    const tenders = await this.findAll();
    return tenders.find(t => t.id === id);
  }
}

module.exports = MockTenderRepository;
