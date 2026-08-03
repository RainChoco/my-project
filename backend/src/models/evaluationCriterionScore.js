const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Manual per-criterion staff scoring (replaces the AI-extraction PQM flow).
// The *_snapshot columns freeze the criterion's name/category/weight as they
// were when this evaluation was created, so a later edit to evaluation_criteria
// never alters a historical record.
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
    type: DataTypes.ENUM('price', 'quality'),
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
  updatedAt: 'updated_at'
});

module.exports = EvaluationCriterionScore;
