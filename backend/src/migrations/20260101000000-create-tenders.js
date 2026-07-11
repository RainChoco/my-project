'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tenders', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      tender_ref_no: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      vendor_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      submission_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      main_offer_price: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false
      },
      alternative_offer_price: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true
      },
      paid_up_capital: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true
      },
      bca_fm01_license_no: {
        type: Sequelize.STRING,
        allowNull: true
      },
      bca_fm01_grade: {
        type: Sequelize.ENUM('L1', 'L2', 'L3', 'L4', 'L5', 'L6'),
        allowNull: true
      },
      non_debarment_declared: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      eligibility_status: {
        type: Sequelize.ENUM('pending', 'eligible', 'flagged', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      ai_eligibility_summary: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'under_evaluation', 'approved', 'rejected', 'withdrawn'),
        allowNull: false,
        defaultValue: 'draft'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
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
    await queryInterface.dropTable('tenders');
  }
};
