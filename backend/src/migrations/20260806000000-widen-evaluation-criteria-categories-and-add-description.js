'use strict';

// Widens evaluation_criteria.category (and its evaluation_criterion_scores.category_snapshot
// mirror, which must stay in sync - snapshotting a widened category into the old,
// narrower enum would throw at evaluation-creation time) from ('price','quality') to
// also allow 'experience', 'capability', 'compliance', 'other', so criteria can cover
// the common tender evaluation areas beyond just price/quality. Also adds a nullable
// description column to evaluation_criteria - genuinely missing today, needed so staff
// can record what evaluators should assess for each criterion. Mirrors the existing
// enum-widening pattern from 20260101000016-alter-approvals-decision-enum.js.
const NEW_CATEGORIES = ['price', 'quality', 'experience', 'capability', 'compliance', 'other'];
const OLD_CATEGORIES = ['price', 'quality'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('evaluation_criteria', 'category', {
      type: Sequelize.ENUM(...NEW_CATEGORIES),
      allowNull: false
    });
    await queryInterface.changeColumn('evaluation_criterion_scores', 'category_snapshot', {
      type: Sequelize.ENUM(...NEW_CATEGORIES),
      allowNull: false
    });
    await queryInterface.addColumn('evaluation_criteria', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('evaluation_criteria', 'description');
    await queryInterface.changeColumn('evaluation_criterion_scores', 'category_snapshot', {
      type: Sequelize.ENUM(...OLD_CATEGORIES),
      allowNull: false
    });
    await queryInterface.changeColumn('evaluation_criteria', 'category', {
      type: Sequelize.ENUM(...OLD_CATEGORIES),
      allowNull: false
    });
  }
};
