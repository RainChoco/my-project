const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BcaGradeLimit = sequelize.define('BcaGradeLimit', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  grade: {
    type: DataTypes.ENUM('L1', 'L2', 'L3', 'L4', 'L5', 'L6'),
    allowNull: false
  },
  max_tender_value: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: true
  },
  effective_from: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  tableName: 'bca_grade_limits',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['grade', 'effective_from'] }
  ]
});

module.exports = BcaGradeLimit;
