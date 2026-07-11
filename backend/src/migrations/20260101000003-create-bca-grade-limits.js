'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bca_grade_limits', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      grade: {
        type: Sequelize.ENUM('L1', 'L2', 'L3', 'L4', 'L5', 'L6'),
        allowNull: false
      },
      max_tender_value: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true
      },
      effective_from: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('bca_grade_limits', ['grade', 'effective_from'], {
      unique: true,
      name: 'bca_grade_limits_grade_effective_from_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('bca_grade_limits');
  }
};
