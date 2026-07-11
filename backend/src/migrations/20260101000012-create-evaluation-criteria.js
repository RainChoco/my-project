'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('evaluation_criteria', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      criteria_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('price', 'quality'),
        allowNull: false
      },
      weight_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE'
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

    await queryInterface.addConstraint('evaluation_criteria', {
      fields: ['weight_percentage'],
      type: 'check',
      name: 'evaluation_criteria_weight_percentage_check',
      where: {
        weight_percentage: {
          [Sequelize.Op.gt]: 0,
          [Sequelize.Op.lte]: 100
        }
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('evaluation_criteria');
  }
};
