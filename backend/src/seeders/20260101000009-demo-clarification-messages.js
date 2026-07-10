'use strict';

// Scenario coverage - full append-only thread for both active logs from
// 20260101000008-demo-clarification-logs.js (log 1 has no messages: no_action_required
// needs no communication). Demonstrates the draft -> approve -> send -> vendor_response
// lifecycle, and that a 'sent' row is a NEW row (source_draft_id) rather than the draft
// mutated in place.
// 1-3: log 2 (MegaWorks pricing clarification) - draft, sent, vendor_response
// 4-5: log 3 (MegaWorks job adjustment follow-up notification) - draft, sent
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('clarification_messages', [
      {
        id: 1,
        clarification_log_id: 2,
        message_type: 'draft',
        subject: 'Clarification Request - Alternative Offer Pricing (TC-2026-005)',
        body: 'Dear MegaWorks Holdings Pte Ltd,\n\nIn reviewing your tender submission (TC-2026-005), we noted a S$4.0M (4.35%) difference between your Main Offer (S$92,000,000.00) and Alternative Offer (S$88,000,000.00). Could you please confirm the basis for this difference so we may proceed with evaluation?\n\nRegards,\nTender Evaluation Team',
        ai_generated: true,
        approved_by: 5,
        approved_at: '2026-06-03T14:00:00.000Z',
        sent_at: null,
        dispatch_channel: null,
        source_draft_id: null,
        created_by: 5,
        created_at: '2026-06-03T11:00:00.000Z',
      },
      {
        id: 2,
        clarification_log_id: 2,
        message_type: 'sent',
        subject: 'Clarification Request - Alternative Offer Pricing (TC-2026-005)',
        body: 'Dear MegaWorks Holdings Pte Ltd,\n\nIn reviewing your tender submission (TC-2026-005), we noted a S$4.0M (4.35%) difference between your Main Offer (S$92,000,000.00) and Alternative Offer (S$88,000,000.00). Could you please confirm the basis for this difference so we may proceed with evaluation?\n\nRegards,\nTender Evaluation Team',
        ai_generated: false,
        approved_by: null,
        approved_at: null,
        sent_at: '2026-06-03T14:15:00.000Z',
        dispatch_channel: 'email',
        source_draft_id: 1,
        created_by: 5,
        created_at: '2026-06-03T14:15:00.000Z',
      },
      {
        id: 3,
        clarification_log_id: 2,
        message_type: 'vendor_response',
        subject: null,
        body: 'Vendor reply (received by email, logged manually): "Thank you for reaching out. The Alternative Offer reflects a bulk-procurement discount on structural steel secured directly with our supplier, contingent on extending the completion timeline by 6 weeks to align with the supplier\'s delivery schedule. Please confirm if this revised schedule is acceptable so we can proceed on this basis."',
        ai_generated: false,
        approved_by: null,
        approved_at: null,
        sent_at: null,
        dispatch_channel: null,
        source_draft_id: null,
        created_by: 5,
        created_at: '2026-06-09T11:00:00.000Z',
      },
      {
        id: 4,
        clarification_log_id: 3,
        message_type: 'draft',
        subject: 'Confirmation of Adjusted Completion Timeline (TC-2026-005)',
        body: 'Dear MegaWorks Holdings Pte Ltd,\n\nFurther to your clarification response, we confirm acceptance of the 6-week completion timeline extension tied to the Alternative Offer pricing basis you described. Please treat this as written confirmation of the revised schedule.\n\nRegards,\nTender Evaluation Team',
        ai_generated: true,
        approved_by: 1,
        approved_at: '2026-06-12T15:45:00.000Z',
        sent_at: null,
        dispatch_channel: null,
        source_draft_id: null,
        created_by: 5,
        created_at: '2026-06-12T15:35:00.000Z',
      },
      {
        id: 5,
        clarification_log_id: 3,
        message_type: 'sent',
        subject: 'Confirmation of Adjusted Completion Timeline (TC-2026-005)',
        body: 'Dear MegaWorks Holdings Pte Ltd,\n\nFurther to your clarification response, we confirm acceptance of the 6-week completion timeline extension tied to the Alternative Offer pricing basis you described. Please treat this as written confirmation of the revised schedule.\n\nRegards,\nTender Evaluation Team',
        ai_generated: false,
        approved_by: null,
        approved_at: null,
        sent_at: '2026-06-12T16:00:00.000Z',
        dispatch_channel: 'email',
        source_draft_id: 4,
        created_by: 5,
        created_at: '2026-06-12T16:00:00.000Z',
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('clarification_messages', { id: [1, 2, 3, 4, 5] }, {});
  },
};
