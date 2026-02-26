'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'region_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Regions', // Table ka naam plural ('s' ke saath) check kar lena
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'city_id' // Isay city_id ke baad rakhne ke liye
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'region_id');
  }
};