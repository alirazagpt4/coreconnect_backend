'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interceptions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      report_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      intercepted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      converted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      ratio: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0
      },
      ba_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // Apki users table ka naam
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Stores', // Apki stores table ka naam
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('interceptions');
  }
};