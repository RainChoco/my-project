'use strict';

// TEMPORARY STUB - the `users` table is owned by the shared Auth/RBAC scope (group).
// These rows only exist so tenders/documents/eligibility_checks have valid FKs to
// point at while auth is still being built. Replace once real registration exists.
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        full_name: 'Alice Tan',
        email: 'alice.tan@townms.gov.sg',
        password_hash: 'TEMP_STUB_HASH_NOT_REAL',
        role: 'ma_staff',
        avatar_url: null,
        created_at: '2026-06-01T09:00:00.000Z',
        updated_at: '2026-06-01T09:00:00.000Z',
      },
      {
        id: 2,
        full_name: 'Ben Ong',
        email: 'ben.ong@townms.gov.sg',
        password_hash: 'TEMP_STUB_HASH_NOT_REAL',
        role: 'evaluator',
        avatar_url: null,
        created_at: '2026-06-01T09:00:00.000Z',
        updated_at: '2026-06-01T09:00:00.000Z',
      },
      {
        id: 3,
        full_name: 'Cheryl Lim',
        email: 'cheryl.lim@townms.gov.sg',
        password_hash: 'TEMP_STUB_HASH_NOT_REAL',
        role: 'management',
        avatar_url: null,
        created_at: '2026-06-01T09:00:00.000Z',
        updated_at: '2026-06-01T09:00:00.000Z',
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { id: [1, 2, 3] }, {});
  },
};
