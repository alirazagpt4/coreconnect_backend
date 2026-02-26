'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Yahan table ka naam wahi likhein jo 'SHOW TABLES' mein nazar aa raha hai
    // Agar Workbench mein 'Users' hai toh 'Users' likhein, agar 'User' hai toh 'User'
    await queryInterface.addColumn('Users', 'password', { 
      type: Sequelize.STRING,
      allowNull: false,
      after: 'name'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'password');
  }
};