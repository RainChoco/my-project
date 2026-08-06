'use strict';

// Optional "Additional Vendor & Compliance Information" fields on the New Tender
// creation form - vendor verification, commercial terms, and accreditation details.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tenders', 'vendor_uen', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('tenders', 'contact_person_name', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('tenders', 'contact_person_email', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('tenders', 'proposed_completion_months', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('tenders', 'tender_validity_days', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 90
    });
    await queryInterface.addColumn('tenders', 'bizsafe_level', {
      type: Sequelize.ENUM('None', 'Level 1', 'Level 2', 'Level 3', 'STAR'),
      allowNull: true,
      defaultValue: 'None'
    });
    await queryInterface.addColumn('tenders', 'conflict_of_interest_declared', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tenders', 'vendor_uen');
    await queryInterface.removeColumn('tenders', 'contact_person_name');
    await queryInterface.removeColumn('tenders', 'contact_person_email');
    await queryInterface.removeColumn('tenders', 'proposed_completion_months');
    await queryInterface.removeColumn('tenders', 'tender_validity_days');
    await queryInterface.removeColumn('tenders', 'bizsafe_level');
    await queryInterface.removeColumn('tenders', 'conflict_of_interest_declared');
  }
};
