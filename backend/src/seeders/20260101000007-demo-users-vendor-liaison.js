'use strict';

// TEMPORARY STUB - extends 20260101000001-demo-users.js with the `vendor_liaison`
// user already reserved (id 5, Farid Rahman) in design/zheng-hong/api-documentation.md's
// dev-auth token list. Needed here so Scope D's clarification_logs/messages/
// job_adjustment_requests have a valid FK to point at. Replace once real registration exists.
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [
      {
        id: 5,
        full_name: 'Farid Rahman',
        email: 'farid.rahman@townms.gov.sg',
        password_hash: 'TEMP_STUB_HASH_NOT_REAL',
        role: 'vendor_liaison',
        avatar_url: null,
        created_at: '2026-06-01T09:00:00.000Z',
        updated_at: '2026-06-01T09:00:00.000Z',
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { id: [5] }, {});
  },
};
