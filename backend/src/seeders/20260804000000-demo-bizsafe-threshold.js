'use strict';

// Data-only addition to eligibility_thresholds (Eligibility Configuration settings
// view, Zheng Hong) - reuses the existing generic criterion_key/threshold_value
// columns rather than a schema change. bizSAFE level is numeric-encoded since
// threshold_value is DECIMAL: None=0, Level 1=1, Level 2=2, Level 3=3, STAR=4
// (see BIZSAFE_LEVELS in frontend/src/features/tenders/constants.js and the
// bizsafe_level ENUM on backend/src/models/tender.js).
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('eligibility_thresholds', [
      {
        id: 2,
        criterion_key: 'min_bizsafe_level',
        threshold_value: 3.00,
        description: 'Minimum bizSAFE level required for tender eligibility, numeric-encoded (None=0, Level 1=1, Level 2=2, Level 3=3, STAR=4).',
        updated_by: 3,
        updated_at: '2026-08-04T09:00:00.000Z',
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('eligibility_thresholds', { id: [2] }, {});
  },
};
