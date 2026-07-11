'use strict';

// Widens approvals.decision from ('approved','rejected') to also allow
// 'revision_requested', per team direction (diverges from database-schema.md/
// api-documentation.md, which only define the first two values).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('approvals', 'decision', {
      type: Sequelize.ENUM('approved', 'rejected', 'revision_requested'),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('approvals', 'decision', {
      type: Sequelize.ENUM('approved', 'rejected'),
      allowNull: false
    });
  }
};
