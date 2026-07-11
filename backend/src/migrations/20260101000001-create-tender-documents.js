'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tender_documents', {
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
        onDelete: 'CASCADE'
      },
      file_type: {
        type: Sequelize.ENUM('main_offer', 'alternative_offer', 'license', 'other'),
        allowNull: false
      },
      original_filename: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cloudinary_public_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      resource_type: {
        type: Sequelize.ENUM('image', 'raw'),
        allowNull: false,
        defaultValue: 'raw'
      },
      format: {
        type: Sequelize.STRING,
        allowNull: true
      },
      file_size_bytes: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      is_latest: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tender_documents');
  }
};
