'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Stores', 'supervisor_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users', // Target table name
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Stores', 'supervisor_id');
  }
};