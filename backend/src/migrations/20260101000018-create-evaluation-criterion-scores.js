'use strict';

// Manual per-criterion staff scoring (replaces the AI-extraction PQM flow).
// Snapshots criteria_name/category/weight_percentage at evaluation-creation time
// so later edits to evaluation_criteria never alter a historical evaluation's record.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('evaluation_criterion_scores', {
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
      evaluation_criteria_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'evaluation_criteria', key: 'id' },
        onUpdate: 'CASCADE'
      },
      criteria_name_snapshot: {
        type: Sequelize.STRING,
        allowNull: false
      },
      category_snapshot: {
        type: Sequelize.ENUM('price', 'quality'),
        allowNull: false
      },
      weight_percentage_snapshot: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      staff_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      weighted_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      remarks: {
        type: Sequelize.TEXT,
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

    await queryInterface.addConstraint('evaluation_criterion_scores', {
      fields: ['evaluation_id', 'evaluation_criteria_id'],
      type: 'unique',
      name: 'evaluation_criterion_scores_evaluation_criteria_unique'
    });

    await queryInterface.addConstraint('evaluation_criterion_scores', {
      fields: ['staff_score'],
      type: 'check',
      name: 'evaluation_criterion_scores_staff_score_check',
      where: {
        staff_score: {
          [Sequelize.Op.gte]: 0,
          [Sequelize.Op.lte]: 100
        }
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('evaluation_criterion_scores');
  }
};
