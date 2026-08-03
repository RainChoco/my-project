'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('scoring_archives', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tender_reference_id: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      archive_version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      archive_reason: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      ranking_snapshot: {
        type: Sequelize.JSON,
        allowNull: false
      },
      archived_by: {
        type: Sequelize.UUID,
        allowNull: false
      },
      archived_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
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

    // Unique constraint: one archive version per tender/contract reference
    await queryInterface.addIndex('scoring_archives', ['tender_reference_id', 'archive_version'], {
      unique: true,
      name: 'scoring_archives_tender_reference_id_archive_version_unique'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('scoring_archives');
  }
};
