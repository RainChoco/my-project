const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: path.join(__dirname, 'tender_db.sqlite'), logging: false });
const Tender = sequelize.define('Tender', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  tender_ref_no: { type: DataTypes.STRING, allowNull: false, unique: true },
  vendor_name: { type: DataTypes.STRING, allowNull: false },
  submission_date: { type: DataTypes.DATEONLY, allowNull: false },
  main_offer_price: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  alternative_offer_price: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  paid_up_capital: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  bca_fm01_license_no: { type: DataTypes.STRING, allowNull: true },
  bca_fm01_grade: { type: DataTypes.ENUM('L1', 'L2', 'L3', 'L4', 'L5', 'L6'), allowNull: true },
  non_debarment_declared: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  eligibility_status: { type: DataTypes.ENUM('pending', 'eligible', 'flagged', 'rejected'), allowNull: false, defaultValue: 'pending' },
  ai_eligibility_summary: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('draft', 'submitted', 'under_evaluation', 'approved', 'rejected', 'withdrawn'), allowNull: false, defaultValue: 'draft' },
  contractId: { type: DataTypes.STRING, allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
  image_url: { type: DataTypes.STRING, allowNull: true },
  image_public_id: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'tenders', timestamps: true });

async function test() {
  try {
    const tenders = await Tender.findAll();
    console.log("Success", tenders.length);
  } catch(e) {
    console.error("FAILED: ", e.message);
  }
}
test();
