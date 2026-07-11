const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// tender_id points at Zheng Hong's `tenders` table (Scope A). That model/migration
// isn't merged into this repo yet, so the belongsTo(Tender) association is deferred -
// see the note in models/index.js.
const Evaluation = sequelize.define('Evaluation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tender_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  quality_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  pqm_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  ai_extracted_inputs: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('processing', 'incomplete', 'scored', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'processing'
  },
  evaluated_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  evaluation_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'evaluations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Evaluation;
