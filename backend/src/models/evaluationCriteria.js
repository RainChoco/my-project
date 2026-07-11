const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EvaluationCriteria = sequelize.define('EvaluationCriteria', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  criteria_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('price', 'quality'),
    allowNull: false
  },
  weight_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: { min: 0.01, max: 100 }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'evaluation_criteria',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = EvaluationCriteria;
