'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ShortItemDetails', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      after: 'item_id' // Yeh column ko item_id ke baad place karega (Optional)
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ShortItemDetails', 'quantity');
  }
};