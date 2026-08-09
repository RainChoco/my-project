'use strict';

// backend/src/models/BoardPaper.js defines `uploadedDocument`, but no prior
// migration ever created it on the board_papers table - the initial
// create-board-papers migration predates the field, and production only ever
// runs a plain sequelize.sync() (creates missing tables, never alters existing
// ones), so the live table never got this column. Any query touching it fails
// with `column "uploadedDocument" does not exist`.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('board_papers', 'uploadedDocument', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('board_papers', 'uploadedDocument');
  }
};
