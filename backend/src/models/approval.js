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
    // 'revision_requested' added per team direction - beyond the two values in
    // database-schema.md/api-documentation.md. It does not map to an
    // evaluations.status value (see approvalService.js) - the evaluation stays
    // 'scored' so the evaluator can revise and resubmit.
    type: DataTypes.ENUM('approved', 'rejected', 'revision_requested'),
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isRequiredForRejectionOrRevision(value) {
        if ((this.decision === 'rejected' || this.decision === 'revision_requested') && !value) {
          throw new Error('remarks is required when decision is "rejected" or "revision_requested"');
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
