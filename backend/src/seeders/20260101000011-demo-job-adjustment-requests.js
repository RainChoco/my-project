'use strict';

// Scenario coverage - the timeline adjustment implied by MegaWorks' vendor_response
// (message id 3) to clarification log 2, per UC-D7. Marked material since it's a schedule
// term change mid-evaluation, so approval_status went through actual sign-off (Alice Tan)
// rather than being auto-approved. follow_up_clarification_log_id points at log 3, the
// job_adjustment_notification thread that confirmed the adjustment back to the vendor.
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('job_adjustment_requests', [
      {
        id: 1,
        clarification_log_id: 2,
        source_message_id: 3,
        tender_id: 5,
        description: 'Extend project completion timeline by 6 weeks to align with the vendor\'s supplier delivery schedule tied to the Alternative Offer pricing.',
        justification: 'Vendor confirmed the Alternative Offer discount is contingent on this schedule change; accepting the price benefit requires accepting the linked timeline adjustment.',
        is_material: true,
        approval_status: 'approved',
        follow_up_clarification_log_id: 3,
        requested_by: 5,
        approved_by: 1,
        approved_at: '2026-06-12T15:30:00.000Z',
        created_at: '2026-06-09T11:10:00.000Z',
        updated_at: '2026-06-12T15:30:00.000Z',
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('job_adjustment_requests', { id: [1] }, {});
  },
};
