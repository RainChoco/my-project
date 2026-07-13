const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// A scope/timeline/terms change implied by a vendor's response, logged and routed for
// approval separately from the pricing clarification itself (UC-D7).
const JobAdjustmentRequest = sequelize.define('JobAdjustmentRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  clarification_log_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  source_message_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tender_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  justification: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_material: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  approval_status: {
    type: DataTypes.ENUM('pending_approval', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending_approval'
  },
  follow_up_clarification_log_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true
  },
  requested_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'job_adjustment_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = JobAdjustmentRequest;
