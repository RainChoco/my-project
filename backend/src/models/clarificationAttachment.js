const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Supporting documents a vendor liaison attaches when logging a vendor's response
// (UC-D5). Mirrors the Cloudinary field pattern used elsewhere in the project.
// uploaded_at is the single timestamp for this table - timestamps are disabled
// entirely since there's no created_at/updated_at in the schema doc.
const ClarificationAttachment = sequelize.define('ClarificationAttachment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  clarification_message_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  original_filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cloudinary_public_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resource_type: {
    type: DataTypes.ENUM('image', 'raw'),
    allowNull: false,
    defaultValue: 'raw'
  },
  format: {
    type: DataTypes.STRING,
    allowNull: true
  },
  file_size_bytes: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  uploaded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'clarification_attachments',
  timestamps: false
});

module.exports = ClarificationAttachment;
