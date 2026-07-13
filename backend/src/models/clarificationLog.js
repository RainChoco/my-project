const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Header row per clarification / notification thread (UC-D1, UC-D3, UC-D4, UC-D9).
// Individual messages live in ClarificationMessage, not on this row, so the full
// thread can be displayed and resent without overwriting history.
// The CHECK (resolved => outcome_notes NOT NULL) and the partial unique index
// guarding against a second in-flight pricing_deviation log per tender are enforced
// at the database layer by the create-clarification-logs migration, not here.
const ClarificationLog = sequelize.define('ClarificationLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tender_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  log_type: {
    type: DataTypes.ENUM('pricing_deviation', 'job_adjustment_notification'),
    allowNull: false,
    defaultValue: 'pricing_deviation'
  },
  status: {
    type: DataTypes.ENUM('flagged', 'no_action_required', 'draft_ready', 'approved', 'sent', 'responded', 'escalated', 'resolved'),
    allowNull: false,
    defaultValue: 'flagged'
  },
  main_offer_price_snapshot: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: true
  },
  alternative_offer_price_snapshot: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: true
  },
  deviation_amount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: true
  },
  deviation_percentage: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true
  },
  ai_rationale: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  follow_up_due_at: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  escalated_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  escalated_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  responded_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  response_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  outcome_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resolved_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'clarification_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ClarificationLog;
