'use strict';

// Mirrors the eligibility_status/ai_eligibility_summary set on each tender in
// 20260101000004-demo-tenders.js - one row per criterion actually evaluated.
// Tender 4 (draft, not yet AI-parsed) intentionally has no rows here.
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('eligibility_checks', [
      // Tender 1 - BrightBuild: all pass
      { id: 1, tender_id: 1, criterion: 'min_paid_up_capital', threshold_value_used: 2000000.00, actual_value: 5000000.00, passed: true, source: 'ai_extracted', notes: null, checked_by: null, checked_at: '2026-05-10T09:10:00.000Z' },
      { id: 2, tender_id: 1, criterion: 'bca_fm01_license_valid', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null, checked_at: '2026-05-10T09:10:00.000Z' },
      { id: 3, tender_id: 1, criterion: 'bca_fm01_tender_limit', threshold_value_used: 85000000.00, actual_value: 45000000.00, passed: true, source: 'ai_extracted', notes: null, checked_by: null, checked_at: '2026-05-10T09:10:00.000Z' },
      { id: 4, tender_id: 1, criterion: 'non_debarment', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null, checked_at: '2026-05-10T09:10:00.000Z' },

      // Tender 2 - QuickFix: double failure
      { id: 5, tender_id: 2, criterion: 'min_paid_up_capital', threshold_value_used: 2000000.00, actual_value: 1200000.00, passed: false, source: 'ai_extracted', notes: 'Declared paid-up capital below the S$2M minimum requirement.', checked_by: null, checked_at: '2026-05-12T09:40:00.000Z' },
      { id: 6, tender_id: 2, criterion: 'bca_fm01_license_valid', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null, checked_at: '2026-05-12T09:40:00.000Z' },
      { id: 7, tender_id: 2, criterion: 'bca_fm01_tender_limit', threshold_value_used: 6000000.00, actual_value: 7200000.00, passed: false, source: 'ai_extracted', notes: 'Main offer price exceeds BCA FM01 Grade L2 tender value ceiling.', checked_by: null, checked_at: '2026-05-12T09:40:00.000Z' },
      { id: 8, tender_id: 2, criterion: 'non_debarment', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null, checked_at: '2026-05-12T09:40:00.000Z' },

      // Tender 3 - ShadyCorp: passes financial/licensing, fails manual debarment check
      { id: 9, tender_id: 3, criterion: 'min_paid_up_capital', threshold_value_used: 2000000.00, actual_value: 2500000.00, passed: true, source: 'ai_extracted', notes: null, checked_by: null, checked_at: '2026-05-14T14:10:00.000Z' },
      { id: 10, tender_id: 3, criterion: 'bca_fm01_license_valid', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null, checked_at: '2026-05-14T14:10:00.000Z' },
      { id: 11, tender_id: 3, criterion: 'bca_fm01_tender_limit', threshold_value_used: 16000000.00, actual_value: 3000000.00, passed: true, source: 'ai_extracted', notes: null, checked_by: null, checked_at: '2026-05-14T14:10:00.000Z' },
      { id: 12, tender_id: 3, criterion: 'non_debarment', threshold_value_used: null, actual_value: null, passed: false, source: 'manual_override', notes: 'Vendor found on debarment list during manual verification.', checked_by: 2, checked_at: '2026-05-20T09:00:00.000Z' },

      // Tender 5 - MegaWorks: Grade L6 has no ceiling, so threshold_value_used is null
      { id: 13, tender_id: 5, criterion: 'min_paid_up_capital', threshold_value_used: 2000000.00, actual_value: 20000000.00, passed: true, source: 'ai_extracted', notes: null, checked_by: null, checked_at: '2026-06-01T08:20:00.000Z' },
      { id: 14, tender_id: 5, criterion: 'bca_fm01_license_valid', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null, checked_at: '2026-06-01T08:20:00.000Z' },
      { id: 15, tender_id: 5, criterion: 'bca_fm01_tender_limit', threshold_value_used: null, actual_value: 92000000.00, passed: true, source: 'ai_extracted', notes: 'Grade L6 has no tender value ceiling.', checked_by: null, checked_at: '2026-06-01T08:20:00.000Z' },
      { id: 16, tender_id: 5, criterion: 'non_debarment', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null, checked_at: '2026-06-01T08:20:00.000Z' },

      // Tender 6 - Uncertain Builders: missing license blocks the tender-limit check entirely
      { id: 17, tender_id: 6, criterion: 'min_paid_up_capital', threshold_value_used: 2000000.00, actual_value: 3000000.00, passed: true, source: 'ai_extracted', notes: null, checked_by: null, checked_at: '2026-06-02T13:10:00.000Z' },
      { id: 18, tender_id: 6, criterion: 'bca_fm01_license_valid', threshold_value_used: null, actual_value: null, passed: false, source: 'ai_extracted', notes: 'No BCA FM01 license number found in submitted documents.', checked_by: null, checked_at: '2026-06-02T13:10:00.000Z' },
      { id: 19, tender_id: 6, criterion: 'non_debarment', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null, checked_at: '2026-06-02T13:10:00.000Z' },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'eligibility_checks',
      { id: Array.from({ length: 19 }, (_, i) => i + 1) },
      {}
    );
  },
};
