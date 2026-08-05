const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contract = sequelize.define('Contract', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  budgetLimit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  openingDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  closingDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Draft',
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // -- Contract Terms & Legal Framework --
  securityDepositAmount: {
    type: DataTypes.DECIMAL(12, 2),
  },
  bankGuaranteeTerms: {
    type: DataTypes.TEXT,
  },
  publicLiabilityInsuranceMin: {
    type: DataTypes.DECIMAL(12, 2),
  },
  publicLiabilityInsuranceMax: {
    type: DataTypes.DECIMAL(12, 2),
  },
  monthlyManagementFeeRate: {
    type: DataTypes.DECIMAL(10, 2),
  },
  contractStartDate: {
    type: DataTypes.DATE,
  },
  contractEndDate: {
    type: DataTypes.DATE,
  },
  optionToExtend: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  defectsLiabilityPeriodMonths: {
    type: DataTypes.INTEGER,
  },
  terminationNoticePeriodDays: {
    type: DataTypes.INTEGER,
  },
  // -- Contract Identification & Scope --
  contractRefNo: {
    type: DataTypes.STRING,
  },
  townCouncilName: {
    type: DataTypes.STRING,
  },
  estateZoneScope: {
    type: DataTypes.TEXT,
  },
  // -- Duration & Extension detail --
  contractDurationMonths: {
    type: DataTypes.INTEGER,
  },
  extensionTerms: {
    type: DataTypes.STRING,
  },
  // -- Commercial & Payment Terms --
  awardedContractSum: {
    type: DataTypes.DECIMAL(14, 2),
  },
  paymentMilestones: {
    type: DataTypes.TEXT,
  },
  liquidatedDamagesRate: {
    type: DataTypes.DECIMAL(10, 2),
  },
  // -- Insurance, Security Deposit & Legal Framework --
  performanceGuaranteePercent: {
    type: DataTypes.DECIMAL(5, 2),
  },
  wicaInsuranceCap: {
    type: DataTypes.DECIMAL(12, 2),
  },
  minBizsafeLevel: {
    type: DataTypes.STRING,
  },
  governingLawFramework: {
    type: DataTypes.TEXT,
  }
}, {
  timestamps: true,
  tableName: 'Contracts'
});

module.exports = Contract;
