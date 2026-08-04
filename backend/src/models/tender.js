const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tender = sequelize.define('Tender', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tender_ref_no: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  vendor_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  submission_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  main_offer_price: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false
  },
  alternative_offer_price: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: true
  },
  paid_up_capital: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: true
  },
  bca_fm01_license_no: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bca_fm01_grade: {
    type: DataTypes.ENUM('L1', 'L2', 'L3', 'L4', 'L5', 'L6'),
    allowNull: true
  },
  non_debarment_declared: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  eligibility_status: {
    type: DataTypes.ENUM('pending', 'eligible', 'flagged', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
  ai_eligibility_summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'under_evaluation', 'approved', 'rejected', 'withdrawn'),
    allowNull: false,
    defaultValue: 'draft'
  },
  contractId: {
    type: DataTypes.STRING,
    allowNull: true,   // allowNull:true so alter:true doesn't break existing rows
    references: { model: 'Contracts', key: 'id' }
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  image_public_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // -- Additional Vendor & Compliance Information (optional, create-form only) --
  vendor_uen: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contact_person_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contact_person_email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: true }
  },
  proposed_completion_months: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tender_validity_days: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 90
  },
  bizsafe_level: {
    type: DataTypes.ENUM('None', 'Level 1', 'Level 2', 'Level 3', 'STAR'),
    allowNull: true,
    defaultValue: 'None'
  },
  conflict_of_interest_declared: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'tenders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Tender;
