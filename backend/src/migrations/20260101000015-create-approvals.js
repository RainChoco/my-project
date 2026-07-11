'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('approvals', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      evaluation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'evaluations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      approver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE'
      },
      decision: {
        type: Sequelize.ENUM('approved', 'rejected'),
        allowNull: false
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      decided_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('approvals');
  }
};
