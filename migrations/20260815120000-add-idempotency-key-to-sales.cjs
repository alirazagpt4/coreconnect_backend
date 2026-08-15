'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Sales', 'idempotency_key', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
      after: 'ba_user_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Sales', 'idempotency_key');
  }
};
