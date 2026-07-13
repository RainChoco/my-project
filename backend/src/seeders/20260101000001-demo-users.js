'use strict';

const bcrypt = require('bcrypt');

// TEMPORARY STUB - the `users` table is owned by the shared Auth/RBAC scope (group).
// These rows only exist so tenders/documents/eligibility_checks have valid FKs to
// point at while auth is still being built. Replace once real registration exists.
//
// DEV_PASSWORD is the real local-dev login password for every seeded demo user below
// (and in 20260101000007-demo-users-vendor-liaison.js) - log in with it via the actual
// POST /auth/login flow. See also design/test-tokens.md for pre-signed JWT shortcuts.
const DEV_PASSWORD = 'DevPass123!';

module.exports = {
  async up(queryInterface) {
    const password_hash = await bcrypt.hash(DEV_PASSWORD, 10);

    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        full_name: 'Zheng Hong',
        email: 'zheng.hong@townms.gov.sg',
        password_hash,
        role: 'ma_staff',
        avatar_url: null,
        created_at: '2026-06-01T09:00:00.000Z',
        updated_at: '2026-06-01T09:00:00.000Z',
      },
      {
        id: 2,
        full_name: 'Jerrold',
        email: 'jerrold@townms.gov.sg',
        password_hash,
        role: 'evaluator',
        avatar_url: null,
        created_at: '2026-06-01T09:00:00.000Z',
        updated_at: '2026-06-01T09:00:00.000Z',
      },
      {
        id: 3,
        full_name: 'Kai Xuan',
        email: 'kai.xuan@townms.gov.sg',
        password_hash,
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
