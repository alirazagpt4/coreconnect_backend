'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Stores', 'ba_user_id_2', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users', // Make sure your Users table name is correct
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Stores', 'ba_user_id_2');
  }
};