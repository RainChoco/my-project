const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScoringArchive = sequelize.define('ScoringArchive', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tender_reference_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  archive_version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  archive_reason: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ranking_snapshot: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  archived_by: {
    type: DataTypes.UUID,
    allowNull: false
  },
  archived_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'scoring_archives',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['tender_reference_id', 'archive_version']
    }
  ]
});

module.exports = ScoringArchive;
