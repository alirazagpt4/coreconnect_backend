'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'address', {
      type: Sequelize.TEXT, // Kyunke address lamba bhi ho sakta hai
      allowNull: true,
      after: 'cnic'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'address');
  }
};