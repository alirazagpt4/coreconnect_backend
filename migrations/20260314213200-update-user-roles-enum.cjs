'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'user', 'supervisor', 'brandadmin', 'ccadmin'),
      defaultValue: 'user',
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverse migration: Wapis purane roles par le jany ke liye
    // Yaad rahe: Agar DB mein 'brandadmin' ka data hua to ye fail ho jaye ga
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'user', 'supervisor'),
      defaultValue: 'user',
      allowNull: false
    });
  }
};