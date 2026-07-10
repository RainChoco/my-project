'use strict';

// Scenario coverage - only tenders 1 (BrightBuild) and 5 (MegaWorks) have a non-null
// alternative_offer_price, so per UC-D1's edge case those are the only two tenders that
// can generate a pricing_deviation log at all (tenders 2/3/4/6 never get one).
// Assumes a 4% deviation tolerance threshold.
// 1 BrightBuild (tender 1) - 3.33% deviation, within tolerance -> no_action_required, audit-only, no message thread
// 2 MegaWorks   (tender 5) - 4.35% deviation, exceeds tolerance -> flagged through the full pipeline, now resolved
// 3 MegaWorks   (tender 5) - job_adjustment_notification follow-up spawned by log 2's job adjustment request, currently sent
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('clarification_logs', [
      {
        id: 1,
        tender_id: 1,
        log_type: 'pricing_deviation',
        status: 'no_action_required',
        main_offer_price_snapshot: 45000000.00,
        alternative_offer_price_snapshot: 43500000.00,
        deviation_amount: 1500000.00,
        deviation_percentage: 3.33,
        ai_rationale: 'Deviation of approximately 3.33% between the Main Offer and Alternative Offer is within the configured 4% clarification tolerance; no vendor follow-up required.',
        follow_up_due_at: null,
        escalated_by: null,
        escalated_at: null,
        responded_at: null,
        response_notes: null,
        outcome_notes: null,
        resolved_by: null,
        resolved_at: null,
        created_at: '2026-06-02T10:05:00.000Z',
        updated_at: '2026-06-02T10:05:00.000Z',
      },
      {
        id: 2,
        tender_id: 5,
        log_type: 'pricing_deviation',
        status: 'resolved',
        main_offer_price_snapshot: 92000000.00,
        alternative_offer_price_snapshot: 88000000.00,
        deviation_amount: 4000000.00,
        deviation_percentage: 4.35,
        ai_rationale: 'A S$4.0M (4.35%) gap between the Main Offer and Alternative Offer exceeds the configured 4% clarification tolerance threshold. Vendor should be asked to confirm the basis for the alternative pricing before evaluation proceeds.',
        follow_up_due_at: '2026-06-10',
        escalated_by: null,
        escalated_at: null,
        responded_at: '2026-06-09T11:00:00.000Z',
        response_notes: 'Vendor confirmed the Alternative Offer reflects a bulk-procurement discount on structural steel secured directly with their supplier, contingent on extending the completion timeline by 6 weeks to align with the supplier’s delivery schedule.',
        outcome_notes: 'Pricing deviation is legitimate (bulk-material discount, not a data error) - no revision to alternative_offer_price required. The linked timeline extension was logged as a separate job adjustment request and confirmed back to the vendor.',
        resolved_by: 1,
        resolved_at: '2026-06-12T15:00:00.000Z',
        created_at: '2026-06-03T10:30:00.000Z',
        updated_at: '2026-06-12T15:00:00.000Z',
      },
      {
        id: 3,
        tender_id: 5,
        log_type: 'job_adjustment_notification',
        status: 'sent',
        main_offer_price_snapshot: null,
        alternative_offer_price_snapshot: null,
        deviation_amount: null,
        deviation_percentage: null,
        ai_rationale: null,
        follow_up_due_at: '2026-06-19',
        escalated_by: null,
        escalated_at: null,
        responded_at: null,
        response_notes: null,
        outcome_notes: null,
        resolved_by: null,
        resolved_at: null,
        created_at: '2026-06-12T15:35:00.000Z',
        updated_at: '2026-06-12T16:00:00.000Z',
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('clarification_logs', { id: [1, 2, 3] }, {});
  },
};
