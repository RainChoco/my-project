'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('eligibility_checks', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      tender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tenders',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      criterion: {
        type: Sequelize.ENUM('min_paid_up_capital', 'bca_fm01_license_valid', 'bca_fm01_tender_limit', 'non_debarment'),
        allowNull: false
      },
      threshold_value_used: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true
      },
      actual_value: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true
      },
      passed: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      source: {
        type: Sequelize.ENUM('ai_extracted', 'manual_override'),
        allowNull: false,
        defaultValue: 'ai_extracted'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      checked_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      checked_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('eligibility_checks');
  }
};
