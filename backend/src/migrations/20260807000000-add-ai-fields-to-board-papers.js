'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('board_papers', 'aiSummary', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('board_papers', 'aiFinancialAnalysis', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('board_papers', 'aiRiskAssessment', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('board_papers', 'aiRecommendation', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('board_papers', 'aiConfidenceText', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('board_papers', 'aiRiskLevel', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('board_papers', 'aiSummary');
    await queryInterface.removeColumn('board_papers', 'aiFinancialAnalysis');
    await queryInterface.removeColumn('board_papers', 'aiRiskAssessment');
    await queryInterface.removeColumn('board_papers', 'aiRecommendation');
    await queryInterface.removeColumn('board_papers', 'aiConfidenceText');
    await queryInterface.removeColumn('board_papers', 'aiRiskLevel');
  }
};
