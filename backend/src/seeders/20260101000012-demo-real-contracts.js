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
        openingDate: new Date('2026-06-01T00:00:00.000Z'),
        closingDate: new Date('2026-08-15T00:00:00.000Z'),
        status: 'Open',
        isDeleted: false,
        securityDepositAmount: 200000.00,
        bankGuaranteeTerms: 'Unconditional and irrevocable banker\'s guarantee equivalent to 5% of the contract sum, valid for the full contract period plus defects liability period.',
        publicLiabilityInsuranceMin: 1000000.00,
        publicLiabilityInsuranceMax: 2000000.00,
        monthlyManagementFeeRate: 850.00,
        contractStartDate: new Date('2026-09-01T00:00:00.000Z'),
        contractEndDate: new Date('2028-08-31T00:00:00.000Z'),
        optionToExtend: true,
        defectsLiabilityPeriodMonths: 12,
        terminationNoticePeriodDays: 14,
        createdAt: new Date('2026-06-01T09:00:00.000Z'),
        updatedAt: new Date('2026-06-01T09:00:00.000Z'),
      },
      {
        id: 'CTR-TMTC-UPG-23-004',
        name: 'Upgrading of Covered Linkways & Facilities in Tampines',
        category: 'Upgrading Works',
        description: 'Reference: TMTC/UPG/23/004. Awarded by Tampines Town Council.',
        budgetLimit: 2000000.00,
        openingDate: new Date('2026-06-15T00:00:00.000Z'),
        closingDate: new Date('2026-08-31T00:00:00.000Z'),
        status: 'Open',
        isDeleted: false,
        securityDepositAmount: 100000.00,
        bankGuaranteeTerms: 'Unconditional and irrevocable banker\'s guarantee equivalent to 5% of the contract sum, valid for the full contract period plus defects liability period.',
        publicLiabilityInsuranceMin: 1000000.00,
        publicLiabilityInsuranceMax: 1000000.00,
        monthlyManagementFeeRate: 600.00,
        contractStartDate: new Date('2026-09-15T00:00:00.000Z'),
        contractEndDate: new Date('2027-09-14T00:00:00.000Z'),
        optionToExtend: false,
        defectsLiabilityPeriodMonths: 6,
        terminationNoticePeriodDays: 14,
        createdAt: new Date('2026-06-15T09:00:00.000Z'),
        updatedAt: new Date('2026-06-15T09:00:00.000Z'),
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Contracts', {
      id: ['CTR-PRPGTC-RR-22-001', 'CTR-TMTC-UPG-23-004'],
    }, {});
  },
};
