const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Append-only decision log: no updated_at (rows are never edited), and no
// created_at either - decided_at is the single timestamp for this table
// (per database-schema.md's own column list, which the earlier `updatedAt: false`
// only snippet didn't fully match), so timestamps are disabled entirely here.
const Approval = sequelize.define('Approval', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  evaluation_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  approver_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  decision: {
    type: DataTypes.ENUM('approved', 'rejected'),
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isRequiredForRejection(value) {
        if (this.decision === 'rejected' && !value) {
          throw new Error('remarks is required when decision is "rejected"');
        }
      }
    }
  },
  decided_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'approvals',
  timestamps: false
});

module.exports = Approval;
