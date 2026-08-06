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
        description: 'Repair and redecoration works (repainting, spalling concrete repair, common area upgrading) to 22 HDB blocks in the Pasir Ris East Division.',
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
        // -- Contract Identification & Scope --
        contractRefNo: 'PRPGTC/RR/22/001',
        townCouncilName: 'Pasir Ris-Punggol Town Council',
        estateZoneScope: 'Pasir Ris East Division - 22 HDB blocks (Blocks 101 to 156, Pasir Ris Street 11-13)',
        // -- Duration & Extension detail --
        contractDurationMonths: 24,
        extensionTerms: '+1 Year',
        // -- Commercial & Payment Terms --
        awardedContractSum: 3850000.00,
        paymentMilestones: '20% on mobilization, 60% progressively upon completion of each block (certified by MA), 20% on final completion and handover.',
        liquidatedDamagesRate: 100.00,
        // -- Insurance, Security Deposit & Legal Framework --
        performanceGuaranteePercent: 5.00,
        wicaInsuranceCap: 500000.00,
        minBizsafeLevel: 'Level 3',
        governingLawFramework: 'Singapore Town Councils Act & Standard Public Sector Conditions of Contract (PSSCOC)',
        createdAt: new Date('2026-06-01T09:00:00.000Z'),
        updatedAt: new Date('2026-06-01T09:00:00.000Z'),
      },
      {
        id: 'CTR-TMTC-UPG-23-004',
        name: 'Upgrading of Covered Linkways & Facilities in Tampines',
        category: 'Upgrading Works',
        description: 'Construction of new covered linkways and upgrading of existing residents\' facilities within Tampines Town Council estates.',
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
        // -- Contract Identification & Scope --
        contractRefNo: 'TMTC/UPG/23/004',
        townCouncilName: 'Tampines Town Council',
        estateZoneScope: 'Tampines Division 3 - Covered linkways between Tampines Street 81/82 and adjoining residents\' facilities',
        // -- Duration & Extension detail --
        contractDurationMonths: 12,
        extensionTerms: 'None',
        // -- Commercial & Payment Terms --
        awardedContractSum: 1950000.00,
        paymentMilestones: '10% on mobilization, 80% progressively upon certified completion of each linkway segment, 10% on final completion and handover.',
        liquidatedDamagesRate: 80.00,
        // -- Insurance, Security Deposit & Legal Framework --
        performanceGuaranteePercent: 5.00,
        wicaInsuranceCap: 300000.00,
        minBizsafeLevel: 'Level 3',
        governingLawFramework: 'Singapore Town Councils Act & Standard Public Sector Conditions of Contract (PSSCOC)',
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
