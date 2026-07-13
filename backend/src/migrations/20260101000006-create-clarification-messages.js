'use strict';

// Append-only thread of every message tied to a clarification_logs row (drafts, sent
// notices, reminders, logged vendor replies). Rows are never mutated after creation
// except approved_by/approved_at being stamped onto a 'draft' row - a resend inserts a
// new 'sent' row (source_draft_id) instead. No updated_at, per database-schema.md.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clarification_messages', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      clarification_log_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clarification_logs',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      message_type: {
        type: Sequelize.ENUM('draft', 'sent', 'reminder', 'vendor_response'),
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: true
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      ai_generated: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      dispatch_channel: {
        type: Sequelize.ENUM('email', 'manual'),
        allowNull: true
      },
      source_draft_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'clarification_messages',
          key: 'id'
        }
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('clarification_messages');
  }
};
