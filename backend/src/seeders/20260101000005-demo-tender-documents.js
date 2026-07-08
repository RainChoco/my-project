'use strict';

// Scenario coverage includes: multiple file_types per tender (main_offer, alternative_offer,
// license, other), and a version/is_latest correction pair on tender 5 (megaworks-main-offer
// v1 -> v2) to exercise the document-history behaviour.
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('tender_documents', [
      { id: 1, tender_id: 1, file_type: 'main_offer', original_filename: 'brightbuild-main-offer.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-001/main-offer', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-001/main-offer.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 2458112, version: 1, is_latest: true, uploaded_by: 1, uploaded_at: '2026-05-10T09:05:00.000Z' },
      { id: 2, tender_id: 1, file_type: 'license', original_filename: 'brightbuild-bca-fm01-license.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-001/license', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-001/license.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 512340, version: 1, is_latest: true, uploaded_by: 1, uploaded_at: '2026-05-10T09:06:00.000Z' },
      { id: 3, tender_id: 1, file_type: 'other', original_filename: 'brightbuild-non-debarment-declaration.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-001/non-debarment', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-001/non-debarment.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 98214, version: 1, is_latest: true, uploaded_by: 1, uploaded_at: '2026-05-10T09:07:00.000Z' },

      { id: 4, tender_id: 2, file_type: 'main_offer', original_filename: 'quickfix-main-offer.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-002/main-offer', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-002/main-offer.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 1874421, version: 1, is_latest: true, uploaded_by: 1, uploaded_at: '2026-05-12T09:35:00.000Z' },
      { id: 5, tender_id: 2, file_type: 'license', original_filename: 'quickfix-bca-fm01-license.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-002/license', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-002/license.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 433221, version: 1, is_latest: true, uploaded_by: 1, uploaded_at: '2026-05-12T09:36:00.000Z' },

      { id: 6, tender_id: 3, file_type: 'main_offer', original_filename: 'shadycorp-main-offer.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-003/main-offer', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-003/main-offer.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 1204552, version: 1, is_latest: true, uploaded_by: 1, uploaded_at: '2026-05-14T14:05:00.000Z' },
      { id: 7, tender_id: 3, file_type: 'license', original_filename: 'shadycorp-bca-fm01-license.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-003/license', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-003/license.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 389012, version: 1, is_latest: true, uploaded_by: 1, uploaded_at: '2026-05-14T14:06:00.000Z' },

      { id: 8, tender_id: 4, file_type: 'main_offer', original_filename: 'greenscape-main-offer-draft.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-004/main-offer', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-004/main-offer.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 998211, version: 1, is_latest: true, uploaded_by: 1, uploaded_at: '2026-05-30T16:02:00.000Z' },

      { id: 9, tender_id: 5, file_type: 'main_offer', original_filename: 'megaworks-main-offer-v1.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-005/main-offer-v1', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-005/main-offer-v1.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 3021044, version: 1, is_latest: false, uploaded_by: 1, uploaded_at: '2026-06-01T08:05:00.000Z' },
      { id: 10, tender_id: 5, file_type: 'main_offer', original_filename: 'megaworks-main-offer-v2-corrected.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-005/main-offer-v2', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-005/main-offer-v2.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 3054981, version: 2, is_latest: true, uploaded_by: 1, uploaded_at: '2026-06-02T10:15:00.000Z' },
      { id: 11, tender_id: 5, file_type: 'alternative_offer', original_filename: 'megaworks-alternative-offer.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-005/alternative-offer', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-005/alternative-offer.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 2887123, version: 1, is_latest: true, uploaded_by: 1, uploaded_at: '2026-06-01T08:10:00.000Z' },
      { id: 12, tender_id: 5, file_type: 'license', original_filename: 'megaworks-bca-fm01-license.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-005/license', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-005/license.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 601234, version: 1, is_latest: true, uploaded_by: 1, uploaded_at: '2026-06-01T08:12:00.000Z' },

      { id: 13, tender_id: 6, file_type: 'main_offer', original_filename: 'uncertain-builders-main-offer.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-006/main-offer', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-006/main-offer.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 1543098, version: 1, is_latest: true, uploaded_by: 1, uploaded_at: '2026-06-02T13:05:00.000Z' },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'tender_documents',
      { id: Array.from({ length: 13 }, (_, i) => i + 1) },
      {}
    );
  },
};
