'use strict';

// Expanded Town Council procurement fields on Contracts, additive to the Contract
// Terms & Legal Framework fields from 20260803000000-add-contract-terms-fields.js:
// identification/scope, duration/extension detail, commercial terms, and
// insurance/legal compliance limits.
module.exports = {
  async up(queryInterface, Sequelize) {
    // -- Contract Identification & Scope --
    await queryInterface.addColumn('Contracts', 'contractRefNo', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'townCouncilName', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'estateZoneScope', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // -- Duration & Extension detail (alongside existing contractStartDate/
    // contractEndDate/optionToExtend/defectsLiabilityPeriodMonths) --
    await queryInterface.addColumn('Contracts', 'contractDurationMonths', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'extensionTerms', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // -- Commercial & Payment Terms --
    await queryInterface.addColumn('Contracts', 'awardedContractSum', {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'paymentMilestones', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'liquidatedDamagesRate', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });

    // -- Insurance, Security Deposit & Legal Framework --
    await queryInterface.addColumn('Contracts', 'performanceGuaranteePercent', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'wicaInsuranceCap', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'minBizsafeLevel', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'governingLawFramework', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Contracts', 'contractRefNo');
    await queryInterface.removeColumn('Contracts', 'townCouncilName');
    await queryInterface.removeColumn('Contracts', 'estateZoneScope');
    await queryInterface.removeColumn('Contracts', 'contractDurationMonths');
    await queryInterface.removeColumn('Contracts', 'extensionTerms');
    await queryInterface.removeColumn('Contracts', 'awardedContractSum');
    await queryInterface.removeColumn('Contracts', 'paymentMilestones');
    await queryInterface.removeColumn('Contracts', 'liquidatedDamagesRate');
    await queryInterface.removeColumn('Contracts', 'performanceGuaranteePercent');
    await queryInterface.removeColumn('Contracts', 'wicaInsuranceCap');
    await queryInterface.removeColumn('Contracts', 'minBizsafeLevel');
    await queryInterface.removeColumn('Contracts', 'governingLawFramework');
  }
};
