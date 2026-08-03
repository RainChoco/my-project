'use strict';

// Contract Terms & Legal Framework fields extracted from Town Council tender
// documents: security deposit / bank guarantee, insurance coverage, management
// fee rate, contract period, defects liability period, and termination notice.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Contracts', 'securityDepositAmount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'bankGuaranteeTerms', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'publicLiabilityInsuranceMin', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'publicLiabilityInsuranceMax', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'monthlyManagementFeeRate', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'contractStartDate', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'contractEndDate', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'optionToExtend', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('Contracts', 'defectsLiabilityPeriodMonths', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('Contracts', 'terminationNoticePeriodDays', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Contracts', 'securityDepositAmount');
    await queryInterface.removeColumn('Contracts', 'bankGuaranteeTerms');
    await queryInterface.removeColumn('Contracts', 'publicLiabilityInsuranceMin');
    await queryInterface.removeColumn('Contracts', 'publicLiabilityInsuranceMax');
    await queryInterface.removeColumn('Contracts', 'monthlyManagementFeeRate');
    await queryInterface.removeColumn('Contracts', 'contractStartDate');
    await queryInterface.removeColumn('Contracts', 'contractEndDate');
    await queryInterface.removeColumn('Contracts', 'optionToExtend');
    await queryInterface.removeColumn('Contracts', 'defectsLiabilityPeriodMonths');
    await queryInterface.removeColumn('Contracts', 'terminationNoticePeriodDays');
  }
};
