'use strict';

// Supporting documents a vendor liaison attaches when logging a vendor's response
// (UC-D5). Mirrors the Cloudinary field pattern used elsewhere in the project.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clarification_attachments', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      clarification_message_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clarification_messages',
          key: 'id'
        },
        onDelete: 'CASCADE'
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
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('clarification_attachments');
  }
};
