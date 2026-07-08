'use strict';

// Illustrative BCA FM01 grade-to-tender-value ceilings for PoC/demo purposes.
// Verify against the official BCA registry before treating these as production values.
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('bca_grade_limits', [
      { id: 1, grade: 'L1', max_tender_value: 1500000.00, effective_from: '2024-01-01', updated_at: '2026-06-01T09:00:00.000Z' },
      { id: 2, grade: 'L2', max_tender_value: 6000000.00, effective_from: '2024-01-01', updated_at: '2026-06-01T09:00:00.000Z' },
      { id: 3, grade: 'L3', max_tender_value: 16000000.00, effective_from: '2024-01-01', updated_at: '2026-06-01T09:00:00.000Z' },
      { id: 4, grade: 'L4', max_tender_value: 40000000.00, effective_from: '2024-01-01', updated_at: '2026-06-01T09:00:00.000Z' },
      { id: 5, grade: 'L5', max_tender_value: 85000000.00, effective_from: '2024-01-01', updated_at: '2026-06-01T09:00:00.000Z' },
      { id: 6, grade: 'L6', max_tender_value: null, effective_from: '2024-01-01', updated_at: '2026-06-01T09:00:00.000Z' },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bca_grade_limits', { id: [1, 2, 3, 4, 5, 6] }, {});
  },
};
