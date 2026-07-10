'use strict';

// Scenario coverage - the supporting document the vendor liaison attaches when logging
// MegaWorks' vendor_response (message id 3) per UC-D5.
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('clarification_attachments', [
      {
        id: 1,
        clarification_message_id: 3,
        original_filename: 'megaworks-supplier-discount-confirmation.pdf',
        cloudinary_public_id: 'town-council-tender/tc-2026-005/clarification-supplier-discount',
        file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-005/clarification-supplier-discount.pdf',
        resource_type: 'raw',
        format: 'pdf',
        file_size_bytes: 345210,
        uploaded_at: '2026-06-09T11:05:00.000Z',
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('clarification_attachments', { id: [1] }, {});
  },
};
