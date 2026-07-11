const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EligibilityThreshold = sequelize.define('EligibilityThreshold', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  criterion_key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  threshold_value: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'eligibility_thresholds',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

module.exports = EligibilityThreshold;
