'use strict';

// Header row per clarification / notification thread (UC-D1, UC-D3, UC-D4, UC-D9).
// See design/sulaiman/database-schema.md for the full field-by-field rationale.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clarification_logs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
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
      log_type: {
        type: Sequelize.ENUM('pricing_deviation', 'job_adjustment_notification'),
        allowNull: false,
        defaultValue: 'pricing_deviation'
      },
      status: {
        type: Sequelize.ENUM('flagged', 'no_action_required', 'draft_ready', 'approved', 'sent', 'responded', 'escalated', 'resolved'),
        allowNull: false,
        defaultValue: 'flagged'
      },
      main_offer_price_snapshot: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true
      },
      alternative_offer_price_snapshot: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true
      },
      deviation_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true
      },
      deviation_percentage: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true
      },
      ai_rationale: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      follow_up_due_at: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      escalated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      escalated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      responded_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      response_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      outcome_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      resolved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      resolved_at: {
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

    // A resolution must always carry a documented outcome (UC-D9).
    await queryInterface.sequelize.query(`
      ALTER TABLE clarification_logs
      ADD CONSTRAINT chk_clarification_logs_resolved_outcome
      CHECK (status <> 'resolved' OR outcome_notes IS NOT NULL)
    `);

    // Prevents a second active pricing-deviation clarification being opened on the
    // same tender while one is already in flight.
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX clarification_logs_active_pricing_deviation_unique
      ON clarification_logs (tender_id)
      WHERE log_type = 'pricing_deviation' AND status NOT IN ('resolved', 'no_action_required')
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('clarification_logs');
  }
};
