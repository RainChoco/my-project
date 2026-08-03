'use strict';

// Real Town Council contract opportunities, added alongside (not replacing) the
// existing mock tender seeders - see 20260101000013-demo-real-tenders.js for the
// vendor submissions linked to these via contractId.
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Contracts', [
      {
        id: 'CTR-PRPGTC-RR-22-001',
        name: 'R&R Works to 22 Blocks in Pasir Ris East Division',
        category: 'Repair & Redecoration (R&R)',
        description: 'Reference: PRPGTC/RR/22/001. Awarded by Pasir Ris-Punggol Town Council.',
        budgetLimit: 4000000.00,
        openingDate: '2026-06-01',
        closingDate: '2026-08-15',
        status: 'Open',
        isDeleted: false,
        createdAt: '2026-06-01T09:00:00.000Z',
        updatedAt: '2026-06-01T09:00:00.000Z',
      },
      {
        id: 'CTR-TMTC-UPG-23-004',
        name: 'Upgrading of Covered Linkways & Facilities in Tampines',
        category: 'Upgrading Works',
        description: 'Reference: TMTC/UPG/23/004. Awarded by Tampines Town Council.',
        budgetLimit: 2000000.00,
        openingDate: '2026-06-15',
        closingDate: '2026-08-31',
        status: 'Open',
        isDeleted: false,
        createdAt: '2026-06-15T09:00:00.000Z',
        updatedAt: '2026-06-15T09:00:00.000Z',
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Contracts', {
      id: ['CTR-PRPGTC-RR-22-001', 'CTR-TMTC-UPG-23-004'],
    }, {});
  },
};
