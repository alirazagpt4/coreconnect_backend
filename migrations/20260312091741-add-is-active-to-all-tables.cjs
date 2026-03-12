'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Aapke exact table names
    const tables = [
      'Users',
      'Stores',
      'Categories',
      'SubCategories',
      'ItemMasters'
    ];

    for (const table of tables) {
      await queryInterface.addColumn(table, 'is_active', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = [
      'Users',
      'Stores',
      'Categories',
      'SubCategories',
      'ItemMasters'
    ];

    for (const table of tables) {
      await queryInterface.removeColumn(table, 'is_active');
    }
  }
};