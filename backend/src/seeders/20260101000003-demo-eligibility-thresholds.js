'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('eligibility_thresholds', [
      {
        id: 1,
        criterion_key: 'min_paid_up_capital',
        threshold_value: 2000000.00,
        description: 'Minimum paid-up capital required for tender eligibility (project-requirements.md).',
        updated_by: 3,
        updated_at: '2026-06-01T09:00:00.000Z',
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('eligibility_thresholds', { id: [1] }, {});
  },
};
