const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EligibilityCheck = sequelize.define('EligibilityCheck', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tender_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  criterion: {
    type: DataTypes.ENUM('min_paid_up_capital', 'bca_fm01_license_valid', 'bca_fm01_tender_limit', 'non_debarment'),
    allowNull: false
  },
  threshold_value_used: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: true
  },
  actual_value: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: true
  },
  passed: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  source: {
    type: DataTypes.ENUM('ai_extracted', 'manual_override'),
    allowNull: false,
    defaultValue: 'ai_extracted'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  checked_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  checked_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'eligibility_checks',
  timestamps: false
});

module.exports = EligibilityCheck;
