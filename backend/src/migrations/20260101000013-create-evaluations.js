'use strict';

// NOTE: tender_id references `tenders`, owned by Zheng Hong (Scope A). That table's
// migration isn't in this repo yet, so this migration will fail with
// "relation \"tenders\" does not exist" until his migration is merged and runs first.
// It must be run after his create-tenders migration (both are ahead of this file's
// timestamp position is not what orders them - `sequelize-cli db:migrate` runs
// migrations in filename/timestamp order, so his create-tenders migration's
// timestamp needs to sort before this one).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('evaluations', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      tender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenders', key: 'id' },
        onUpdate: 'CASCADE'
      },
      price_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      quality_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      pqm_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      ai_extracted_inputs: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('processing', 'incomplete', 'scored', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'processing'
      },
      evaluated_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE'
      },
      evaluation_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('evaluations');
  }
};
