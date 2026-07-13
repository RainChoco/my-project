'use strict';

// A scope/timeline/terms change implied by a vendor's response, logged and routed for
// approval separately from the pricing clarification itself (UC-D7).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_adjustment_requests', {
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
      source_message_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'clarification_messages',
          key: 'id'
        }
      },
      tender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tenders',
          key: 'id'
        },
        onDelete: 'RESTRICT'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      justification: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      is_material: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      approval_status: {
        type: Sequelize.ENUM('pending_approval', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending_approval'
      },
      follow_up_clarification_log_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true,
        references: {
          model: 'clarification_logs',
          key: 'id'
        }
      },
      requested_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('job_adjustment_requests');
  }
};
