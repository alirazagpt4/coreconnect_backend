'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Role Column Add Karna (ENUM ke sath)
    await queryInterface.addColumn('Users', 'role', {
      type: Sequelize.ENUM('user', 'admin', 'supervisor'),
      defaultValue: 'user',
      after: 'designation_id'
    });

    // 2. reportTo Column Add Karna (Self-referencing Foreign Key)
    await queryInterface.addColumn('Users', 'reportTo', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users', // Apne hi table ko refer kar raha hai
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'role'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'role');
    await queryInterface.removeColumn('Users', 'reportTo');
  }
};