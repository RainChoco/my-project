'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add contractId FK to tenders table — links Tender to Contract Opportunity
    await queryInterface.addColumn('tenders', 'contractId', {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: 'Contracts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Index for efficient queries filtering tenders by contract
    await queryInterface.addIndex('tenders', ['contractId'], {
      name: 'tenders_contract_id_index'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('tenders', 'tenders_contract_id_index');
    await queryInterface.removeColumn('tenders', 'contractId');
  }
};
