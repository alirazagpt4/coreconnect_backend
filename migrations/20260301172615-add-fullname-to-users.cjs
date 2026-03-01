'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'fullname', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'name' // MySQL mein ye 'name' column ke foran baad aaye ga
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'fullname');
  }
};