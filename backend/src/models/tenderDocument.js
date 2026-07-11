const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TenderDocument = sequelize.define('TenderDocument', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tender_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file_type: {
    type: DataTypes.ENUM('main_offer', 'alternative_offer', 'license', 'other'),
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
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  is_latest: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  uploaded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tender_documents',
  timestamps: false
});

module.exports = TenderDocument;
