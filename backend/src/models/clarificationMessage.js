const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Append-only thread of every message tied to a ClarificationLog - AI drafts, the
// staff-approved and dispatched message, resend reminders, and logged vendor replies.
// Rows are never mutated after creation except approved_by/approved_at being stamped
// onto a 'draft' row - dispatching inserts a NEW 'sent' row (source_draft_id) rather
// than flipping the draft's message_type in place. No updated_at, per the schema doc.
const ClarificationMessage = sequelize.define('ClarificationMessage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  clarification_log_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  message_type: {
    type: DataTypes.ENUM('draft', 'sent', 'reminder', 'vendor_response'),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ai_generated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dispatch_channel: {
    type: DataTypes.ENUM('email', 'manual'),
    allowNull: true
  },
  source_draft_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'clarification_messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ClarificationMessage;
