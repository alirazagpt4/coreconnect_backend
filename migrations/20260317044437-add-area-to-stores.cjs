'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Stores', 'area', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'store_name' // Ye column ko store_name ke baad rakhay ga
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Stores', 'area');
  }
};