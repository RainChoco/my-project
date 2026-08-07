'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('board_papers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tenderId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      purpose: {
        type: Sequelize.STRING,
        allowNull: true
      },
      language: {
        type: Sequelize.STRING,
        defaultValue: 'English'
      },
      executiveSummary: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      background: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      scopeOfWork: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      financialAnalysis: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      riskAssessment: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      recommendation: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      confidence: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      score: {
        type: Sequelize.STRING,
        allowNull: true
      },
      finalRecommendation: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      preparedBy: {
        type: Sequelize.STRING,
        defaultValue: 'AI Summary Tool'
      },
      generatedBy: {
        type: Sequelize.STRING,
        defaultValue: 'EM Services AI Platform'
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'Generated'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('board_papers');
  }
};