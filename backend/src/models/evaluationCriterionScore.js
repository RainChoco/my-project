const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EvaluationCriterionScore = sequelize.define('EvaluationCriterionScore', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  evaluation_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  evaluation_criteria_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  criteria_name_snapshot: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category_snapshot: {
    type: DataTypes.ENUM('price', 'quality', 'experience', 'capability', 'compliance', 'other'),
    allowNull: false
  },
  weight_percentage_snapshot: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  staff_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: { min: 0, max: 100 }
  },
  weighted_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'evaluation_criterion_scores',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['evaluation_id', 'evaluation_criteria_id'],
      name: 'evaluation_criterion_scores_evaluation_criteria_unique'
    }
  ]
});

module.exports = EvaluationCriterionScore;