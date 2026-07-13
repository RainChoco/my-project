'use strict';

const bcrypt = require('bcrypt');

// TEMPORARY STUB - extends 20260101000001-demo-users.js with the `report_preparer`
// user already reserved (id 4, Calista) in design/zheng-hong/api-documentation.md's
// dev-auth token list. Needed so Scope C's board_papers have a valid FK to point at.
// Replace once real registration exists.
//
// Uses the same DEV_PASSWORD as 20260101000001-demo-users.js - see that file's comment.
const DEV_PASSWORD = 'DevPass123!';

module.exports = {
  async up(queryInterface) {
    const password_hash = await bcrypt.hash(DEV_PASSWORD, 10);

    await queryInterface.bulkInsert('users', [
      {
        id: 4,
        full_name: 'Calista',
        email: 'calista@townms.gov.sg',
        password_hash,
        role: 'report_preparer',
        avatar_url: null,
        created_at: '2026-06-01T09:00:00.000Z',
        updated_at: '2026-06-01T09:00:00.000Z',
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { id: [4] }, {});
  },
};
