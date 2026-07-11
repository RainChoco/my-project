'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('eligibility_thresholds', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      criterion_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      threshold_value: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('eligibility_thresholds');
  }
};
