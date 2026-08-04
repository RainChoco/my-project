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
  }
}, {
  timestamps: true,
  tableName: 'Contracts'
});

module.exports = Contract;
