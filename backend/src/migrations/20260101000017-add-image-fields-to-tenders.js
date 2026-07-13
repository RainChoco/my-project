'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tenders', 'image_url', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('tenders', 'image_public_id', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tenders', 'image_url');
    await queryInterface.removeColumn('tenders', 'image_public_id');
  }
};
